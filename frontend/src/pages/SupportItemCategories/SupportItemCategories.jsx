import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import { useRestaurant } from "@hooks/useRestaurant";
import { readCategories, writeCategories } from "../SupportItems/supportStorage";
import "./SupportItemCategories.css";

const SupportItemCategories = () => {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const { getRestaurantId } = useRestaurant();
  const restaurantId = getRestaurantId();
  const canManage = hasPermission("manage_inventory");
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setCategories(readCategories(restaurantId));
  }, [restaurantId]);

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

  const save = (event) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) return;
    const next = editing
      ? categories.map((category) => (category.id === editing.id ? { ...category, name: nextName } : category))
      : [...categories, { id: crypto.randomUUID(), name: nextName }];
    setCategories(next);
    writeCategories(restaurantId, next);
    setMessage({ type: "success", text: t(editing ? "nav.support_category_updated" : "nav.support_category_created") });
    closeModal();
  };

  const remove = (id) => {
    if (!window.confirm(t("nav.support_category_confirm_delete"))) return;
    const next = categories.filter((category) => category.id !== id);
    setCategories(next);
    writeCategories(restaurantId, next);
    setMessage({ type: "success", text: t("nav.support_category_deleted") });
  };

  return (
    <div className="support-categories" data-direction={i18n.dir()}>
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.support_item_categories")}</h1>
      <div className="support-categories-toolbar">
        <label className="support-categories-search">
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
          <button type="button" className="support-categories-new" onClick={() => openModal()}>
            <Plus size={16} />
            {t("inventory.new_category")}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("inventory.category")}</th>
              <th className="support-categories-action">{t("inventory.action")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={2} className="support-categories-empty">
                  {t("nav.support_category_empty")}
                </td>
              </tr>
            ) : (
              visible.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td className="support-categories-action">
                    {canManage && (
                      <>
                        <button type="button" className="support-categories-edit" onClick={() => openModal(category)} aria-label={t("common.edit")}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" className="support-categories-delete" onClick={() => remove(category.id)} aria-label={t("common.delete")}>
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
        <div className="support-categories-overlay">
          <div className="support-categories-modal" role="dialog" aria-modal="true">
            <div className="support-categories-modal-head">
              <h2>{editing ? t("inventory.edit_category") : t("inventory.new_category")}</h2>
              <button type="button" onClick={closeModal} aria-label={t("common.cancel")}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save}>
              <label htmlFor="support-category-name">{t("inventory.category_name")}</label>
              <input id="support-category-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={50} />
              <div className="support-categories-modal-actions">
                <button type="button" className="support-categories-cancel" onClick={closeModal}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="support-categories-new">
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

export default SupportItemCategories;
