import { Fragment, useEffect, useMemo, useState } from "react";
import { Calendar, ChevronDown, GitCompare } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useRestaurant } from "@hooks/useRestaurant";
import menuService from "@services/menuService";
import orderService from "@services/orderService";
import { formatMoney } from "../../utils/money";
import "./ProfitLoss.css";

function dayStamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return { from: dayStamp(start), to: dayStamp(end) };
}

function previousRange(from, to) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  return { from: dayStamp(prevStart), to: dayStamp(prevEnd) };
}

function inRange(value, from, to) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const stamp = dayStamp(date);
  return stamp >= from && stamp <= to;
}

function orderLabel(order) {
  if (order.orderNumber) return `#${order.orderNumber}`;
  return `#${String(order._id || order.id || "").slice(0, 8)}`;
}

function discountOf(order) {
  const match = String(order.notes || "").match(/Discount:\s*([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number(match[1]) : 0;
}

function money(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function buildStatement(orders, recipes, serviceLabel) {
  const sales = new Map();
  const costs = new Map();
  const discounts = [];
  const taxes = [];

  orders.forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => {
      const qty = Number(item.qty || item.quantity) || 0;
      const revenue = qty * (Number(item.price) || 0);
      const menu = item.menuItem && typeof item.menuItem === "object" ? item.menuItem : null;
      const name = menu?.name || item.name || orderLabel(order);
      sales.set(name, (sales.get(name) || 0) + revenue);
      const menuId = menu?._id || menu?.id || item.menuItemId || item.menuItem;
      (recipes.get(String(menuId)) || []).forEach((entry) => {
        const ingredient = entry.inventoryItem && typeof entry.inventoryItem === "object" ? entry.inventoryItem : null;
        const cost = (Number(entry.qty) || 0) * qty * (Number(ingredient?.costPrice) || 0);
        if (!cost) return;
        const label = ingredient?.name || "Ingredient";
        costs.set(label, (costs.get(label) || 0) + cost);
      });
    });
    const service = Number(order.serviceCharge) || 0;
    if (service) sales.set(serviceLabel, (sales.get(serviceLabel) || 0) + service);
    const discount = discountOf(order);
    if (discount) discounts.push({ id: `${order._id || order.id}-discount`, name: orderLabel(order), amount: discount });
    const tax = Number(order.tax) || 0;
    if (tax) taxes.push({ id: `${order._id || order.id}-tax`, name: orderLabel(order), amount: tax });
  });

  const lines = (map) =>
    [...map.entries()].map(([name, amount]) => ({ id: name, name, amount: money(amount) }));
  const totalSales = money([...sales.values()].reduce((sum, amount) => sum + amount, 0));
  const less = money(discounts.reduce((sum, line) => sum + line.amount, 0));
  const cogs = money([...costs.values()].reduce((sum, amount) => sum + amount, 0));
  const tax = money(taxes.reduce((sum, line) => sum + line.amount, 0));
  const netSales = money(totalSales - less);
  const gross = money(netSales - cogs);
  const beforeTax = gross;
  return {
    sales: lines(sales),
    discounts,
    costs: lines(costs),
    taxes,
    totalSales,
    less,
    netSales,
    cogs,
    gross,
    beforeTax,
    tax,
    afterTax: money(beforeTax - tax),
  };
}

const ProfitLoss = () => {
  const { t, i18n } = useTranslation();
  const { getCurrency } = useRestaurant();
  const currency = getCurrency();
  const [range, setRange] = useState(defaultRange);
  const [orders, setOrders] = useState([]);
  const [recipes, setRecipes] = useState(new Map());
  const [compare, setCompare] = useState(false);
  const [open, setOpen] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    orderService
      .getAll()
      .then((response) => setOrders(response.data || response || []))
      .catch((error) => setMessage({ type: "error", text: error.response?.data?.message || t("common.error") }));
    menuService
      .getAll()
      .then((response) => {
        const items = response.data || response || [];
        const next = new Map();
        items.forEach((item) => next.set(String(item._id || item.id), item.recipe || []));
        setRecipes(next);
      })
      .catch(() => setRecipes(new Map()));
  }, [t]);

  const paid = useMemo(
    () => orders.filter((order) => order.status !== "cancelled" && (order.status === "paid" || order.paymentStatus === "paid")),
    [orders],
  );
  const currentOrders = paid.filter((order) => inRange(order.createdAt, range.from, range.to));
  const prior = previousRange(range.from, range.to);
  const priorOrders = paid.filter((order) => inRange(order.createdAt, prior.from, prior.to));
  const current = useMemo(
    () => buildStatement(currentOrders, recipes, t("nav.pl_service")),
    [currentOrders, recipes, t],
  );
  const comparison = useMemo(
    () => buildStatement(priorOrders, recipes, t("nav.pl_service")),
    [priorOrders, recipes, t],
  );

  const amount = (value, deduction = false) => {
    const number = money(value);
    if (deduction && number > 0) return `(${formatMoney(number, currency)})`;
    return formatMoney(number, currency);
  };

  const toggle = (key) => setOpen((currentOpen) => ({ ...currentOpen, [key]: !currentOpen[key] }));

  const rows = [
    { key: "sales", label: t("nav.pl_total_sales"), value: current.totalSales, compare: comparison.totalSales, lines: current.sales, expandable: true },
    { key: "less", label: t("nav.pl_less"), value: current.less, compare: comparison.less, lines: current.discounts, expandable: true, deduction: true },
    { key: "net", label: t("nav.pl_net_sales"), value: current.netSales, compare: comparison.netSales, summary: true },
    { key: "cogs", label: t("nav.pl_cogs"), value: current.cogs, compare: comparison.cogs, lines: current.costs, expandable: true, deduction: true },
    { key: "gross", label: t("nav.pl_gross"), value: current.gross, compare: comparison.gross, summary: true },
    { key: "opex", label: t("nav.pl_opex"), value: 0, compare: 0, lines: [], expandable: true, deduction: true },
    { key: "before", label: t("nav.pl_before_tax"), value: current.beforeTax, compare: comparison.beforeTax, summary: true },
    { key: "tax", label: t("nav.pl_tax"), value: current.tax, compare: comparison.tax, lines: current.taxes, expandable: true, deduction: true },
    { key: "after", label: t("nav.pl_after_tax"), value: current.afterTax, compare: comparison.afterTax, total: true },
  ];

  const formatRange = (from, to) => {
    const style = { day: "2-digit", month: "short", year: "numeric" };
    const start = new Date(`${from}T00:00:00`).toLocaleDateString(undefined, style);
    const end = new Date(`${to}T00:00:00`).toLocaleDateString(undefined, style);
    return `${start} - ${end}`;
  };

  return (
    <div className="profit-loss" data-direction={i18n.dir()}>
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.pl_title")}</h1>
      <div className="pl-toolbar">
        <label className="pl-range">
          <Calendar size={16} aria-hidden="true" />
          <input type="date" value={range.from} max={range.to} onChange={(event) => setRange((currentRange) => ({ ...currentRange, from: event.target.value }))} aria-label={range.from} />
          <span>-</span>
          <input type="date" value={range.to} min={range.from} onChange={(event) => setRange((currentRange) => ({ ...currentRange, to: event.target.value }))} aria-label={range.to} />
        </label>
        <button type="button" className={compare ? "pl-compare active" : "pl-compare"} onClick={() => setCompare((value) => !value)}>
          <GitCompare size={16} />
          {t("nav.pl_compare")}
        </button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.pl_title")}</th>
              <th>{currency}</th>
              {compare && <th>{formatRange(prior.from, prior.to)}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.key}>
                <tr className={row.total ? "pl-total" : row.summary ? "pl-summary" : ""}>
                  <td>
                    {row.expandable ? (
                      <button type="button" className={open[row.key] ? "pl-toggle open" : "pl-toggle"} onClick={() => toggle(row.key)}>
                        <ChevronDown size={14} />
                        {row.label}
                      </button>
                    ) : (
                      row.label
                    )}
                  </td>
                  <td>{amount(row.value, row.deduction)}</td>
                  {compare && <td>{amount(row.compare, row.deduction)}</td>}
                </tr>
                {row.expandable && open[row.key] && (
                  <tr className="pl-lines">
                    <td colSpan={compare ? 3 : 2}>
                      {row.lines.length === 0 ? (
                        <p>{t("nav.pl_empty")}</p>
                      ) : (
                        <ul>
                          {row.lines.map((line) => (
                            <li key={line.id}>
                              <span>{line.name}</span>
                              <span>{amount(line.amount, row.deduction)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLoss;
