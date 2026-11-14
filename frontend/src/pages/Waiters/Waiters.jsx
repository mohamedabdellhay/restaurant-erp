import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import api from "@services/api";
import staffService from "@services/staffService";
import { getErrorMessage } from "@utils/errorMessage";
import "./Waiters.css";

const EMPTY = { id: "", code: "", name: "", email: "", password: "" };

function waiterLabel(code) {
  const value = String(code ?? "").trim();
  if (!value) return "—";
  return /^\d+$/.test(value) ? `W${value}` : value;
}

function isWaiter(person) {
  const roleName = typeof person.role === "string" ? person.role : person.role?.name;
  return String(roleName || "").toLowerCase() === "waiter" && person.isActive !== false;
}

function sortWaiters(rows) {
  return [...rows].sort((left, right) => {
    const a = String(left.code ?? "").trim();
    const b = String(right.code ?? "").trim();
    const aNum = /^\d+$/.test(a);
    const bNum = /^\d+$/.test(b);
    if (aNum && bNum) return Number(a) - Number(b);
    if (aNum) return -1;
    if (bNum) return 1;
    if (!a && b) return 1;
    if (a && !b) return -1;
    return a.localeCompare(b) || String(left.name || "").localeCompare(String(right.name || ""));
  });
}

const Waiters = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_staff");
  const [waiters, setWaiters] = useState([]);
  const [roleId, setRoleId] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const draft = form || EMPTY;
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = async () => {
    try {
      const staffResult = await staffService.getAll();
      const people = staffResult?.data || [];
      const rows = people.filter(isWaiter);
      setWaiters(sortWaiters(rows));
      const embedded = rows.find((person) => person.role && typeof person.role === "object");
      if (embedded?.role?._id) setRoleId(embedded.role._id);
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, t("nav.waiter_fetch_failed")) });
    }
    try {
      const roleResult = await api.get("/roles");
      const roles = roleResult.data?.data || [];
      const role = roles.find((item) => String(item.name || "").toLowerCase() === "waiter");
      if (role?._id) setRoleId(role._id);
    } catch {
      // An existing waiter already carries the role id used for the next one.
    }
  };

  useEffect(() => {
    load();
  }, [t]);

  const openNew = () => setForm({ ...EMPTY });
  const openEdit = (waiter) => {
    setForm({
      id: waiter._id,
      code: String(waiter.code ?? ""),
      name: waiter.name || "",
      email: waiter.email || "",
      password: "",
    });
  };

  const save = async (event) => {
    event.preventDefault();
    const code = draft.code.trim();
    const name = draft.name.trim();
    const email = draft.email.trim();
    if (!code || name.length < 2 || !email) return;
    if ((!draft.id || draft.password) && draft.password.length < 8) {
      setMessage({ type: "error", text: t("nav.waiter_password_short") });
      return;
    }
    if (!roleId) {
      setMessage({ type: "error", text: t("nav.waiter_role_missing") });
      return;
    }
    const payload = { name, email, code, role: roleId };
    if (!draft.id || draft.password) payload.password = draft.password;
    try {
      if (draft.id) {
        await staffService.update(draft.id, payload);
        setMessage({ type: "success", text: t("nav.waiter_updated") });
      } else {
        await staffService.create(payload);
        setMessage({ type: "success", text: t("nav.waiter_created") });
      }
      setForm(null);
      load();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, t("nav.waiter_save_failed")) });
    }
  };

  const remove = async (waiter) => {
    if (!window.confirm(t("nav.waiter_delete_confirm"))) return;
    try {
      await staffService.delete(waiter._id);
      setMessage({ type: "success", text: t("nav.waiter_deleted") });
      load();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, t("nav.waiter_save_failed")) });
    }
  };

  const needle = query.trim().toLowerCase();
  const visible = waiters.filter((waiter) => {
    if (!needle) return true;
    return [waiterLabel(waiter.code), waiter.name, waiter.email]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div className="waiter-setup">
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.waiter_title")}</h1>
      <div className="waiter-setup-toolbar">
        <label>
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("menu.quick_search")}
            aria-label={t("menu.quick_search")}
          />
        </label>
        {canManage && (
          <button type="button" className="waiter-setup-new" onClick={openNew}>
            <Plus size={16} />
            {t("nav.waiter_new")}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.waiter_id")}</th>
              <th>{t("nav.waiter_name")}</th>
              <th>{t("menu.action")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={3}>{t("nav.waiter_empty")}</td>
              </tr>
            ) : (
              visible.map((waiter) => (
                <tr key={waiter._id}>
                  <td>{waiterLabel(waiter.code)}</td>
                  <td>{waiter.name}</td>
                  <td>
                    {canManage && (
                      <span className="waiter-setup-actions">
                        <button type="button" className="is-edit" onClick={() => openEdit(waiter)} aria-label={t("common.edit")}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" className="is-delete" onClick={() => remove(waiter)} aria-label={t("common.delete")}>
                          <Trash2 size={15} />
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {form && (
        <div className="waiter-setup-overlay" role="presentation" onClick={() => setForm(null)}>
          <form
            className="waiter-setup-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            onSubmit={save}
          >
            <header>
              <strong>{draft.id ? t("common.edit") : t("nav.waiter_new")}</strong>
              <button type="button" onClick={() => setForm(null)} aria-label={t("common.close")}>
                <X size={16} />
              </button>
            </header>
            <label>
              {t("nav.waiter_id")}
              <input value={draft.code} onChange={(event) => setForm({ ...draft, code: event.target.value })} required maxLength={20} />
            </label>
            <label>
              {t("nav.waiter_name")}
              <input value={draft.name} onChange={(event) => setForm({ ...draft, name: event.target.value })} required />
            </label>
            <label>
              {t("nav.waiter_email")}
              <input type="email" value={draft.email} onChange={(event) => setForm({ ...draft, email: event.target.value })} required />
            </label>
            <label>
              {t("nav.waiter_password")}
              <input
                type="password"
                value={draft.password}
                onChange={(event) => setForm({ ...draft, password: event.target.value })}
                required={!draft.id}
                autoComplete="new-password"
              />
              {draft.id && <small>{t("nav.waiter_password_keep")}</small>}
            </label>
            <div className="waiter-setup-dialog-actions">
              <button type="button" onClick={() => setForm(null)}>{t("common.cancel")}</button>
              <button type="submit">{t("common.save")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Waiters;
