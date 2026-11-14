import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import supplierService from "@services/supplierService";
import { formatMoney } from "../../utils/money";
import { useRestaurant } from "@hooks/useRestaurant";
import "./SupplierTrx.css";

function transactionsOf(result) {
  const body = result?.data || result;
  return body?.transactions || body?.data?.transactions || [];
}

function parsePurchase(description) {
  const match = String(description || "").match(/^Purchased\s+([0-9]+(?:\.[0-9]+)?)\s+(.*?)\s+of\s+(.+)$/i);
  if (!match) return null;
  return { qty: Number(match[1]), unit: match[2].trim(), name: match[3].trim() };
}

const SupplierTrx = () => {
  const { t, i18n } = useTranslation();
  const { getCurrency } = useRestaurant();
  const currency = getCurrency();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let live = true;
    supplierService
      .getAll()
      .then(async (supplierResult) => {
        const suppliers = supplierResult?.data || [];
        const statements = await Promise.all(
          suppliers.map((supplier) => supplierService.getStatement(supplier._id).catch(() => ({ data: { transactions: [] } }))),
        );
        if (!live) return;
        const purchases = [];
        statements.forEach((statement, index) => {
          const supplier = suppliers[index];
          transactionsOf(statement).forEach((entry) => {
            if (entry.type && entry.type !== "purchase") return;
            const parsed = parsePurchase(entry.description);
            if (!parsed || !parsed.qty) return;
            purchases.push({
              id: entry._id,
              supplier: supplier.name,
              name: parsed.name,
              price: (Number(entry.amount) || 0) / parsed.qty,
              qty: `${parsed.qty} ${parsed.unit}`.trim(),
              total: Number(entry.amount) || 0,
              date: entry.createdAt,
            });
          });
        });
        purchases.sort((left, right) => String(right.date).localeCompare(String(left.date)));
        setRows(purchases);
      })
      .catch((error) => {
        if (live) setMessage({ type: "error", text: error.response?.data?.message || t("common.error") });
      });
    return () => {
      live = false;
    };
  }, [t]);

  const needle = query.trim().toLowerCase();
  const visible = rows.filter((row) => !needle || `${row.supplier} ${row.name}`.toLowerCase().includes(needle));

  const dateLabel = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(i18n.language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="supplier-trx">
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.supplier_trx")}</h1>
      <div className="supplier-trx-toolbar">
        <label>
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("inventory.quick_search")}
            aria-label={t("inventory.quick_search")}
          />
        </label>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.items_by_supplier_name")}</th>
              <th>{t("nav.items_by_supplier_supplies")}</th>
              <th>{t("nav.supplier_trx_price")}</th>
              <th>{t("nav.supplier_trx_qty")}</th>
              <th>{t("nav.supplier_trx_total")}</th>
              <th>{t("nav.supplier_trx_grn")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6}>{t("nav.supplier_trx_empty")}</td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id}>
                  <td>{row.supplier}</td>
                  <td>{row.name}</td>
                  <td>{formatMoney(row.price, currency)}</td>
                  <td>{row.qty}</td>
                  <td>{formatMoney(row.total, currency)}</td>
                  <td>{dateLabel(row.date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierTrx;
