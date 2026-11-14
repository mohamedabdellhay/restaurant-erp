import { useEffect, useState } from "react";
import { Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import { useRestaurant } from "@hooks/useRestaurant";
import uploadService from "@services/uploadService";
import { formatMoney } from "../../utils/money";
import { readCategories, readItems, stockLevel, writeItems } from "./supportStorage";
import "./SupportItems.css";

const EMPTY = {
  id: "",
  name: "",
  categoryId: "",
  unit: "",
  capacity: "",
  quantity: "",
  price: "",
  image: "",
};

function formatQty(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "00";
  const text = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(number);
  return text.padStart(2, "0");
}

const SupportItems = () => {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const { getRestaurantId, getCurrency } = useRestaurant();
  const restaurantId = getRestaurantId();
  const currency = getCurrency();
  const canManage = hasPermission("manage_inventory");
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setRows(readItems(restaurantId));
    setCategories(readCategories(restaurantId));
  }, [restaurantId]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const draft = form || EMPTY;
  const categoryName = (id) => categories.find((category) => category.id === id)?.name || "";

  const visible = rows.filter((row) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [row.name, categoryName(row.categoryId), row.unit].join(" ").toLowerCase().includes(term);
  });

  const openCreate = () => setForm({ ...EMPTY });

  const openEdit = (row) =>
    setForm({
      id: row.id,
      name: row.name || "",
      categoryId: row.categoryId || "",
      unit: row.unit || "",
      capacity: String(row.capacity ?? ""),
      quantity: String(row.quantity ?? ""),
      price: String(row.price ?? ""),
      image: row.image || "",
    });

  const save = (event) => {
    event.preventDefault();
    const name = draft.name.trim();
    const unit = draft.unit.trim();
    if (!name || !unit) return;
    const record = {
      id: draft.id || crypto.randomUUID(),
      name,
      categoryId: draft.categoryId,
      unit,
      capacity: Number(draft.capacity) || 0,
      quantity: Number(draft.quantity) || 0,
      price: Number(draft.price) || 0,
      image: draft.image || "",
    };
    const next = draft.id ? rows.map((row) => (row.id === draft.id ? record : row)) : [...rows, record];
    setRows(next);
    writeItems(restaurantId, next);
    setMessage({ type: "success", text: t(draft.id ? "nav.support_item_updated" : "nav.support_item_created") });
    setForm(null);
  };

  const remove = (id) => {
    if (!window.confirm(t("nav.support_item_confirm_delete"))) return;
    const next = rows.filter((row) => row.id !== id);
    setRows(next);
    writeItems(restaurantId, next);
    setMessage({ type: "success", text: t("nav.support_item_deleted") });
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setMessage({ type: "error", text: t("inventory.invalid_image_type") });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: t("inventory.image_too_large") });
      return;
    }
    try {
      setUploading(true);
      const response = await uploadService.uploadImage(file);
      if (response.success && response.data?.url) {
        setForm((current) => ({ ...(current || EMPTY), image: response.data.url }));
        setMessage({ type: "success", text: t("inventory.image_uploaded") });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("inventory.image_upload_failed") });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="support-items" data-direction={i18n.dir()}>
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.support_items")}</h1>
      <div className="support-items-toolbar">
        <label className="support-items-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("inventory.quick_search")}
            aria-label={t("inventory.quick_search")}
          />
        </label>
        {canManage && (
          <button type="button" className="support-items-new" onClick={openCreate}>
            <Plus size={16} />
            {t("nav.support_item_new")}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.support_item_name")}</th>
              <th>{t("inventory.category")}</th>
              <th>{t("inventory.unit")}</th>
              <th>{t("nav.support_item_capacity")}</th>
              <th>{t("nav.support_item_quantity")}</th>
              <th>{t("nav.support_item_price")}</th>
              <th>{t("nav.support_item_value")}</th>
              <th>{t("nav.support_item_level")}</th>
              <th className="support-items-action">{t("inventory.action")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="support-items-empty">
                  {t("nav.support_item_empty")}
                </td>
              </tr>
            ) : (
              visible.map((row) => {
                const level = stockLevel(row.quantity, row.capacity);
                const value = (Number(row.quantity) || 0) * (Number(row.price) || 0);
                return (
                  <tr key={row.id}>
                    <td>
                      <span className="support-item-name">
                        <span className="support-item-thumb" aria-hidden="true">
                          {row.image ? <img src={row.image} alt="" /> : <Package size={16} />}
                        </span>
                        <span>{row.name}</span>
                      </span>
                    </td>
                    <td>{categoryName(row.categoryId) || "—"}</td>
                    <td>{row.unit || "—"}</td>
                    <td>{formatQty(row.capacity)}</td>
                    <td>{formatQty(row.quantity)}</td>
                    <td>{formatMoney(row.price, currency)}</td>
                    <td>{formatMoney(value, currency)}</td>
                    <td>
                      <span className={`support-stock support-stock-${level}`}>{t(`nav.support_item_${level}`)}</span>
                    </td>
                    <td className="support-items-action">
                      {canManage && (
                        <>
                          <button type="button" className="support-items-edit" onClick={() => openEdit(row)} aria-label={t("common.edit")}>
                            <Pencil size={15} />
                          </button>
                          <button type="button" className="support-items-delete" onClick={() => remove(row.id)} aria-label={t("common.delete")}>
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="support-items-overlay">
          <div className="support-items-modal" role="dialog" aria-modal="true">
            <div className="support-items-modal-head">
              <h2>{draft.id ? t("nav.support_item_edit") : t("nav.support_item_add")}</h2>
              <button type="button" onClick={() => setForm(null)} aria-label={t("common.cancel")}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save}>
              <label>
                {t("nav.support_item_name")}
                <input value={draft.name} onChange={(event) => setForm({ ...draft, name: event.target.value })} required />
              </label>
              <label>
                {t("inventory.category")}
                <select value={draft.categoryId} onChange={(event) => setForm({ ...draft, categoryId: event.target.value })}>
                  <option value="">{t("nav.sfg_select")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("inventory.unit")}
                <input value={draft.unit} onChange={(event) => setForm({ ...draft, unit: event.target.value })} required />
              </label>
              <label>
                {t("nav.support_item_capacity")}
                <input type="number" min="0" step="any" value={draft.capacity} onChange={(event) => setForm({ ...draft, capacity: event.target.value })} />
              </label>
              <label>
                {t("nav.support_item_quantity")}
                <input type="number" min="0" step="any" value={draft.quantity} onChange={(event) => setForm({ ...draft, quantity: event.target.value })} />
              </label>
              <label>
                {t("nav.support_item_price")}
                <input type="number" min="0" step="any" value={draft.price} onChange={(event) => setForm({ ...draft, price: event.target.value })} />
              </label>
              <label>
                {t("inventory.image")}
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={uploadImage} disabled={uploading} />
              </label>
              {draft.image && <img className="support-item-preview" src={draft.image} alt="" />}
              <div className="support-items-modal-actions">
                <button type="button" className="support-items-cancel" onClick={() => setForm(null)}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="support-items-new" disabled={uploading}>
                  {draft.id ? t("common.update") : t("common.add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportItems;
