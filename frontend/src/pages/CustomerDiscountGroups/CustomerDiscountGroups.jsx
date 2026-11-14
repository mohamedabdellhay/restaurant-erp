import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import { useRestaurant } from "@hooks/useRestaurant";
import { readDiscountGroups, writeDiscountGroups } from "../Customers/discountGroups";
import "./CustomerDiscountGroups.css";

const EMPTY_FORM = { name: "", value: "", type: "percent" };

function moneyText(value) {
  return String(value ?? "").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

const CustomerDiscountGroups = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { getRestaurantId, getCurrency } = useRestaurant();
  const restaurantId = getRestaurantId();
  const currency = getCurrency();
  const canManage = hasPermission("manage_customers");
  const [groups, setGroups] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setGroups(readDiscountGroups(restaurantId));
  }, [restaurantId]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const saveRows = (next) => {
    setGroups(next);
    writeDiscountGroups(restaurantId, next);
  };

  const visible = groups.filter((group) => group.name.toLowerCase().includes(query.trim().toLowerCase()));
  const draft = form || EMPTY_FORM;

  const typeLabel = (type) => (type === "amount" ? currency : "%");

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = (group) => {
    setEditingId(group.id);
    setForm({ name: group.name, value: String(group.value), type: group.type });
  };

  const save = (event) => {
    event.preventDefault();
    const name = draft.name.trim();
    const value = Math.round((Number(draft.value) || 0) * 100) / 100;
    if (!name || value <= 0) return;
    const next = editingId
      ? groups.map((group) => (group.id === editingId ? { ...group, name, value, type: draft.type } : group))
      : [...groups, { id: crypto.randomUUID(), name, value, type: draft.type, enabled: true }];
    saveRows(next);
    setMessage({ type: "success", text: t(editingId ? "nav.discount_group_updated" : "nav.discount_group_saved") });
    setForm(null);
    setEditingId(null);
  };

  const toggle = (id) => {
    saveRows(groups.map((group) => (group.id === id ? { ...group, enabled: !group.enabled } : group)));
  };

  const remove = (id) => {
    if (!window.confirm(t("nav.discount_group_confirm_delete"))) return;
    saveRows(groups.filter((group) => group.id !== id));
    setMessage({ type: "success", text: t("nav.discount_group_deleted") });
  };

  return (
    <div className="discount-groups">
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.customer_discount_groups")}</h1>
      <div className="discount-groups-toolbar">
        <label className="discount-groups-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("inventory.quick_search")}
            aria-label={t("inventory.quick_search")}
          />
        </label>
        {canManage && (
          <button type="button" className="discount-groups-new" onClick={openCreate}>
            <Plus size={16} />
            {t("nav.discount_group_new")}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.discount_group_name")}</th>
              <th>{t("nav.discount_group_value")}</th>
              <th>{t("nav.discount_group_type")}</th>
              <th>{t("nav.discount_group_status")}</th>
              <th>{t("inventory.action")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5}>{t("nav.discount_group_empty")}</td>
              </tr>
            ) : (
              visible.map((group) => (
                <tr key={group.id}>
                  <td>{group.name}</td>
                  <td>{group.value}</td>
                  <td>{typeLabel(group.type)}</td>
                  <td>
                    <button
                      type="button"
                      className={group.enabled ? "discount-groups-enabled" : "discount-groups-disabled"}
                      onClick={() => canManage && toggle(group.id)}
                    >
                      {t(group.enabled ? "nav.discount_group_enabled" : "nav.discount_group_disabled")}
                    </button>
                  </td>
                  <td className="discount-groups-actions">
                    {canManage && (
                      <>
                        <button type="button" className="discount-groups-edit" aria-label={t("common.edit")} onClick={() => openEdit(group)}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="discount-groups-delete" aria-label={t("common.delete")} onClick={() => remove(group.id)}>
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
        <div className="discount-groups-overlay">
          <form className="discount-groups-dialog" onSubmit={save}>
            <header>
              <h2>{editingId ? t("common.edit") : t("nav.discount_group_new")}</h2>
              <button type="button" aria-label={t("common.close")} onClick={() => setForm(null)}>
                <X size={18} />
              </button>
            </header>
            <label>
              {t("nav.discount_group_name")}
              <input value={draft.name} onChange={(event) => setForm({ ...draft, name: event.target.value })} required />
            </label>
            <label>
              {t("nav.discount_group_value")}
              <input
                inputMode="decimal"
                value={draft.value}
                onChange={(event) => setForm({ ...draft, value: moneyText(event.target.value) })}
                required
              />
            </label>
            <label>
              {t("nav.discount_group_type")}
              <select value={draft.type} onChange={(event) => setForm({ ...draft, type: event.target.value })}>
                <option value="percent">%</option>
                <option value="amount">{currency}</option>
              </select>
            </label>
            <footer>
              <button type="button" className="discount-groups-cancel" onClick={() => setForm(null)}>
                {t("common.cancel")}
              </button>
              <button type="submit" className="discount-groups-new">
                {t("common.save")}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomerDiscountGroups;
