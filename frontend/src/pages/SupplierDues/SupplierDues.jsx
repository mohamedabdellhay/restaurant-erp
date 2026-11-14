import { useEffect, useMemo, useState } from "react";
import { Pencil, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import { useRestaurant } from "@hooks/useRestaurant";
import supplierService from "@services/supplierService";
import { formatMoney } from "../../utils/money";
import "./SupplierDues.css";

function notesKey(restaurantId) {
  return `supplierDueNotes:${restaurantId || "restaurant"}`;
}

function readNotes(restaurantId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(notesKey(restaurantId)) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function money(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function transactionsOf(result) {
  const body = result?.data ?? result;
  const rows = body?.transactions || body?.data?.transactions;
  return Array.isArray(rows) ? rows : [];
}

function buildRows(suppliers, statements, notes, outletName) {
  const rows = [];
  suppliers.forEach((supplier, index) => {
    const purchases = transactionsOf(statements[index])
      .filter((entry) => entry.type === "purchase")
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    let remainingPaid = transactionsOf(statements[index])
      .filter((entry) => entry.type === "payment")
      .reduce((sum, entry) => sum + money(entry.amount), 0);
    purchases.forEach((purchase) => {
      const total = money(purchase.amount);
      const paid = money(Math.min(remainingPaid, total));
      remainingPaid = money(remainingPaid - paid);
      const note = notes[purchase._id] || {};
      rows.push({
        id: purchase._id,
        supplierId: supplier._id,
        outlet: note.outlet ?? outletName,
        poNumber: note.poNumber || "",
        grnNumber: note.grnNumber || "",
        invoiceNo: note.invoiceNo || "",
        supplierName: supplier.name,
        total,
        paid,
        due: money(total - paid),
        date: purchase.createdAt,
      });
    });
  });
  return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

const SupplierDues = () => {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const { getRestaurantId, getRestaurantName, getCurrency } = useRestaurant();
  const restaurantId = getRestaurantId();
  const currency = getCurrency();
  const canManage = hasPermission("manage_inventory");
  const [suppliers, setSuppliers] = useState([]);
  const [statements, setStatements] = useState([]);
  const [notes, setNotes] = useState({});
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(null);
  const [payment, setPayment] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = async () => {
    try {
      setLoading(true);
      const result = await supplierService.getAll();
      const list = result?.data || [];
      const books = await Promise.all(list.map((supplier) => supplierService.getStatement(supplier._id).catch(() => null)));
      setSuppliers(list);
      setStatements(books);
      setNotes(readNotes(restaurantId));
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("suppliers.error_loading_suppliers") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [restaurantId]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const rows = useMemo(
    () => buildRows(suppliers, statements, notes, getRestaurantName()),
    [suppliers, statements, notes, getRestaurantName],
  );

  const visible = rows.filter((row) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [row.outlet, row.poNumber, row.grnNumber, row.invoiceNo, row.supplierName].join(" ").toLowerCase().includes(term);
  });

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(i18n.language, { day: "2-digit", month: "short", year: "numeric" });
  };

  const text = (value) => value || "—";

  const openEdit = (row) => {
    setPayment("");
    setDraft({ ...row });
  };

  const save = async (event) => {
    event.preventDefault();
    const amount = money(payment);
    if (amount > draft.due) {
      setMessage({ type: "error", text: t("nav.supplier_due_overpay") });
      return;
    }
    const next = {
      ...notes,
      [draft.id]: {
        outlet: draft.outlet.trim(),
        poNumber: draft.poNumber.trim(),
        grnNumber: draft.grnNumber.trim(),
        invoiceNo: draft.invoiceNo.trim(),
      },
    };
    localStorage.setItem(notesKey(restaurantId), JSON.stringify(next));
    setNotes(next);
    try {
      if (amount > 0) {
        await supplierService.recordPayment(draft.supplierId, {
          amount,
          description: draft.invoiceNo.trim() || draft.poNumber.trim() || t("nav.supplier_dues"),
        });
        await load();
      }
      setMessage({ type: "success", text: t("nav.supplier_due_saved") });
      setDraft(null);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("suppliers.error_recording_payment") });
    }
  };

  return (
    <div className="supplier-dues">
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.supplier_dues")}</h1>
      <label className="supplier-dues-search">
        <Search size={15} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("inventory.quick_search")}
          aria-label={t("inventory.quick_search")}
        />
      </label>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.supplier_due_outlet")}</th>
              <th>{t("nav.supplier_due_po")}</th>
              <th>{t("nav.supplier_due_grn")}</th>
              <th>{t("nav.supplier_due_invoice")}</th>
              <th>{t("nav.supplier_due_supplier")}</th>
              <th>{t("nav.supplier_due_total")}</th>
              <th>{t("nav.supplier_due_paid")}</th>
              <th>{t("nav.supplier_due_due")}</th>
              <th>{t("nav.supplier_due_date")}</th>
              <th>{t("inventory.action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10}>{t("common.loading")}</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={10}>{t("nav.supplier_due_empty")}</td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id}>
                  <td>{text(row.outlet)}</td>
                  <td>{text(row.poNumber)}</td>
                  <td>{text(row.grnNumber)}</td>
                  <td>{text(row.invoiceNo)}</td>
                  <td>{row.supplierName}</td>
                  <td>{formatMoney(row.total, currency)}</td>
                  <td>{formatMoney(row.paid, currency)}</td>
                  <td>{formatMoney(row.due, currency)}</td>
                  <td>{formatDate(row.date)}</td>
                  <td>
                    {canManage && (
                      <button type="button" className="supplier-dues-edit" aria-label={t("common.edit")} onClick={() => openEdit(row)}>
                        <Pencil size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="supplier-dues-overlay">
          <form className="supplier-dues-dialog" onSubmit={save}>
            <header>
              <h2>{draft.supplierName}</h2>
              <button type="button" aria-label={t("common.close")} onClick={() => setDraft(null)}>
                <X size={18} />
              </button>
            </header>
            <label>
              {t("nav.supplier_due_outlet")}
              <input value={draft.outlet} onChange={(event) => setDraft({ ...draft, outlet: event.target.value })} />
            </label>
            <label>
              {t("nav.supplier_due_po")}
              <input value={draft.poNumber} onChange={(event) => setDraft({ ...draft, poNumber: event.target.value })} />
            </label>
            <label>
              {t("nav.supplier_due_grn")}
              <input value={draft.grnNumber} onChange={(event) => setDraft({ ...draft, grnNumber: event.target.value })} />
            </label>
            <label>
              {t("nav.supplier_due_invoice")}
              <input value={draft.invoiceNo} onChange={(event) => setDraft({ ...draft, invoiceNo: event.target.value })} />
            </label>
            <p>
              <span>{t("nav.supplier_due_total")}</span>
              <strong>{formatMoney(draft.total, currency)}</strong>
            </p>
            <p>
              <span>{t("nav.supplier_due_paid")}</span>
              <strong>{formatMoney(draft.paid, currency)}</strong>
            </p>
            <p>
              <span>{t("nav.supplier_due_due")}</span>
              <strong>{formatMoney(draft.due, currency)}</strong>
            </p>
            <label>
              {t("nav.supplier_due_payment")}
              <input
                inputMode="decimal"
                value={payment}
                onChange={(event) => setPayment(event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
              />
            </label>
            <footer>
              <button type="button" className="supplier-dues-cancel" onClick={() => setDraft(null)}>
                {t("common.cancel")}
              </button>
              <button type="submit" className="supplier-dues-save">
                {t("common.save")}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
};

export default SupplierDues;
