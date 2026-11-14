import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import tableService from "@services/tableService";
import { getErrorMessage } from "@utils/errorMessage";
import "./Tables.css";

function tableLabel(number) {
  const value = String(number ?? "");
  return /^\d+$/.test(value) ? `T${value}` : value;
}

function sortTables(rows) {
  return [...rows].sort((left, right) => {
    const a = String(left.number ?? "");
    const b = String(right.number ?? "");
    if (/^\d+$/.test(a) && /^\d+$/.test(b)) return Number(a) - Number(b);
    return a.localeCompare(b);
  });
}

const Tables = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_tables");
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState(null);
  const draft = form || { id: "", number: "", seats: "", status: "available" };
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = () => {
    tableService
      .getAll()
      .then((result) => setTables(sortTables(result?.data || result || [])))
      .catch((error) => setMessage({ type: "error", text: getErrorMessage(error, t("table.tables_fetch_failed")) }));
  };

  useEffect(() => {
    load();
  }, [t]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const openNew = () => setForm({ id: "", number: "", seats: "", status: "available" });

  const openEdit = (table) => {
    setForm({
      id: table._id,
      number: String(table.number ?? ""),
      seats: String(table.seats ?? ""),
      status: table.status || "available",
    });
  };

  const save = async (event) => {
    event.preventDefault();
    const seats = Number(draft.seats);
    if (!draft.number.trim() || !Number.isInteger(seats) || seats < 1) return;
    const payload = { number: draft.number.trim(), seats, status: draft.status || "available" };
    try {
      if (draft.id) {
        await tableService.update(draft.id, payload);
        setMessage({ type: "success", text: t("table.tables_updated") });
      } else {
        await tableService.create(payload);
        setMessage({ type: "success", text: t("table.tables_created") });
      }
      setForm(null);
      load();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, t("table.tables_save_failed")) });
    }
  };

  const remove = async (table) => {
    if (!window.confirm(t("table.tables_delete_confirm"))) return;
    try {
      await tableService.delete(table._id);
      setMessage({ type: "success", text: t("table.tables_deleted") });
      load();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, t("table.tables_delete_failed")) });
    }
  };

  return (
    <div className="table-setup">
      <Alert type={message.type} message={message.text} />
      <div className="table-setup-head">
        <h1>{t("nav.table_title")}</h1>
        {canManage && (
          <button type="button" onClick={openNew}>
            <Plus size={16} />
            {t("nav.table_new")}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.table_no")}</th>
              <th>{t("nav.table_chairs")}</th>
              <th>{t("menu.action")}</th>
            </tr>
          </thead>
          <tbody>
            {tables.length === 0 ? (
              <tr>
                <td colSpan={3}>{t("nav.table_empty")}</td>
              </tr>
            ) : (
              tables.map((table) => (
                <tr key={table._id}>
                  <td>{tableLabel(table.number)}</td>
                  <td>{table.seats}</td>
                  <td>
                    {canManage && (
                      <span className="table-setup-actions">
                        <button type="button" className="is-edit" onClick={() => openEdit(table)} aria-label={t("common.edit")}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" className="is-delete" onClick={() => remove(table)} aria-label={t("common.delete")}>
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
        <div className="table-setup-overlay" role="presentation" onClick={() => setForm(null)}>
          <form
            className="table-setup-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            onSubmit={save}
          >
            <header>
              <strong>{draft.id ? t("common.edit") : t("nav.table_new")}</strong>
              <button type="button" onClick={() => setForm(null)} aria-label={t("common.close")}>
                <X size={16} />
              </button>
            </header>
            <label>
              {t("nav.table_no")}
              <input value={draft.number} onChange={(event) => setForm({ ...draft, number: event.target.value })} required />
            </label>
            <label>
              {t("nav.table_chairs")}
              <input
                inputMode="numeric"
                value={draft.seats}
                onChange={(event) => setForm({ ...draft, seats: event.target.value.replace(/\D/g, "") })}
                required
              />
            </label>
            <div className="table-setup-dialog-actions">
              <button type="button" onClick={() => setForm(null)}>{t("common.cancel")}</button>
              <button type="submit">{t("common.save")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Tables;
