import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Eye, Pencil, Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRestaurant } from "@hooks/useRestaurant";
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

function readDocuments(restaurantId) {
  const id = restaurantId || "restaurant";
  const load = (key) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(`${key}:${id}`) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  return [
    ...load("purchaseOrders").map((row) => ({
      id: `po:${row.id}`,
      kind: "po",
      number: row.number || "",
      date: row.date || "",
      returnedTo: row.supplierName || "",
    })),
    ...load("requisitions").map((row) => ({
      id: `re:${row.id}`,
      kind: "requisition",
      number: row.number || "",
      date: row.date || "",
      returnedTo: row.destination || "",
    })),
  ].filter((row) => row.number);
}

const PurchaseReturns = () => {
  const { t } = useTranslation();
  const { getRestaurantId } = useRestaurant();
  const restaurantId = getRestaurantId();
  const [rows, setRows] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [direction, setDirection] = useState("send");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [sourceId, setSourceId] = useState("");

  useEffect(() => {
    setRows(readRows(restaurantId));
    setDocuments(readDocuments(restaurantId));
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
    setSourceId("");
    setForm({
      ...EMPTY_FORM,
      direction,
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const applySource = (id) => {
    setSourceId(id);
    const source = documents.find((item) => item.id === id);
    if (!source) return;
    setForm((current) => ({
      ...current,
      number: source.number,
      sourceDate: source.date,
      returnedTo: source.returnedTo,
    }));
  };

  const saveForm = (event) => {
    event.preventDefault();
    if (!form.number.trim() || !form.returnedTo.trim()) return;
    const record = {
      ...form,
      id: form.id || crypto.randomUUID(),
      number: form.number.trim(),
      returnedTo: form.returnedTo.trim(),
      direction: form.direction || direction,
    };
    const next = form.id ? rows.map((row) => (row.id === form.id ? record : row)) : [record, ...rows];
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
    return (
      <div className="return-page">
        <button type="button" className="return-back" onClick={() => setForm(null)}>
          <ArrowLeft size={18} />
          {form.id ? form.number : t("nav.purchase_return_new")}
        </button>
        <form className="return-card return-form" onSubmit={saveForm}>
          <label>
            {t("nav.purchase_return_source")}
            <select value={sourceId} onChange={(event) => applySource(event.target.value)}>
              <option value="">{t("nav.purchase_return_no_sources")}</option>
              {documents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.number}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("nav.purchase_return_date")}
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
          </label>
          <label>
            {t("nav.purchase_return_source_date")}
            <input type="date" value={form.sourceDate} onChange={(event) => setForm({ ...form, sourceDate: event.target.value })} />
          </label>
          <label>
            {t("nav.purchase_return_no")}
            <input value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} required />
          </label>
          <label>
            {t("nav.purchase_return_to")}
            <input value={form.returnedTo} onChange={(event) => setForm({ ...form, returnedTo: event.target.value })} required />
          </label>
          <div className="return-form-actions">
            <button type="button" className="return-cancel" onClick={() => setForm(null)}>{t("nav.purchase_cancel")}</button>
            <button type="submit" className="return-new">{t("nav.purchase_submit")}</button>
          </div>
        </form>
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
          <label>
            <Search size={14} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("nav.purchase_search")} />
          </label>
          <label>
            {t("nav.requisition_sort")}
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">{t("nav.purchase_return_newest")}</option>
              <option value="oldest">{t("nav.purchase_return_oldest")}</option>
            </select>
          </label>
          <label>
            {t("nav.requisition_filter")}
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
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
                <button type="button" aria-label={t("nav.requisition_edit")} onClick={() => { setViewing(null); setSourceId(""); setForm(row); }}>
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
