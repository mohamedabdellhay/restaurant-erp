import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Eye, Package, Pencil, Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import supplierService from "@services/supplierService";
import inventoryService from "@services/inventoryService";
import ingredientCategoryService from "@services/ingredientCategoryService";
import { useRestaurant } from "@hooks/useRestaurant";
import { formatMoney } from "../../utils/money";
import "./PurchaseOrders.css";

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
  supplierId: "",
  supplierName: "",
  expectedDate: "",
  status: "undelivered",
  quotation: "",
  items: [],
};

function storageKey(restaurantId) {
  return `purchaseOrders:${restaurantId || "restaurant"}`;
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
  return `PO-${String(highest + 1).padStart(4, "0")}`;
}

const PurchaseOrders = () => {
  const { t } = useTranslation();
  const { getRestaurantId, getCurrency } = useRestaurant();
  const restaurantId = getRestaurantId();
  const currency = getCurrency();
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [supplies, setSupplies] = useState([]);
  const [categories, setCategories] = useState([]);
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
    supplierService
      .getAll()
      .then((result) => setSuppliers(result?.data || []))
      .catch(() => setSuppliers([]));
    inventoryService
      .getAll()
      .then((result) => setSupplies(result?.data || []))
      .catch(() => setSupplies([]));
    ingredientCategoryService
      .getAll()
      .then((result) => setCategories(result?.data || []))
      .catch(() => setCategories([]));
  }, []);

  const saveRows = (next) => {
    setRows(next);
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(next));
  };

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (filter !== "all" && row.status !== filter) return false;
        if (!term) return true;
        return [row.number, row.supplierName, row.status].join(" ").toLowerCase().includes(term);
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [rows, query, filter]);

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
      quotation: "",
    });
    setLowStock(false);
    setLetter("");
    setSupplyQuery("");
    setCategoryId("");
  };

  const saveForm = (event) => {
    event.preventDefault();
    const supplier = suppliers.find((item) => item._id === form.supplierId);
    if (!form.number.trim() || !supplier) return;
    const record = {
      ...form,
      id: form.id || crypto.randomUUID(),
      number: form.number.trim(),
      supplierName: supplier.name,
      items: form.items || [],
      quotation: (form.quotation || "").trim(),
    };
    const next = form.id
      ? rows.map((row) => (row.id === form.id ? record : row))
      : [record, ...rows];
    saveRows(next);
    setForm(null);
  };

  const downloadRow = (row) => {
    const text = [
      `${t("nav.po_no")}: ${row.number}`,
      `${t("nav.po_date")}: ${formatDate(row.date)}`,
      `${t("nav.po_supplier")}: ${row.supplierName}`,
      `${t("nav.po_expected")}: ${formatDate(row.expectedDate)}`,
      `${t("nav.po_status")}: ${t(`nav.po_${row.status}`)}`,
      ...(row.items || []).map((item) => {
        const total = (Number(item.qty) || 0) * (Number(item.price) || 0);
        return `${item.name}: ${item.qty} x ${formatMoney(item.price, currency)} = ${formatMoney(total, currency)}`;
      }),
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${row.number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
            qty: "1",
            price: Number(item.costPrice) || 0,
          },
        ],
      };
    });
  };

  const updateQty = (itemId, qty) => {
    setForm((current) => ({
      ...current,
      items: (current.items || []).map((line) => (line.itemId === itemId ? { ...line, qty } : line)),
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

  const itemLabel = (item) => `${item.name}${item.unit ? ` (${item.unit})` : ""}`;

  if (viewing) {
    const lines = viewing.items || [];
    const grand = lines.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);
    return (
      <div className="po-page">
        <div className="po-head">
          <button type="button" className="po-back" onClick={() => setViewing(null)}>
            <span aria-hidden="true">‹</span>
            {t("nav.po_view")}
          </button>
        </div>
        <section className="po-card po-detail">
          <h2>{viewing.number}</h2>
          <div className="po-info">
            <span>{t("nav.po_date")}: <strong>{formatDate(viewing.date)}</strong></span>
            <span>{t("nav.po_expected")}: <strong>{formatDate(viewing.expectedDate)}</strong></span>
            <span>{t("nav.po_supplier_label")}: <strong>{viewing.supplierName}</strong></span>
            <em className={viewing.status}>{t(`nav.po_${viewing.status}`)}</em>
          </div>
          <h3>{t("nav.po_items")}</h3>
          <div className="po-lines">
            <div className="po-line head">
              <span>{t("nav.purchase_item")}</span>
              <span>{t("nav.po_qty")}</span>
              <span>{t("nav.po_price")}</span>
              <span>{t("nav.po_line_total")}</span>
            </div>
            {lines.length === 0 && <p>{t("nav.po_no_items")}</p>}
            {lines.map((item, index) => {
              const total = (Number(item.qty) || 0) * (Number(item.price) || 0);
              return (
                <div key={`${item.itemId}-${index}`} className="po-line">
                  <span>{itemLabel(item)}</span>
                  <span>{item.qty}</span>
                  <span>{formatMoney(item.price, currency)}</span>
                  <span>{formatMoney(total, currency)}</span>
                </div>
              );
            })}
            <div className="po-line total">
              <span>{t("nav.po_grand")}</span>
              <span />
              <span />
              <span>{formatMoney(grand, currency)}</span>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (form) {
    const lines = form.items || [];
    const amount = lines.reduce((sum, line) => sum + (Number(line.qty) || 0) * (Number(line.price) || 0), 0);
    return (
      <div className="po-page">
        <div className="po-head">
          <button type="button" className="po-back" onClick={() => setForm(null)}>
            <span aria-hidden="true">‹</span>
            {form.id ? form.number : t("nav.po_add")}
          </button>
          <button
            type="button"
            className={`po-outline ${lowStock ? "active" : ""}`}
            onClick={() => setLowStock((current) => !current)}
          >
            {t("nav.requisition_low_stock")}
          </button>
        </div>
        <section className="po-card po-composer">
          <div className="po-categories">
            <span>{t("nav.purchase_category")}</span>
            <button type="button" aria-label={t("nav.purchase_add_category")} onClick={() => setAddingCategory((open) => !open)}>
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
              className="po-new-category"
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
          <div className="po-workspace">
            <div>
              <div className="po-supply-bar">
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
              <p className="po-popular">
                {t("nav.requisition_popular", { count: String(visibleSupplies.length).padStart(2, "0") })}
              </p>
              <div className="po-grid-wrap">
                <div className="po-grid">
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
                <div className="po-letters">
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
            <div className="po-order">
              <div className="po-order-row head">
                <span>{t("nav.po_line_items")}</span>
                <span>{t("nav.po_order_qty")}</span>
                <span>{t("nav.po_price")}</span>
                <span>{t("nav.po_closing")}</span>
              </div>
              {lines.map((line) => {
                const supply = supplies.find((item) => item._id === line.itemId);
                return (
                  <div key={line.itemId} className="po-order-row">
                    <span>{itemLabel(line)}</span>
                    <input
                      inputMode="decimal"
                      aria-label={t("nav.po_order_qty")}
                      value={line.qty}
                      onChange={(event) => updateQty(line.itemId, event.target.value.replace(/[^\d.]/g, ""))}
                    />
                    <span>{formatMoney(line.price, currency)}</span>
                    <span>{supply?.stock ?? "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <form className="po-entry-foot" onSubmit={saveForm}>
            <span>{t("nav.po_date")}: <strong>{formatDate(form.date)}</strong></span>
            <label>
              {t("nav.po_expected")}:
              <input
                type="date"
                required
                value={form.expectedDate}
                onChange={(event) => setForm({ ...form, expectedDate: event.target.value })}
              />
            </label>
            <label>
              {t("nav.po_supplier_label")}:
              <select
                required
                value={form.supplierId}
                onChange={(event) => setForm({ ...form, supplierId: event.target.value })}
              >
                <option value="">{t("nav.purchase_select_supplier")}</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                ))}
              </select>
            </label>
            <label>
              {t("nav.po_quotation")}:
              <input
                value={form.quotation || ""}
                onChange={(event) => setForm({ ...form, quotation: event.target.value })}
              />
            </label>
            <p>{t("nav.po_amount")}: <strong>{formatMoney(amount, currency)}</strong></p>
            <div>
              <button type="button" className="po-cancel" onClick={() => setForm(null)}>{t("nav.purchase_cancel")}</button>
              <button type="submit" className="po-submit">{t("nav.purchase_submit")}</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="po-page">
      <div className="po-head">
        <h1>{t("nav.po_title")}</h1>
        <button type="button" className="po-add" onClick={openCreate}>
          <Plus size={16} />
          {t("nav.po_add")}
        </button>
      </div>
      <section className="po-card">
        <div className="po-tools">
          <label>
            <Search size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("nav.purchase_search")}
            />
          </label>
          <label>
            {t("nav.requisition_filter")}
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">{t("nav.requisition_all")}</option>
              <option value="undelivered">{t("nav.po_undelivered")}</option>
              <option value="delivered">{t("nav.po_delivered")}</option>
            </select>
          </label>
        </div>
        <div className="po-table">
          <div className="po-row head">
            <span>{t("nav.po_date")}</span>
            <span>{t("nav.po_no")}</span>
            <span>{t("nav.po_supplier")}</span>
            <span>{t("nav.po_expected")}</span>
            <span>{t("nav.po_status")}</span>
            <span>{t("nav.requisition_actions")}</span>
          </div>
          {visible.length === 0 && <p>{t("nav.po_empty")}</p>}
          {visible.map((row) => (
            <div key={row.id} className="po-row">
              <span>{formatDate(row.date)}</span>
              <span>{row.number}</span>
              <span>{row.supplierName}</span>
              <span>{formatDate(row.expectedDate)}</span>
              <span>
                <em className={row.status}>{t(`nav.po_${row.status}`)}</em>
              </span>
              <span className="po-actions">
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

export default PurchaseOrders;
