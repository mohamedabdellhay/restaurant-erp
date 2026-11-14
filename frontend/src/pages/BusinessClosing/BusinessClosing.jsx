import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useRestaurant } from "@hooks/useRestaurant";
import orderService from "@services/orderService";
import { formatMoney } from "../../utils/money";
import "./BusinessClosing.css";

const NOTES = [
  { id: "100", value: 100 },
  { id: "50", value: 50 },
  { id: "20", value: 20 },
  { id: "10", value: 10 },
  { id: "5", value: 5 },
  { id: "1", value: 1 },
  { id: "0.25", value: 0.25 },
  { id: "0.10", value: 0.1 },
  { id: "0.05", value: 0.05 },
  { id: "0.01", value: 0.01 },
];

const emptyCounts = () => Object.fromEntries(NOTES.map((note) => [note.id, ""]));

function dayStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isToday(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return dayStamp(date) === dayStamp();
}

function readOpening() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem("posOpeningCash") || "null");
    const amount = Number(parsed?.amount);
    return Number.isFinite(amount) ? amount : 0;
  } catch {
    return 0;
  }
}

function readList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function money(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function orderLabel(order) {
  if (order.orderNumber) return `#${order.orderNumber}`;
  return `#${String(order._id || order.id || "").slice(0, 8)}`;
}

const BusinessClosing = () => {
  const { t, i18n } = useTranslation();
  const { getRestaurantId, getCurrency } = useRestaurant();
  const restaurantId = getRestaurantId();
  const currency = getCurrency();
  const [opening, setOpening] = useState(readOpening);
  const [orders, setOrders] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [counts, setCounts] = useState(emptyCounts);
  const [openPanel, setOpenPanel] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const transferKey = `businessTransfers:${restaurantId || "restaurant"}:${dayStamp()}`;

  useEffect(() => {
    setOpening(readOpening());
    setTransfers(readList(transferKey));
    orderService
      .getAll()
      .then((response) => setOrders(response.data || response || []))
      .catch(() => setOrders([]));
  }, [transferKey]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const today = useMemo(
    () => orders.filter((order) => order.status !== "cancelled" && isToday(order.createdAt)),
    [orders],
  );
  const paid = today.filter((order) => order.status === "paid" || order.paymentStatus === "paid");
  const cashSales = paid.filter((order) => {
    const method = String(order.paymentMethod || "cash").toLowerCase();
    return method === "cash" || method === "";
  });
  const creditSales = paid.filter((order) => !cashSales.includes(order));
  const cashSalesTotal = money(cashSales.reduce((sum, order) => sum + (Number(order.total) || 0), 0));
  const creditTotal = money(creditSales.reduce((sum, order) => sum + (Number(order.total) || 0), 0));
  const salesTotal = money(cashSalesTotal + creditTotal);
  const expenseTotal = money(transfers.reduce((sum, row) => sum + (Number(row.amount) || 0), 0));
  const counted = money(NOTES.reduce((sum, note) => sum + note.value * (Number(counts[note.id]) || 0), 0));
  const expected = money(opening + cashSalesTotal - expenseTotal);
  const variance = money(expected - counted);

  const saveTransfers = (next) => {
    setTransfers(next);
    localStorage.setItem(transferKey, JSON.stringify(next));
  };

  const addTransfer = (event) => {
    event.preventDefault();
    const amount = Number(transferAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    saveTransfers([
      ...transfers,
      { id: crypto.randomUUID(), amount: money(amount), note: transferNote.trim(), at: new Date().toISOString() },
    ]);
    setTransferAmount("");
    setTransferNote("");
    setTransferOpen(false);
    setOpenPanel("expense");
    setMessage({ type: "success", text: t("nav.business_transfer_added") });
  };

  const changeShift = () => {
    if (!window.confirm(t("nav.business_confirm_shift"))) return;
    sessionStorage.setItem(
      "posOpeningCash",
      JSON.stringify({ amount: counted, currency, startedAt: new Date().toISOString() }),
    );
    setOpening(counted);
    setCounts(emptyCounts());
    setMessage({ type: "success", text: t("nav.business_shift_changed") });
  };

  const closeDay = () => {
    if (!window.confirm(t("nav.business_confirm_close"))) return;
    const snapshot = {
      date: dayStamp(),
      opening,
      expected,
      counted,
      variance,
      creditTotal,
      expenseTotal,
      salesTotal,
      closedAt: new Date().toISOString(),
    };
    localStorage.setItem(`businessClosing:${restaurantId || "restaurant"}:${dayStamp()}`, JSON.stringify(snapshot));
    setCounts(emptyCounts());
    setMessage({ type: "success", text: t("nav.business_closed") });
  };

  const toggle = (panel) => setOpenPanel((current) => (current === panel ? "" : panel));

  const noteLabel = (value) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);

  return (
    <div className="business-closing" data-direction={i18n.dir()}>
      <Alert type={message.type} message={message.text} />
      <div className="business-head">
        <h1>{t("nav.business_closing")}</h1>
        <button type="button" className="business-add" onClick={() => setTransferOpen(true)}>
          <Plus size={16} />
          {t("nav.business_add_transfer")}
        </button>
      </div>

      <div className="business-cards">
        <article>
          <span>{t("nav.business_opening")}</span>
          <strong>{formatMoney(opening, currency)}</strong>
        </article>
        <article className="business-expected">
          <span>{t("nav.business_expected")}</span>
          <strong>{formatMoney(expected, currency)}</strong>
        </article>
        <article className="business-hand">
          <span>{t("nav.business_in_hand")}</span>
          <strong>{formatMoney(counted, currency)}</strong>
        </article>
        <article className="business-variance">
          <span>{t("nav.business_variance")}</span>
          <strong>{formatMoney(variance, currency)}</strong>
        </article>
      </div>

      <section className="business-count">
        <h2>{t("nav.business_cash_count")}</h2>
        <div className="business-notes">
          <div className="business-note-label">{t("nav.business_unique_notes")}</div>
          {NOTES.map((note) => (
            <div key={note.id} className="business-note-face">
              {noteLabel(note.value)}
            </div>
          ))}
          <div className="business-note-label">{t("nav.business_note_count")}</div>
          {NOTES.map((note) => (
            <input
              key={note.id}
              aria-label={`${t("nav.business_note_count")} ${noteLabel(note.value)}`}
              inputMode="numeric"
              value={counts[note.id]}
              onChange={(event) =>
                setCounts((current) => ({
                  ...current,
                  [note.id]: event.target.value.replace(/[^\d]/g, ""),
                }))
              }
            />
          ))}
        </div>
      </section>

      <div className="business-summaries">
        {[
          { id: "credit", label: t("nav.business_credit_sales"), total: creditTotal, lines: creditSales.map((order) => ({ id: order._id || order.id, name: orderLabel(order), amount: order.total })) },
          { id: "expense", label: t("nav.business_cash_expense"), total: expenseTotal, lines: transfers.map((row) => ({ id: row.id, name: row.note || t("nav.business_add_transfer"), amount: row.amount })) },
          { id: "sales", label: t("nav.business_sales_summary"), total: salesTotal, lines: paid.map((order) => ({ id: order._id || order.id, name: orderLabel(order), amount: order.total })) },
        ].map((panel) => (
          <div key={panel.id} className="business-summary">
            <span>{panel.label}</span>
            <button type="button" aria-expanded={openPanel === panel.id} onClick={() => toggle(panel.id)}>
              <span>{t("nav.business_total")}</span>
              <strong>{formatMoney(panel.total, currency)}</strong>
              <ChevronDown size={16} />
            </button>
            {openPanel === panel.id && (
              <ul>
                {panel.lines.length === 0 ? (
                  <li>{t("nav.business_no_lines")}</li>
                ) : (
                  panel.lines.map((line) => (
                    <li key={line.id}>
                      <span>{line.name}</span>
                      <span>{formatMoney(line.amount, currency)}</span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="business-actions">
        <button type="button" className="business-cancel" onClick={() => setCounts(emptyCounts())}>
          {t("common.cancel")}
        </button>
        <button type="button" className="business-shift" onClick={changeShift}>
          {t("nav.business_change_shift")}
        </button>
        <button type="button" className="business-close" onClick={closeDay}>
          {t("nav.business_close_day")}
        </button>
      </div>

      {transferOpen && (
        <div className="business-overlay">
          <div className="business-modal" role="dialog" aria-modal="true">
            <div className="business-modal-head">
              <h2>{t("nav.business_add_transfer")}</h2>
              <button type="button" onClick={() => setTransferOpen(false)} aria-label={t("common.cancel")}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={addTransfer}>
              <label>
                {t("nav.business_transfer_amount")}
                <input
                  inputMode="decimal"
                  value={transferAmount}
                  onChange={(event) =>
                    setTransferAmount(event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))
                  }
                  required
                />
              </label>
              <label>
                {t("nav.business_transfer_note")}
                <input value={transferNote} onChange={(event) => setTransferNote(event.target.value)} />
              </label>
              <div className="business-modal-actions">
                <button type="button" className="business-cancel" onClick={() => setTransferOpen(false)}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="business-add">
                  {t("common.add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessClosing;
