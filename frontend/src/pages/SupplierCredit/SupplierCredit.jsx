import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import supplierService from "@services/supplierService";
import { formatMoney } from "../../utils/money";
import { useRestaurant } from "@hooks/useRestaurant";
import "./SupplierCredit.css";

function money(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function transactionsOf(result) {
  const body = result?.data || result;
  const rows = body?.transactions || body?.data?.transactions;
  return Array.isArray(rows) ? rows : [];
}

const SupplierCredit = () => {
  const { t } = useTranslation();
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
        setRows(
          suppliers
            .map((supplier, index) => {
              const entries = transactionsOf(statements[index]);
              const sumOf = (type) => entries.filter((entry) => entry.type === type).reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
              const total = money(sumOf("purchase"));
              const paid = money(sumOf("payment"));
              return {
                id: supplier._id,
                name: supplier.name,
                phone: supplier.phone || "—",
                total,
                paid,
                due: money(total - paid),
              };
            })
            .sort((left, right) => left.name.localeCompare(right.name)),
        );
      })
      .catch((error) => {
        if (live) setMessage({ type: "error", text: error.response?.data?.message || t("common.error") });
      });
    return () => {
      live = false;
    };
  }, [t]);

  const needle = query.trim().toLowerCase();
  const visible = rows.filter((row) => !needle || `${row.name} ${row.phone}`.toLowerCase().includes(needle));

  return (
    <div className="supplier-credit">
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.supplier_credit")}</h1>
      <div className="supplier-credit-toolbar">
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
              <th>{t("nav.supplier_credit_mobile")}</th>
              <th>{t("nav.supplier_trx_total")}</th>
              <th>{t("nav.supplier_credit_paid")}</th>
              <th>{t("nav.supplier_credit_due")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5}>{t("nav.supplier_credit_empty")}</td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.phone}</td>
                  <td>{formatMoney(row.total, currency)}</td>
                  <td>{formatMoney(row.paid, currency)}</td>
                  <td>{formatMoney(row.due, currency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierCredit;
