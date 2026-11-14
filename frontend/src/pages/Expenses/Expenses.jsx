import { useEffect, useState } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import { useRestaurant } from "@hooks/useRestaurant";
import { formatMoney } from "../../utils/money";
import { readExpenseCategories, readExpenses, writeExpenses } from "./expenseStorage";
import "./Expenses.css";

const METHODS = [
  { id: "cash", label: "nav.orders_cash" },
  { id: "card", label: "nav.orders_card" },
  { id: "online", label: "nav.orders_online" },
  { id: "wallet", label: "nav.orders_wallet" },
];

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function blankLine() {
  return { key: crypto.randomUUID(), categoryId: "", purpose: "", method: "", amount: "", comment: "" };
}

const Expenses = () => {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const { getRestaurantId, getCurrency } = useRestaurant();
  const restaurantId = getRestaurantId();
  const currency = getCurrency();
  const canManage = hasPermission("manage_invoices") || hasPermission("manage_inventory");
  const [categories, setCategories] = useState([]);
  const [date, setDate] = useState(today);
  const [lines, setLines] = useState([blankLine()]);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setCategories(readExpenseCategories(restaurantId));
  }, [restaurantId]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const total = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

  const updateLine = (key, patch) => {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const reset = () => {
    setDate(today());
    setLines([blankLine()]);
  };

  const save = (event) => {
    event.preventDefault();
    const ready = lines
      .map((line) => ({
        id: crypto.randomUUID(),
        categoryId: line.categoryId,
        categoryName: categories.find((category) => category.id === line.categoryId)?.name || "",
        purpose: line.purpose.trim(),
        method: line.method,
        amount: Math.round((Number(line.amount) || 0) * 100) / 100,
        comment: line.comment.trim(),
      }))
      .filter((line) => line.categoryId && line.purpose && line.method && line.amount > 0);
    if (!date || ready.length === 0) {
      setMessage({ type: "error", text: t("nav.expense_need_line") });
      return;
    }
    writeExpenses(restaurantId, [...readExpenses(restaurantId), { id: crypto.randomUUID(), date, lines: ready }]);
    setMessage({ type: "success", text: t("nav.expense_saved") });
    reset();
  };

  return (
    <div className="expenses" data-direction={i18n.dir()}>
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.expense")}</h1>
      <form onSubmit={save}>
        <div className="expenses-meta">
          <label>
            {t("nav.expense_date")}
            <span>
              <Calendar size={16} aria-hidden="true" />
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </span>
          </label>
          <p>
            <span>{t("nav.expense_amount")}</span>
            <strong>{formatMoney(total, currency)}</strong>
          </p>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{t("inventory.category")}</th>
                <th>{t("nav.expense_purpose")}</th>
                <th>{t("nav.expense_method")}</th>
                <th>{t("nav.expense_amount")}</th>
                <th>{t("nav.expense_comment")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.key}>
                  <td>{index + 1}</td>
                  <td>
                    <select
                      aria-label={t("inventory.category")}
                      value={line.categoryId}
                      onChange={(event) => updateLine(line.key, { categoryId: event.target.value })}
                    >
                      <option value="">{t("nav.sfg_select")}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      aria-label={t("nav.expense_purpose")}
                      value={line.purpose}
                      onChange={(event) => updateLine(line.key, { purpose: event.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      aria-label={t("nav.expense_method")}
                      value={line.method}
                      onChange={(event) => updateLine(line.key, { method: event.target.value })}
                    >
                      <option value="">{t("nav.sfg_select")}</option>
                      {METHODS.map((method) => (
                        <option key={method.id} value={method.id}>
                          {t(method.label)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      aria-label={t("nav.expense_amount")}
                      inputMode="decimal"
                      value={line.amount}
                      onChange={(event) =>
                        updateLine(line.key, {
                          amount: event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label={t("nav.expense_comment")}
                      value={line.comment}
                      onChange={(event) => updateLine(line.key, { comment: event.target.value })}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="expenses-delete"
                      aria-label={t("common.delete")}
                      onClick={() => setLines((current) => (current.length === 1 ? [blankLine()] : current.filter((entry) => entry.key !== line.key)))}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="expenses-add" onClick={() => setLines((current) => [...current, blankLine()])}>
          <Plus size={15} />
          {t("nav.expense_new")}
        </button>
        {canManage && (
          <div className="expenses-actions">
            <button type="button" className="expenses-cancel" onClick={reset}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="expenses-submit">
              {t("nav.purchase_submit")}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Expenses;
