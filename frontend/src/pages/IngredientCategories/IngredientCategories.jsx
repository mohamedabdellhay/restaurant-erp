import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import ingredientCategoryService from "@services/ingredientCategoryService";
import { getErrorMessage } from "../../utils/errorMessage";
import "./IngredientCategories.css";

const IngredientCategories = () => {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_inventory");
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = async () => {
    try {
      const response = await ingredientCategoryService.getAll();
      if (response.success) setCategories(response.data || []);
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const visible = categories.filter((category) =>
    category.name?.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const openModal = (category = null) => {
    setEditing(category);
    setName(category?.name || "");
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setName("");
  };

  const save = async (event) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) return;
    try {
      const response = editing
        ? await ingredientCategoryService.update(editing._id, nextName)
        : await ingredientCategoryService.create(nextName);
      if (!response.success) {
        setMessage({ type: "error", text: response.message });
        return;
      }
      setMessage({
        type: "success",
        text: editing ? t("inventory.category_updated") : t("inventory.category_created"),
      });
      closeModal();
      load();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("inventory.confirm_delete_category"))) return;
    try {
      const response = await ingredientCategoryService.delete(id);
      if (!response.success) {
        setMessage({ type: "error", text: response.message });
        return;
      }
      setMessage({ type: "success", text: t("inventory.category_deleted") });
      load();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    }
  };

  return (
    <div className="ingredient-categories" data-direction={i18n.dir()}>
      <Alert type={message.type} message={message.text} />
      <h1>{t("inventory.ingredients_category")}</h1>
      <div className="ingredient-categories-toolbar">
        <label className="ingredient-categories-search">
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
          <button type="button" className="ingredient-categories-new" onClick={() => openModal()}>
            <Plus size={16} />
            {t("inventory.new_category")}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("inventory.ingredients_category")}</th>
              <th className="ingredient-categories-action">{t("inventory.action")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={2} className="ingredient-categories-empty">
                  {t("inventory.no_categories")}
                </td>
              </tr>
            ) : (
              visible.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td className="ingredient-categories-action">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          className="ingredient-categories-edit"
                          onClick={() => openModal(category)}
                          aria-label={t("common.edit")}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="ingredient-categories-delete"
                          onClick={() => remove(category._id)}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 size={15} />
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

      {open && (
        <div className="ingredient-categories-overlay">
          <div className="ingredient-categories-modal" role="dialog" aria-modal="true">
            <div className="ingredient-categories-modal-head">
              <h2>{editing ? t("inventory.edit_category") : t("inventory.new_category")}</h2>
              <button type="button" onClick={closeModal} aria-label={t("common.cancel")}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save}>
              <label htmlFor="ingredient-category-name">{t("inventory.category_name")}</label>
              <input
                id="ingredient-category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={50}
              />
              <div className="ingredient-categories-modal-actions">
                <button type="button" className="ingredient-categories-cancel" onClick={closeModal}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="ingredient-categories-new">
                  {editing ? t("common.update") : t("common.add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientCategories;
