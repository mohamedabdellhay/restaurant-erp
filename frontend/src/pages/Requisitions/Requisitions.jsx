import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Eye, Package, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import inventoryService from "@services/inventoryService";
import ingredientCategoryService from "@services/ingredientCategoryService";
import departmentService from "@services/departmentService";
import { useTranslation } from "react-i18next";
import { useRestaurant } from "@hooks/useRestaurant";
import "./Requisitions.css";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function categoryIdOf(item) {
  const category = item.ingredientCategory;
  if (category && typeof category === "object") return category._id || "";
  return category || "";
}

const EMPTY_FORM = {
  id: "",
  date: "",
  number: "",
  destination: "",
  expectedDate: "",
  status: "undelivered",
  items: [],
};

function storageKey(restaurantId) {
  return `requisitions:${restaurantId || "restaurant"}`;
}

function readRows(restaurantId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(restaurantId)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function nextNumber(rows) {
  const highest = rows.reduce((max, row) => {
    const value = Number(String(row.number || "").replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `RE-${String(highest + 1).padStart(4, "0")}`;
}

const Requisitions = ({ mode = "send" }) => {
  const receive = mode === "receive";
  const { t } = useTranslation();
  const { getRestaurantId, getRestaurantName } = useRestaurant();
  const restaurantId = getRestaurantId();
  const restaurantName = getRestaurantName();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("date");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [supplies, setSupplies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [letter, setLetter] = useState("");
  const [supplyQuery, setSupplyQuery] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    setRows(readRows(restaurantId));
  }, [restaurantId]);

  useEffect(() => {
    inventoryService
      .getAll()
      .then((result) => setSupplies(result?.data || []))
      .catch(() => setSupplies([]));
    ingredientCategoryService
      .getAll()
      .then((result) => setCategories(result?.data || []))
      .catch(() => setCategories([]));
    departmentService
      .getAll()
      .then((result) => setDepartments(result?.data || []))
      .catch(() => setDepartments([]));
  }, []);

  const saveRows = (next) => {
    setRows(next);
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(next));
  };

  const approvalOf = (row) => row.approval || "pending";
  const sourceOf = (row) => row.source || restaurantName;
  const statusOf = (row) => (receive ? approvalOf(row) : row.status);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const status = receive ? row.approval || "pending" : row.status;
      const party = receive ? row.source || restaurantName : row.destination;
      if (filter !== "all" && status !== filter) return false;
      if (!term) return true;
      return [row.number, party, status].join(" ").toLowerCase().includes(term);
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const party = (row) => (receive ? row.source || restaurantName : row.destination);
      const status = (row) => (receive ? row.approval || "pending" : row.status);
      if (sort === "number") return String(a.number).localeCompare(String(b.number));
      if (sort === "destination") return String(party(a)).localeCompare(String(party(b)));
      if (sort === "expected") return String(a.expectedDate).localeCompare(String(b.expectedDate));
      if (sort === "status") return String(status(a)).localeCompare(String(status(b)));
      return String(b.date).localeCompare(String(a.date));
    });
    return sorted;
  }, [rows, query, sort, filter, receive, restaurantName]);

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  };

  const openCreate = () => {
    const today = new Date().toISOString().slice(0, 10);
    setViewing(null);
    setForm({
      ...EMPTY_FORM,
      date: today,
      expectedDate: "",
      number: nextNumber(rows),
      items: [],
    });
    setLowStock(false);
    setLetter("");
    setSupplyQuery("");
    setCategoryId("");
  };

  const saveForm = (event) => {
    event.preventDefault();
    if (!form.destination.trim() || !form.number.trim() || !(form.items || []).length) return;
    const record = {
      ...form,
      id: form.id || crypto.randomUUID(),
      destination: form.destination.trim(),
      number: form.number.trim(),
      items: form.items || [],
      source: form.source || restaurantName,
      approval: form.approval || "pending",
    };
    const next = form.id
      ? rows.map((row) => (row.id === form.id ? record : row))
      : [record, ...rows];
    saveRows(next);
    setForm(null);
  };

  const downloadRow = (row) => {
    const text = [
      `${t("nav.requisition_no")}: ${row.number}`,
      `${t("nav.requisition_date")}: ${formatDate(row.date)}`,
      `${receive ? t("nav.receive_from") : t("nav.requisition_to")}: ${receive ? sourceOf(row) : row.destination}`,
      `${t("nav.requisition_expected")}: ${formatDate(row.expectedDate)}`,
      `${t("nav.requisition_status")}: ${t(receive ? `nav.receive_${approvalOf(row)}` : `nav.requisition_${row.status}`)}`,
      ...(row.items || []).map(
        (item) =>
          `${item.name}${item.unit ? ` (${item.unit})` : ""}: ${item.required} / ${item.accepted}`,
      ),
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${row.number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const itemLabel = (item) => `${item.name}${item.unit ? ` (${item.unit})` : ""}`;

  const visibleSupplies = useMemo(() => {
    const term = supplyQuery.trim().toLowerCase();
    return supplies.filter((item) => {
      if (categoryId && categoryIdOf(item) !== categoryId) return false;
      if (letter && !String(item.name || "").toUpperCase().startsWith(letter)) return false;
      if (term && !String(item.name || "").toLowerCase().includes(term)) return false;
      if (lowStock && Number(item.stock) > Number(item.minStockAlert || 0)) return false;
      return true;
    });
  }, [supplies, categoryId, letter, supplyQuery, lowStock]);

  const toggleSupply = (item) => {
    setForm((current) => {
      const items = current.items || [];
      if (items.some((line) => line.itemId === item._id)) {
        return { ...current, items: items.filter((line) => line.itemId !== item._id) };
      }
      return {
        ...current,
        items: [
          ...items,
          {
            itemId: item._id,
            name: item.name,
            unit: item.unit || "",
            required: "1",
            accepted: "0",
          },
        ],
      };
    });
  };

  const updateRequired = (itemId, required) => {
    setForm((current) => ({
      ...current,
      items: (current.items || []).map((line) =>
        line.itemId === itemId ? { ...line, required } : line,
      ),
    }));
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      const result = await ingredientCategoryService.create(name);
      const created = result?.data;
      if (created) {
        setCategories((current) => [...current, created]);
        setCategoryId(created._id);
      }
      setNewCategory("");
      setAddingCategory(false);
    } catch {
      setAddingCategory(false);
    }
  };

  const updateAccepted = (index, accepted) => {
    setViewing((current) => ({
      ...current,
      items: (current.items || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, accepted } : item,
      ),
    }));
  };

  const decide = (approval) => {
    if (!viewing) return;
    const record = { ...viewing, approval, items: viewing.items || [] };
    saveRows(rows.map((row) => (row.id === record.id ? record : row)));
    setViewing(record);
  };

  if (viewing) {
    const lines = viewing.items || [];
    const approval = receive ? approvalOf(viewing) : "";
    const reviewing = receive && approval === "pending";
    const titleKey = receive
      ? reviewing
        ? "nav.receive_review"
        : "nav.receive_view"
      : "nav.requisition_view_title";
    return (
      <div className="requisition-page">
        <div className="requisition-head">
          <button type="button" className="requisition-back" onClick={() => setViewing(null)}>
            <span aria-hidden="true">‹</span>
            {t(titleKey)} (#{viewing.number})
          </button>
        </div>
        <section className="requisition-card requisition-detail">
          <div className="requisition-detail-head">
            <h2>{t("nav.requisition_info")}</h2>
            <div>
              <button type="button" className="requisition-outline" onClick={() => downloadRow(viewing)}>
                <Download size={15} />
                {t("nav.requisition_download")}
              </button>
              <button type="button" className="requisition-outline" onClick={() => window.print()}>
                <Printer size={15} />
                {t("nav.requisition_print")}
              </button>
            </div>
          </div>
          <div className="requisition-info">
            <span>{t("nav.requisition_date")}: <strong>{formatDate(viewing.date)}</strong></span>
            <span>{t("nav.requisition_expected")}: <strong>{formatDate(viewing.expectedDate)}</strong></span>
            <span>{receive ? t("nav.receive_from") : t("nav.requisition_to")}: <strong>{receive ? sourceOf(viewing) : viewing.destination}</strong></span>
            <em className={statusOf(viewing)}>
              {t(receive ? `nav.receive_${approvalOf(viewing)}` : `nav.requisition_${viewing.status}`)}
            </em>
          </div>
          <h2>{t("nav.requisition_items")}</h2>
          <div className="requisition-items">
            <div className="requisition-item head">
              <span>{t("nav.purchase_item")}</span>
              <span>{t("nav.requisition_required")}</span>
              <span>{t("nav.requisition_accepted")}</span>
            </div>
            {lines.length === 0 && <p>{t("nav.requisition_no_items")}</p>}
            {lines.map((item, index) => (
              <div key={`${item.itemId}-${index}`} className="requisition-item">
                <span>{itemLabel(item)}</span>
                <span>{item.required}</span>
                {reviewing ? (
                  <input
                    inputMode="decimal"
                    aria-label={t("nav.requisition_accepted")}
                    value={item.accepted ?? ""}
                    onChange={(event) =>
                      updateAccepted(index, event.target.value.replace(/[^\d.]/g, ""))
                    }
                  />
                ) : (
                  <span>{item.accepted}</span>
                )}
              </div>
            ))}
          </div>
          {reviewing && (
            <div className="requisition-decide">
              <button type="button" className="requisition-decline" onClick={() => decide("declined")}>
                {t("nav.receive_decline")}
              </button>
              <button type="button" className="requisition-approve" onClick={() => decide("approved")}>
                {t("nav.receive_approve")}
              </button>
            </div>
          )}
          {receive && approval === "approved" && (
            <div className="requisition-decide">
              <button type="button" className="requisition-decline" onClick={() => decide("declined")}>
                {t("nav.receive_decline")}
              </button>
            </div>
          )}
          {receive && approval === "declined" && (
            <div className="requisition-decide">
              <button type="button" className="requisition-approve" onClick={() => decide("approved")}>
                {t("nav.receive_approve")}
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (form) {
    const lines = form.items || [];
    return (
      <div className="requisition-page">
        <div className="requisition-head">
          <button type="button" className="requisition-back" onClick={() => setForm(null)}>
            <span aria-hidden="true">‹</span>
            {form.id ? `#${form.number}` : t("nav.requisition_add")}
          </button>
          {!form.id && (
            <button
              type="button"
              className={`requisition-outline ${lowStock ? "active" : ""}`}
              onClick={() => setLowStock((current) => !current)}
            >
              {t("nav.requisition_low_stock")}
            </button>
          )}
        </div>
        <section className="requisition-card requisition-composer">
          <div className="requisition-categories">
            <span>{t("nav.purchase_category")}</span>
            <button
              type="button"
              aria-label={t("nav.purchase_add_category")}
              onClick={() => setAddingCategory((open) => !open)}
            >
              <Plus size={14} />
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                type="button"
                className={categoryId === category._id ? "active" : ""}
                onClick={() => {
                  setCategoryId((current) => (current === category._id ? "" : category._id));
                  setLetter("");
                }}
              >
                {category.name}
              </button>
            ))}
            {categories.length === 0 && <em>{t("nav.purchase_no_categories")}</em>}
          </div>
          {addingCategory && (
            <form
              className="requisition-new-category"
              onSubmit={(event) => {
                event.preventDefault();
                addCategory();
              }}
            >
              <input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder={t("nav.purchase_category_name")}
              />
              <button type="submit">{t("nav.purchase_add_category")}</button>
            </form>
          )}
          <div className="requisition-workspace">
            <div>
              <div className="requisition-supply-bar">
                <strong>
                  {t("nav.purchase_supplies")}
                  <Link to="/inventory" aria-label={t("nav.inventory")}>
                    <Plus size={14} />
                  </Link>
                </strong>
                <label>
                  <Search size={14} />
                  <input
                    value={supplyQuery}
                    onChange={(event) => setSupplyQuery(event.target.value)}
                    placeholder={t("nav.purchase_search")}
                  />
                </label>
              </div>
              <p className="requisition-popular">
                {t("nav.requisition_popular", {
                  count: String(visibleSupplies.length).padStart(2, "0"),
                })}
              </p>
              <div className="requisition-grid-wrap">
                <div className="requisition-grid">
                  {visibleSupplies.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      className={lines.some((line) => line.itemId === item._id) ? "selected" : ""}
                      onClick={() => toggleSupply(item)}
                    >
                      <Package size={16} />
                      <span>{item.name}</span>
                    </button>
                  ))}
                  {visibleSupplies.length === 0 && <p>{t("nav.purchase_no_items")}</p>}
                </div>
                <div className="requisition-letters">
                  {LETTERS.map((mark) => (
                    <button
                      key={mark}
                      type="button"
                      className={letter === mark ? "active" : ""}
                      onClick={() => setLetter((current) => (current === mark ? "" : mark))}
                    >
                      {mark}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="requisition-order">
              <div className="requisition-order-row head">
                <span>{t("nav.purchase_item")}</span>
                <span>{t("nav.requisition_order_qty")}</span>
                <span>{t("nav.requisition_closing")}</span>
              </div>
              {lines.map((line) => {
                const supply = supplies.find((item) => item._id === line.itemId);
                return (
                  <div key={line.itemId} className="requisition-order-row">
                    <span>
                      {itemLabel(line)}
                      <button
                        type="button"
                        aria-label={t("nav.purchase_remove")}
                        onClick={() => toggleSupply(supply || { _id: line.itemId })}
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                    <input
                      inputMode="decimal"
                      aria-label={t("nav.requisition_order_qty")}
                      value={line.required}
                      onChange={(event) =>
                        updateRequired(line.itemId, event.target.value.replace(/[^\d.]/g, ""))
                      }
                    />
                    <span>{supply?.stock ?? "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <form className="requisition-entry-foot" onSubmit={saveForm}>
            <span>
              {t("nav.requisition_date")}: <strong>{formatDate(form.date)}</strong>
            </span>
            <label>
              {t("nav.requisition_expected")}:
              <input
                type="date"
                required
                value={form.expectedDate}
                onChange={(event) => setForm({ ...form, expectedDate: event.target.value })}
              />
            </label>
            <label>
              {t("nav.requisition_to")}:
              <select
                required
                value={form.destination}
                onChange={(event) => setForm({ ...form, destination: event.target.value })}
              >
                <option value="">{t("nav.requisition_select")}</option>
                {departments.map((department) => (
                  <option key={department._id} value={department.name}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <button type="button" className="requisition-cancel" onClick={() => setForm(null)}>
                {t("nav.purchase_cancel")}
              </button>
              <button type="submit" className="requisition-submit">
                {t("nav.purchase_submit")}
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="requisition-page">
      <div className="requisition-head">
        <h1>{t(receive ? "nav.receive_title" : "nav.requisition_title")}</h1>
        {!receive && (
          <button type="button" className="requisition-add" onClick={openCreate}>
            <Plus size={16} />
            {t("nav.requisition_add")}
          </button>
        )}
      </div>

      <section className="requisition-card">
        <div className="requisition-tools">
          <label>
            <Search size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("nav.purchase_search")}
            />
          </label>
          <label>
            {t("nav.requisition_sort")}
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="date">{t("nav.requisition_date")}</option>
              <option value="number">{t("nav.requisition_no")}</option>
              <option value="destination">{t(receive ? "nav.receive_from" : "nav.requisition_to")}</option>
              <option value="expected">{t("nav.requisition_expected")}</option>
              <option value="status">{t("nav.requisition_status")}</option>
            </select>
          </label>
          <label>
            {t("nav.requisition_filter")}
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">{t("nav.requisition_all")}</option>
              {receive ? (
                <>
                  <option value="pending">{t("nav.receive_pending")}</option>
                  <option value="approved">{t("nav.receive_approved")}</option>
                  <option value="declined">{t("nav.receive_declined")}</option>
                </>
              ) : (
                <>
                  <option value="undelivered">{t("nav.requisition_undelivered")}</option>
                  <option value="delivered">{t("nav.requisition_delivered")}</option>
                </>
              )}
            </select>
          </label>
        </div>

        <div className="requisition-table">
          <div className="requisition-row head">
            <span>{t("nav.requisition_date")}</span>
            <span>{t("nav.requisition_no")}</span>
            <span>{t(receive ? "nav.receive_from" : "nav.requisition_to")}</span>
            <span>{t("nav.requisition_expected")}</span>
            <span>{t("nav.requisition_status")}</span>
            <span>{t("nav.requisition_actions")}</span>
          </div>
          {visible.length === 0 && <p>{t(receive ? "nav.receive_empty" : "nav.requisition_empty")}</p>}
          {visible.map((row) => (
            <div key={row.id} className="requisition-row">
              <span>{formatDate(row.date)}</span>
              <span>{row.number}</span>
              <span>{receive ? sourceOf(row) : row.destination}</span>
              <span>{formatDate(row.expectedDate)}</span>
              <span>
                <em className={statusOf(row)}>
                  {t(receive ? `nav.receive_${approvalOf(row)}` : `nav.requisition_${row.status}`)}
                </em>
              </span>
              <span className="requisition-actions">
                <button type="button" aria-label={t("nav.requisition_download")} onClick={() => downloadRow(row)}>
                  <Download size={15} />
                </button>
                <button type="button" aria-label={t("nav.requisition_view")} onClick={() => { setForm(null); setViewing(row); }}>
                  <Eye size={15} />
                </button>
                <button type="button" aria-label={t("nav.requisition_edit")} onClick={() => { setViewing(null); setForm(row); }}>
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

export default Requisitions;

