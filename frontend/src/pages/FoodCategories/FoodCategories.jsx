import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, UtensilsCrossed, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import categoryService from "@services/categoryService";
import uploadService from "@services/uploadService";
import "./FoodCategories.css";

const EMPTY_FORM = { name: "", image: "" };

const FoodCategories = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_categories");
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const draft = form || EMPTY_FORM;

  const load = () => {
    categoryService
      .getAll()
      .then((result) => setCategories(result?.data || []))
      .catch((error) => setMessage({ type: "error", text: error.response?.data?.message || t("menu.error_fetching_categories") }));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const visible = categories.filter((category) => category.name.toLowerCase().includes(query.trim().toLowerCase()));

  const close = () => {
    setForm(null);
    setEditingId(null);
  };

  const open = (category) => {
    setEditingId(category?._id || null);
    setForm({ name: category?.name || "", image: category?.image || "" });
  };

  const upload = async (file) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setMessage({ type: "error", text: t("menu.invalid_image_type") });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: t("menu.image_too_large") });
      return;
    }
    setUploading(true);
    try {
      const response = await uploadService.uploadImage(file);
      if (response.success && response.data?.url) {
        setForm({ ...draft, image: response.data.url });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("menu.image_upload_failed") });
    } finally {
      setUploading(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (name.length < 2) return;
    const payload = { name, isActive: true };
    if (draft.image) payload.image = draft.image;
    else if (editingId) payload.image = null;
    try {
      if (editingId) await categoryService.update(editingId, payload);
      else await categoryService.create(payload);
      setMessage({ type: "success", text: t(editingId ? "menu.category_updated" : "menu.category_created") });
      close();
      load();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t(editingId ? "menu.error_updating_category" : "menu.error_creating_category") });
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("menu.confirm_delete_category"))) return;
    try {
      await categoryService.delete(id);
      setMessage({ type: "success", text: t("menu.category_deleted") });
      load();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("menu.error_deleting_category") });
    }
  };

  return (
    <div className="food-categories">
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.food_category")}</h1>
      <div className="food-categories-toolbar">
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
        {canManage && (
          <button type="button" className="food-categories-new" onClick={() => open(null)}>
            <Plus size={16} />
            {t("menu.new_category")}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.food_category")}</th>
              <th>{t("menu.action")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={2}>{t("menu.no_categories")}</td>
              </tr>
            ) : (
              visible.map((category) => (
                <tr key={category._id}>
                  <td>
                    <span className="food-categories-name">
                      {category.image ? (
                        <img src={category.image} alt="" />
                      ) : (
                        <span className="food-categories-mark">
                          <UtensilsCrossed size={14} />
                        </span>
                      )}
                      {category.name}
                    </span>
                  </td>
                  <td className="food-categories-actions">
                    {canManage && (
                      <>
                        <button type="button" className="food-categories-edit" aria-label={t("common.edit")} onClick={() => open(category)}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="food-categories-delete" aria-label={t("common.delete")} onClick={() => remove(category._id)}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="food-categories-overlay">
          <form className="food-categories-dialog" onSubmit={save}>
            <header>
              <h2>{t(editingId ? "menu.edit_category" : "menu.new_category")}</h2>
              <button type="button" aria-label={t("common.close")} onClick={close}>
                <X size={18} />
              </button>
            </header>
            <label>
              {t("menu.category_name")}
              <input value={draft.name} onChange={(event) => setForm({ ...draft, name: event.target.value })} required minLength={2} maxLength={50} />
            </label>
            <label>
              {t("menu.image")}
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
            </label>
            {draft.image && <img className="food-categories-preview" src={draft.image} alt="" />}
            <footer>
              <button type="button" className="food-categories-cancel" onClick={close}>
                {t("common.cancel")}
              </button>
              <button type="submit" className="food-categories-new" disabled={uploading}>
                {t("common.save")}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
};

export default FoodCategories;
