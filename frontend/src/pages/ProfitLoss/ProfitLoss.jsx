import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, ChevronDown, GitCompare } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useRestaurant } from "@hooks/useRestaurant";
import menuService from "@services/menuService";
import orderService from "@services/orderService";
import { formatMoney } from "../../utils/money";
import { readExpenses } from "../Expenses/expenseStorage";
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

function changePercent(fromValue, toValue) {
  const from = money(fromValue);
  const to = money(toValue);
  if (from === 0 && to === 0) return 0;
  if (from === 0) return to > 0 ? 100 : -100;
  return ((to - from) / Math.abs(from)) * 100;
}

function margin(statement) {
  if (!statement.netSales) return "0%";
  return `${((statement.afterTax / statement.netSales) * 100).toFixed(2)}%`;
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
  const { getCurrency, getRestaurantId } = useRestaurant();
  const currency = getCurrency();
  const restaurantId = getRestaurantId();
  const [range, setRange] = useState(defaultRange);
  const [fromRange, setFromRange] = useState(() => {
    const current = defaultRange();
    return previousRange(current.from, current.to);
  });
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [recipes, setRecipes] = useState(new Map());
  const [compare, setCompare] = useState(false);
  const [open, setOpen] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setExpenses(readExpenses(restaurantId));
  }, [restaurantId]);

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
  const serviceLabel = t("nav.pl_service");
  const currentOrders = useMemo(
    () => paid.filter((order) => inRange(order.createdAt, range.from, range.to)),
    [paid, range.from, range.to],
  );
  const fromOrders = useMemo(
    () => paid.filter((order) => inRange(order.createdAt, fromRange.from, fromRange.to)),
    [paid, fromRange.from, fromRange.to],
  );
  const expenseLines = (from, to) =>
    expenses.flatMap((entry) => {
      if (!entry.date || entry.date < from || entry.date > to) return [];
      return (entry.lines || []).map((line) => ({
        id: line.id,
        name: [line.purpose, line.categoryName].filter(Boolean).join(" · "),
        amount: Number(line.amount) || 0,
      }));
    });
  const applyExpenses = (statement, lines) => {
    const opex = money(lines.reduce((sum, line) => sum + line.amount, 0));
    const beforeTax = money(statement.gross - opex);
    return { opex, lines, beforeTax, afterTax: money(beforeTax - statement.tax) };
  };
  const currentBase = useMemo(() => buildStatement(currentOrders, recipes, serviceLabel), [currentOrders, recipes, serviceLabel]);
  const fromBase = useMemo(() => buildStatement(fromOrders, recipes, serviceLabel), [fromOrders, recipes, serviceLabel]);
  const currentExpenses = expenseLines(range.from, range.to);
  const fromExpenses = expenseLines(fromRange.from, fromRange.to);
  const current = { ...currentBase, ...applyExpenses(currentBase, currentExpenses) };
  const fromStatement = { ...fromBase, ...applyExpenses(fromBase, fromExpenses) };

  const amount = (value, deduction = false) => {
    const number = money(value);
    if (deduction && number > 0) return `(${formatMoney(number, currency)})`;
    return formatMoney(number, currency);
  };

  const toggle = (key) => setOpen((currentOpen) => ({ ...currentOpen, [key]: !currentOpen[key] }));

  const rows = [
    { key: "sales", label: t("nav.pl_total_sales"), from: fromStatement.totalSales, to: current.totalSales, fromLines: fromStatement.sales, toLines: current.sales, expandable: true },
    { key: "less", label: t("nav.pl_less"), from: fromStatement.less, to: current.less, fromLines: fromStatement.discounts, toLines: current.discounts, expandable: true, deduction: true },
    { key: "net", label: t("nav.pl_net_sales"), from: fromStatement.netSales, to: current.netSales, summary: true },
    { key: "cogs", label: t("nav.pl_cogs"), from: fromStatement.cogs, to: current.cogs, fromLines: fromStatement.costs, toLines: current.costs, expandable: true, deduction: true },
    { key: "gross", label: t("nav.pl_gross"), from: fromStatement.gross, to: current.gross, summary: true },
    { key: "opex", label: t("nav.pl_opex"), from: fromStatement.opex, to: current.opex, fromLines: fromStatement.lines, toLines: current.lines, expandable: true, deduction: true },
    { key: "before", label: t("nav.pl_before_tax"), from: fromStatement.beforeTax, to: current.beforeTax, summary: true },
    { key: "tax", label: t("nav.pl_tax"), from: fromStatement.tax, to: current.tax, fromLines: fromStatement.taxes, toLines: current.taxes, expandable: true, deduction: true },
    { key: "after", label: t("nav.pl_after_tax"), from: fromStatement.afterTax, to: current.afterTax, total: true },
  ];

  const formatRange = (from, to) => {
    const style = { day: "2-digit", month: "short", year: "numeric" };
    const start = new Date(`${from}T00:00:00`).toLocaleDateString(undefined, style);
    const end = new Date(`${to}T00:00:00`).toLocaleDateString(undefined, style);
    return `${start} - ${end}`;
  };

  const rangeControl = (value, onChange) => (
    <span className="pl-range">
      <Calendar size={16} aria-hidden="true" />
      <input type="date" value={value.from} max={value.to} onChange={(event) => onChange({ ...value, from: event.target.value })} aria-label={value.from} />
      <span>-</span>
      <input type="date" value={value.to} min={value.from} onChange={(event) => onChange({ ...value, to: event.target.value })} aria-label={value.to} />
    </span>
  );

  const lineList = (lines, deduction) =>
    lines.length === 0 ? (
      <p>{t("nav.pl_empty")}</p>
    ) : (
      <ul>
        {lines.map((line) => (
          <li key={line.id}>
            <span>{line.name}</span>
            <span>{amount(line.amount, deduction)}</span>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="profit-loss" data-direction={i18n.dir()}>
      <Alert type={message.type} message={message.text} />
      {compare ? (
        <button type="button" className="pl-back" onClick={() => setCompare(false)}>
          <ArrowLeft size={18} />
          {t("nav.pl_compare_title")}
        </button>
      ) : (
        <h1>{t("nav.pl_title")}</h1>
      )}
      <div className="pl-toolbar">
        {compare ? (
          <div className="pl-periods">
            <label>
              {t("nav.pl_from")}
              {rangeControl(fromRange, setFromRange)}
            </label>
            <label>
              {t("nav.pl_to")}
              {rangeControl(range, setRange)}
            </label>
          </div>
        ) : (
          rangeControl(range, setRange)
        )}
        {!compare && (
          <button
            type="button"
            className="pl-compare"
            onClick={() => {
              setFromRange(previousRange(range.from, range.to));
              setCompare(true);
            }}
          >
            <GitCompare size={16} />
            {t("nav.pl_compare")}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            {compare ? (
              <>
                <tr className="pl-period">
                  <th colSpan={2}>{formatRange(fromRange.from, fromRange.to)}</th>
                  <th colSpan={2}>{formatRange(range.from, range.to)}</th>
                  <th>{t("nav.pl_changes")}</th>
                </tr>
                <tr>
                  <th />
                  <th>{currency}</th>
                  <th />
                  <th>{currency}</th>
                  <th>%</th>
                </tr>
              </>
            ) : (
              <tr>
                <th>{t("nav.pl_title")}</th>
                <th>{currency}</th>
              </tr>
            )}
          </thead>
          <tbody>
            {rows.map((row) => {
              const change = changePercent(row.from, row.to);
              return (
                <Fragment key={row.key}>
                  <tr className={row.summary ? "pl-summary" : ""}>
                    <td className={row.total ? "pl-total-from" : ""}>
                      {row.expandable ? (
                        <button type="button" className={open[row.key] ? "pl-toggle open" : "pl-toggle"} onClick={() => toggle(row.key)}>
                          <ChevronDown size={14} />
                          {row.label}
                        </button>
                      ) : (
                        row.label
                      )}
                    </td>
                    <td className={row.total ? "pl-total-from" : ""}>
                      {amount(compare ? row.from : row.to, row.deduction)}
                      {compare && row.total && <span className="pl-margin">{margin(fromStatement)}</span>}
                    </td>
                    {compare && (
                      <>
                        <td className={row.total ? "pl-total-to" : ""}>
                          {row.expandable ? (
                            <button type="button" className={open[row.key] ? "pl-toggle open" : "pl-toggle"} onClick={() => toggle(row.key)}>
                              <ChevronDown size={14} />
                              {row.label}
                            </button>
                          ) : (
                            row.label
                          )}
                        </td>
                        <td className={row.total ? "pl-total-to" : ""}>
                          {amount(row.to, row.deduction)}
                          {row.total && <span className="pl-margin">{margin(current)}</span>}
                        </td>
                        <td className={change < 0 ? "pl-change pl-down" : change > 0 ? "pl-change pl-up" : "pl-change"}>
                          {`${change.toFixed(1)}%`}
                        </td>
                      </>
                    )}
                  </tr>
                  {row.expandable && open[row.key] && (
                    <tr className="pl-lines">
                      <td colSpan={2}>{lineList(compare ? row.fromLines : row.toLines, row.deduction)}</td>
                      {compare && (
                        <>
                          <td colSpan={2}>{lineList(row.toLines, row.deduction)}</td>
                          <td />
                        </>
                      )}
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLoss;
