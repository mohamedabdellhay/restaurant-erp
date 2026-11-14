import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import { useRestaurant } from "@hooks/useRestaurant";
import categoryService from "@services/categoryService";
import menuService from "@services/menuService";
import "./DiscountExclusions.css";

const EMPTY_FORM = { categoryId: "", itemId: "", discount: true, promotions: true };

function storageKey(restaurantId) {
  return `discountExclusions:${restaurantId || "restaurant"}`;
}

function readRows(restaurantId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(restaurantId)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function categoryIdOf(item) {
  const category = item?.category;
  if (category && typeof category === "object") return category._id || category.id || "";
  return category || "";
}

const DiscountExclusions = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { getRestaurantId } = useRestaurant();
  const restaurantId = getRestaurantId();
  const canManage = hasPermission("manage_customers") || hasPermission("manage_menu");
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const draft = form || EMPTY_FORM;

  useEffect(() => {
    setRows(readRows(restaurantId));
    categoryService.getAll().then((result) => setCategories(result?.data || [])).catch(() => setCategories([]));
    menuService.getAll().then((result) => setItems(result?.data || [])).catch(() => setItems([]));
  }, [restaurantId]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const saveRows = (next) => {
    setRows(next);
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(next));
  };

  const choices = items.filter((item) => !draft.categoryId || categoryIdOf(item) === draft.categoryId);

  const save = (event) => {
    event.preventDefault();
    const item = items.find((entry) => (entry._id || entry.id) === draft.itemId);
    const category = categories.find((entry) => (entry._id || entry.id) === draft.categoryId);
    if (!item || !category) return;
    const record = {
      id: crypto.randomUUID(),
      categoryId: category._id || category.id,
      categoryName: category.name,
      itemId: item._id || item.id,
      itemName: item.name,
      discount: draft.discount,
      promotions: draft.promotions,
    };
    const without = rows.filter((row) => row.itemId !== record.itemId);
    saveRows([...without, record]);
    setMessage({ type: "success", text: t("nav.discount_exclusion_saved") });
    setForm(null);
  };

  const toggle = (itemId, field) => {
    saveRows(rows.map((row) => (row.itemId === itemId ? { ...row, [field]: !row[field] } : row)));
  };

  return (
    <div className="discount-exclusions">
      <Alert type={message.type} message={message.text} />
      <header className="discount-exclusions-title">
        <h1>{t("nav.discount_exclusion")}</h1>
        {canManage && (
          <button type="button" className="discount-exclusions-new" onClick={() => setForm({ ...EMPTY_FORM })}>
            <Plus size={16} />
            {t("nav.discount_exclusion_new")}
          </button>
        )}
      </header>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.discount_exclusion_category")}</th>
              <th>{t("nav.discount_exclusion_item")}</th>
              <th>{t("nav.discount_exclusion_discount")}</th>
              <th>{t("nav.discount_exclusion_promotions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>{t("nav.discount_exclusion_empty")}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.itemId}>
                  <td>{row.categoryName}</td>
                  <td>
                    <span className="discount-exclusions-item">
                      <Check size={14} />
                      {row.itemName}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={row.discount ? "exclusion-switch on" : "exclusion-switch"}
                      aria-pressed={row.discount}
                      aria-label={t("nav.discount_exclusion_discount")}
                      onClick={() => canManage && toggle(row.itemId, "discount")}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={row.promotions ? "exclusion-switch on" : "exclusion-switch"}
                      aria-pressed={row.promotions}
                      aria-label={t("nav.discount_exclusion_promotions")}
                      onClick={() => canManage && toggle(row.itemId, "promotions")}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="discount-exclusions-overlay">
          <form className="discount-exclusions-dialog" onSubmit={save}>
            <header>
              <h2>{t("nav.discount_exclusion_new")}</h2>
              <button type="button" aria-label={t("common.close")} onClick={() => setForm(null)}>
                <X size={18} />
              </button>
            </header>
            <label>
              {t("nav.discount_exclusion_category")}
              <select
                value={draft.categoryId}
                onChange={(event) => setForm({ ...draft, categoryId: event.target.value, itemId: "" })}
                required
              >
                <option value="">{t("nav.sfg_select")}</option>
                {categories.map((category) => (
                  <option key={category._id || category.id} value={category._id || category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("nav.discount_exclusion_item")}
              <select
                value={draft.itemId}
                onChange={(event) => setForm({ ...draft, itemId: event.target.value })}
                required
              >
                <option value="">{t("nav.sfg_select")}</option>
                {choices.map((item) => (
                  <option key={item._id || item.id} value={item._id || item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <footer>
              <button type="button" className="discount-exclusions-cancel" onClick={() => setForm(null)}>
                {t("common.cancel")}
              </button>
              <button type="submit" className="discount-exclusions-new">
                {t("common.save")}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
};

export default DiscountExclusions;
