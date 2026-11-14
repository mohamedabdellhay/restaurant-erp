import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpDown, ChevronDown, Download, Eye, ListFilter, Pencil, Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRestaurant } from "@hooks/useRestaurant";
import inventoryService from "@services/inventoryService";
import { formatMoney } from "../../utils/money";
import "./PurchaseReturns.css";

const EMPTY_FORM = {
  id: "",
  direction: "send",
  date: "",
  sourceDate: "",
  number: "",
  returnedTo: "",
};

function storageKey(restaurantId) {
  return `purchaseReturns:${restaurantId || "restaurant"}`;
}

function readRows(restaurantId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(restaurantId)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sameNumber(left, right) {
  const clean = (value) => String(value || "").replace(/[#\s]/g, "").toLowerCase();
  return clean(left) === clean(right);
}

function readList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readDocuments(restaurantId) {
  const id = restaurantId || "restaurant";
  const orders = readList(`purchaseOrders:${id}`)
    .filter((row) => row.number)
    .map((row) => ({
      id: row.id,
      kind: "po",
      number: row.number,
      date: row.date || "",
      returnedTo: row.supplierName || "",
      items: (row.items || []).map((item) => ({
        itemId: item.itemId,
        name: item.name,
        unit: item.unit || "",
        qty: item.qty,
        price: item.price,
      })),
    }));
  const requisitions = readList(`requisitions:${id}`)
    .filter((row) => row.number)
    .map((row) => ({
      id: row.id,
      kind: "requisition",
      number: row.number,
      date: row.date || "",
      returnedTo: row.destination || "",
      items: (row.items || []).map((item) => ({
        itemId: item.itemId,
        name: item.name,
        unit: item.unit || "",
        qty: item.required ?? item.qty ?? 0,
        price: item.price,
      })),
    }));
  return [...orders, ...requisitions];
}

const PurchaseReturns = () => {
  const { t } = useTranslation();
  const { getRestaurantId, getCurrency } = useRestaurant();
  const restaurantId = getRestaurantId();
  const currency = getCurrency();
  const [rows, setRows] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [direction, setDirection] = useState("send");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    setRows(readRows(restaurantId));
    setDocuments(readDocuments(restaurantId));
    inventoryService
      .getAll()
      .then((result) => setSupplies(result?.data || []))
      .catch(() => setSupplies([]));
  }, [restaurantId]);

  const saveRows = (next) => {
    setRows(next);
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(next));
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  };

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const next = rows.filter((row) => {
      if ((row.direction || "send") !== direction) return false;
      if (filter === "po" && !/po/i.test(row.number || "")) return false;
      if (filter === "requisition" && !/re/i.test(row.number || "")) return false;
      if (!term) return true;
      return [row.number, row.returnedTo].join(" ").toLowerCase().includes(term);
    });
    next.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (sort === "newest") next.reverse();
    return next;
  }, [rows, direction, query, sort, filter]);

  const openCreate = () => {
    setViewing(null);
    setForm({
      ...EMPTY_FORM,
      direction,
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const draft = form || EMPTY_FORM;

  const addInvoice = (event) => {
    event.preventDefault();
    const number = draft.number.trim();
    if (!number) return;
    const source = documents.find((item) => sameNumber(item.number, number));
    if (!source) {
      setForm({ ...draft, number, loaded: false, sourceKind: "", notice: t("nav.purchase_return_missing"), items: [] });
      return;
    }
    const priceOf = (item) => {
      if (item.price !== undefined && item.price !== "") return Number(item.price) || 0;
      const supply = supplies.find((entry) => entry._id === item.itemId);
      return Number(supply?.costPrice) || 0;
    };
    setForm({
      ...draft,
      number: source.number,
      sourceDate: source.date,
      returnedTo: source.returnedTo,
      sourceKind: source.kind,
      loaded: true,
      notice: "",
      items: source.items.map((item) => ({
        ...item,
        price: priceOf(item),
        returnQty: "0",
        reason: "",
      })),
    });
  };

  const updateLine = (itemId, patch) => {
    setForm((current) => ({
      ...current,
      items: (current.items || []).map((line) => (line.itemId === itemId ? { ...line, ...patch } : line)),
    }));
  };

  const lineTotal = (line) => (Number(line.qty) || 0) * (Number(line.price) || 0);

  const returnTotal = (draft.items || []).reduce(
    (sum, line) => sum + (Number(line.returnQty) || 0) * (Number(line.price) || 0),
    0,
  );

  const submitReturn = (event) => {
    event.preventDefault();
    if (!draft.number) return;
    const record = {
      id: draft.id || crypto.randomUUID(),
      direction: draft.direction || direction,
      date: draft.date || new Date().toISOString().slice(0, 10),
      sourceDate: draft.sourceDate || "",
      number: draft.number,
      returnedTo: draft.returnedTo || "",
      sourceKind: draft.sourceKind || "",
      items: draft.items || [],
    };
    const next = draft.id ? rows.map((row) => (row.id === draft.id ? record : row)) : [record, ...rows];
    saveRows(next);
    setDirection(record.direction);
    setForm(null);
  };

  const downloadRow = (row) => {
    const text = [
      `${t("nav.purchase_return_date")}: ${formatDate(row.date)}`,
      `${t("nav.purchase_return_source_date")}: ${formatDate(row.sourceDate)}`,
      `${t("nav.purchase_return_no")}: ${row.number}`,
      `${t("nav.purchase_return_to")}: ${row.returnedTo}`,
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${row.number || "return"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (form) {
    const loaded = Boolean(form.loaded);
    return (
      <div className="return-page">
        {loaded ? (
          <h1>{t("nav.purchase_return_title")}</h1>
        ) : (
          <button type="button" className="return-back" onClick={() => setForm(null)}>
            <ArrowLeft size={18} />
            {t("nav.purchase_return_add")}
          </button>
        )}
        <section className="return-sheet">
          <form className="return-invoice" onSubmit={addInvoice}>
            <label htmlFor="return-invoice">{t("nav.purchase_return_invoice")}</label>
            <input
              id="return-invoice"
              value={form.number}
              onChange={(event) => setForm({ ...form, number: event.target.value, loaded: false })}
            />
            <button type="submit" className="return-plus" aria-label={t("nav.purchase_return_add")}>
              <Plus size={16} />
            </button>
            {loaded && (
              <>
                <span className="return-meta">
                  {t(form.sourceKind === "requisition" ? "nav.purchase_return_requisition_date" : "nav.purchase_return_purchase_date")}: <strong>{formatDate(form.sourceDate)}</strong>
                </span>
                <span className="return-meta">
                  {t(form.sourceKind === "requisition" ? "nav.purchase_return_warehouse" : "nav.purchase_return_supplier")}: <strong>{form.returnedTo || "—"}</strong>
                </span>
              </>
            )}
          </form>
          {form.notice && <p className="return-notice">{form.notice}</p>}
          {loaded && (
            <>
              <div className="return-line head">
                <span>{t("nav.purchase_return_item")}</span>
                <span>{t("nav.purchase_return_qty")}</span>
                <span>{t("nav.purchase_return_price", { currency })}</span>
                <span>{t("nav.purchase_return_return_qty")}</span>
                <span>{t("nav.purchase_return_reason")}</span>
              </div>
              <div className="return-lines">
                {(form.items || []).map((line) => (
                  <div key={line.itemId || line.name} className="return-line">
                    <span>{line.name}{line.unit ? ` (${line.unit})` : ""}</span>
                    <span>{line.qty}</span>
                    <span>{formatMoney(lineTotal(line), currency)}</span>
                    <input
                      inputMode="decimal"
                      aria-label={t("nav.purchase_return_return_qty")}
                      value={line.returnQty}
                      onChange={(event) => {
                        let value = event.target.value.replace(/[^\d.]/g, "");
                        if (value && Number(value) > Number(line.qty || 0)) value = String(line.qty);
                        updateLine(line.itemId, { returnQty: value });
                      }}
                    />
                    <input
                      aria-label={t("nav.purchase_return_reason")}
                      placeholder={t("nav.purchase_return_reason_placeholder")}
                      value={line.reason}
                      onChange={(event) => updateLine(line.itemId, { reason: event.target.value })}
                    />
                  </div>
                ))}
                {(form.items || []).length === 0 && <p className="return-empty">{t("nav.purchase_return_no_lines")}</p>}
              </div>
              <div className="return-total">
                <span>{t("nav.purchase_return_total", { currency })}</span>
                <strong>{formatMoney(returnTotal, currency)}</strong>
              </div>
            </>
          )}
        </section>
        {loaded && (
          <div className="return-sheet-actions">
            <button type="button" className="return-cancel" onClick={() => setForm(null)}>{t("nav.purchase_cancel")}</button>
            <button type="button" className="return-new" onClick={submitReturn}>{t("nav.purchase_submit")}</button>
          </div>
        )}
      </div>
    );
  }

  if (viewing) {
    return (
      <div className="return-page">
        <button type="button" className="return-back" onClick={() => setViewing(null)}>
          <ArrowLeft size={18} />
          {t("nav.purchase_return_title")}
        </button>
        <section className="return-card return-detail">
          <h2>{viewing.number}</h2>
          <p><span>{t("nav.purchase_return_date")}</span><strong>{formatDate(viewing.date)}</strong></p>
          <p><span>{t("nav.purchase_return_source_date")}</span><strong>{formatDate(viewing.sourceDate)}</strong></p>
          <p><span>{t("nav.purchase_return_no")}</span><strong>{viewing.number}</strong></p>
          <p><span>{t("nav.purchase_return_to")}</span><strong>{viewing.returnedTo}</strong></p>
        </section>
      </div>
    );
  }

  return (
    <div className="return-page">
      <div className="return-title">
        <h1>{t("nav.purchase_return_title")}</h1>
        <div className="return-tabs">
          <button type="button" className={direction === "send" ? "active" : ""} onClick={() => setDirection("send")}>
            {t("nav.purchase_return_send")}
          </button>
          <button type="button" className={direction === "receive" ? "active" : ""} onClick={() => setDirection("receive")}>
            {t("nav.purchase_return_receive")}
          </button>
        </div>
      </div>
      <section className="return-card">
        <div className="return-tools">
          <label className="return-search">
            <Search size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("nav.purchase_search")} />
          </label>
          <label className="return-menu">
            <ArrowUpDown size={14} />
            <span>{t("nav.requisition_sort")}</span>
            <ChevronDown size={14} />
            <select aria-label={t("nav.requisition_sort")} value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">{t("nav.purchase_return_newest")}</option>
              <option value="oldest">{t("nav.purchase_return_oldest")}</option>
            </select>
          </label>
          <label className="return-menu">
            <ListFilter size={14} />
            <span>{t("nav.requisition_filter")}</span>
            <ChevronDown size={14} />
            <select aria-label={t("nav.requisition_filter")} value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">{t("nav.requisition_all")}</option>
              <option value="po">{t("nav.po")}</option>
              <option value="requisition">{t("nav.requisition")}</option>
            </select>
          </label>
          <button type="button" className="return-new" onClick={openCreate}>
            <Plus size={16} />
            {t("nav.purchase_return_new")}
          </button>
        </div>
        <div className="return-table">
          <div className="return-row head">
            <span>{t("nav.purchase_return_date")}</span>
            <span>{t("nav.purchase_return_source_date")}</span>
            <span>{t("nav.purchase_return_no")}</span>
            <span>{t("nav.purchase_return_to")}</span>
            <span>{t("nav.requisition_actions")}</span>
          </div>
          {visible.length === 0 && <p className="return-empty">{t("nav.purchase_return_empty")}</p>}
          {visible.map((row) => (
            <div key={row.id} className="return-row">
              <span>{formatDate(row.date)}</span>
              <span>{formatDate(row.sourceDate)}</span>
              <span>{row.number}</span>
              <span>{row.returnedTo}</span>
              <span className="return-actions">
                <button type="button" aria-label={t("nav.requisition_download")} onClick={() => downloadRow(row)}>
                  <Download size={15} />
                </button>
                <button type="button" aria-label={t("nav.requisition_view")} onClick={() => { setForm(null); setViewing(row); }}>
                  <Eye size={15} />
                </button>
                <button type="button" aria-label={t("nav.requisition_edit")} onClick={() => { setViewing(null); setForm({ ...row, loaded: true, items: row.items || [], notice: "" }); }}>
                  <Pencil size={15} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PurchaseReturns;
