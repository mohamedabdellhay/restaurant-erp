import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import inventoryService from "@services/inventoryService";
import supplierService from "@services/supplierService";
import { formatMoney } from "../../utils/money";
import { useRestaurant } from "@hooks/useRestaurant";
import "./ItemsBySupplier.css";

function transactionsOf(result) {
  const body = result?.data || result;
  return body?.transactions || body?.data?.transactions || [];
}

function parsePurchase(description) {
  const match = String(description || "").match(/^Purchased\s+([0-9]+(?:\.[0-9]+)?)\s+(.*?)\s+of\s+(.+)$/i);
  if (!match) return null;
  return { qty: Number(match[1]), unit: match[2].trim(), name: match[3].trim() };
}

const ItemsBySupplier = () => {
  const { t, i18n } = useTranslation();
  const { getCurrency, getRestaurantName } = useRestaurant();
  const currency = getCurrency();
  const restaurantName = getRestaurantName();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let live = true;
    Promise.all([inventoryService.getAll(), supplierService.getAll()])
      .then(async ([itemResult, supplierResult]) => {
        const items = itemResult?.data || [];
        const suppliers = supplierResult?.data || [];
        const statements = await Promise.all(
          suppliers.map((supplier) => supplierService.getStatement(supplier._id).catch(() => ({ data: { transactions: [] } }))),
        );
        if (!live) return;
        const latest = new Map();
        statements.forEach((statement, index) => {
          const supplier = suppliers[index];
          transactionsOf(statement).forEach((entry) => {
            if (entry.type && entry.type !== "purchase") return;
            const parsed = parsePurchase(entry.description);
            if (!parsed) return;
            const key = `${supplier._id}:${parsed.name.toLowerCase()}`;
            if (latest.has(key)) return;
            latest.set(key, { ...parsed, amount: Number(entry.amount) || 0, date: entry.createdAt });
          });
        });
        setRows(
          items.map((item) => {
            const id = item.supplier?._id || (typeof item.supplier === "string" ? item.supplier : "");
            const purchase = latest.get(`${id}:${String(item.name || "").toLowerCase()}`);
            const unitPrice = purchase && purchase.qty ? purchase.amount / purchase.qty : null;
            return {
              id: item._id,
              supplierId: id,
              supplier: item.supplier?.name || "—",
              name: item.name,
              category: item.ingredientCategory?.name || "—",
              location: item.restaurant?.name || restaurantName,
              date: purchase?.date || "",
              price: unitPrice,
              qty: purchase ? `${purchase.qty} ${purchase.unit}`.trim() : "",
            };
          }),
        );
      })
      .catch((error) => {
        if (live) setMessage({ type: "error", text: error.response?.data?.message || t("common.error") });
      });
    return () => {
      live = false;
    };
  }, [restaurantName, t]);

  const suppliers = useMemo(() => {
    const seen = new Map();
    rows.forEach((row) => {
      if (row.supplierId && !seen.has(row.supplierId)) seen.set(row.supplierId, row.supplier);
    });
    return [...seen.entries()];
  }, [rows]);

  const visible = rows
    .filter((row) => {
      if (supplierId && row.supplierId !== supplierId) return false;
      const needle = query.trim().toLowerCase();
      if (!needle) return true;
      return [row.supplier, row.name, row.category, row.location].join(" ").toLowerCase().includes(needle);
    })
    .sort((left, right) => left.supplier.localeCompare(right.supplier) || left.name.localeCompare(right.name));

  const dateLabel = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(i18n.language, { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="items-by-supplier">
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.items_by_supplier")}</h1>
      <div className="items-by-supplier-toolbar">
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
        <div className="items-by-supplier-drop">
          <button type="button" className="items-by-supplier-filter" onClick={() => setOpen((current) => !current)}>
            <Filter size={14} />
            {t("nav.food_item_filter")}
          </button>
          {open && (
            <div className="items-by-supplier-menu">
              <button type="button" className={supplierId === "" ? "is-current" : ""} onClick={() => { setSupplierId(""); setOpen(false); }}>
                {t("nav.customer_filter_all")}
              </button>
              {suppliers.map(([id, name]) => (
                <button key={id} type="button" className={supplierId === id ? "is-current" : ""} onClick={() => { setSupplierId(id); setOpen(false); }}>
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.items_by_supplier_name")}</th>
              <th>{t("nav.items_by_supplier_supplies")}</th>
              <th>{t("nav.items_by_supplier_category")}</th>
              <th>{t("nav.items_by_supplier_location")}</th>
              <th>{t("nav.items_by_supplier_date")}</th>
              <th>{t("nav.items_by_supplier_price")}</th>
              <th>{t("nav.items_by_supplier_qty")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7}>{t("nav.items_by_supplier_empty")}</td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id}>
                  <td>{row.supplier}</td>
                  <td>{row.name}</td>
                  <td>{row.category}</td>
                  <td>{row.location}</td>
                  <td>{dateLabel(row.date)}</td>
                  <td>{row.price == null ? "—" : formatMoney(row.price, currency)}</td>
                  <td>{row.qty || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsBySupplier;
