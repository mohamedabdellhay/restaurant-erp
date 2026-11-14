import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import { useRestaurant } from "@hooks/useRestaurant";
import "./ExpenseCategories.css";

function storageKey(restaurantId) {
  return `expenseCategories:${restaurantId || "restaurant"}`;
}

function readCategories(restaurantId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(restaurantId)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const ExpenseCategories = () => {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const { getRestaurantId } = useRestaurant();
  const restaurantId = getRestaurantId();
  const canManage = hasPermission("manage_invoices") || hasPermission("manage_inventory");
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

  const saveRows = (next) => {
    setCategories(next);
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(next));
  };

  const save = (event) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) return;
    const next = editing
      ? categories.map((category) => (category.id === editing.id ? { ...category, name: nextName } : category))
      : [...categories, { id: crypto.randomUUID(), name: nextName }];
    saveRows(next);
    setMessage({ type: "success", text: t(editing ? "nav.expense_category_updated" : "nav.expense_category_created") });
    closeModal();
  };

  const remove = (id) => {
    if (!window.confirm(t("nav.expense_category_confirm_delete"))) return;
    saveRows(categories.filter((category) => category.id !== id));
    setMessage({ type: "success", text: t("nav.expense_category_deleted") });
  };

  return (
    <div className="expense-categories" data-direction={i18n.dir()}>
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.expense_categories")}</h1>
      <div className="expense-categories-toolbar">
        <label className="expense-categories-search">
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
          <button type="button" className="expense-categories-new" onClick={() => openModal()}>
            <Plus size={16} />
            {t("inventory.new_category")}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.expense_categories")}</th>
              <th className="expense-categories-action">{t("inventory.action")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={2} className="expense-categories-empty">
                  {t("nav.expense_category_empty")}
                </td>
              </tr>
            ) : (
              visible.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td className="expense-categories-action">
                    {canManage && (
                      <>
                        <button type="button" className="expense-categories-edit" onClick={() => openModal(category)} aria-label={t("common.edit")}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" className="expense-categories-delete" onClick={() => remove(category.id)} aria-label={t("common.delete")}>
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
        <div className="expense-categories-overlay">
          <div className="expense-categories-modal" role="dialog" aria-modal="true">
            <div className="expense-categories-modal-head">
              <h2>{editing ? t("inventory.edit_category") : t("inventory.new_category")}</h2>
              <button type="button" onClick={closeModal} aria-label={t("common.cancel")}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save}>
              <label htmlFor="expense-category-name">{t("inventory.category_name")}</label>
              <input id="expense-category-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={50} />
              <div className="expense-categories-modal-actions">
                <button type="button" className="expense-categories-cancel" onClick={closeModal}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="expense-categories-new">
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

export default ExpenseCategories;
