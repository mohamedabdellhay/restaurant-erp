import { useEffect, useMemo, useState } from "react";
import { Columns3, Eye, ListFilter, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import supplierService from "@services/supplierService";
import "./Suppliers.css";

const COLUMN_IDS = ["name", "mobile", "email", "address", "poc", "pocMobile", "vat", "file"];

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  poc: "",
  pocMobile: "",
  vat: "",
  file: "",
  paymentTerms: "cash",
};

function detailsOf(supplier) {
  const address = supplier?.address;
  const record = address && typeof address === "object" ? address : {};
  return {
    line: typeof address === "string" ? address : record.street || record.line || "",
    poc: supplier?.contactPerson || "",
    pocMobile: record.pocMobile || "",
    vat: record.vat || "",
    file: record.file || "",
  };
}

function formFrom(supplier) {
  const details = detailsOf(supplier);
  return {
    name: supplier?.name || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    address: details.line,
    poc: details.poc,
    pocMobile: details.pocMobile,
    vat: details.vat,
    file: details.file,
    paymentTerms: supplier?.paymentTerms || "cash",
  };
}

const Suppliers = () => {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_inventory");
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [columns, setColumns] = useState(() => Object.fromEntries(COLUMN_IDS.map((id) => [id, true])));
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getAll();
      const rows = response.data || response;
      setSuppliers(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("suppliers.error_loading_suppliers") });
    } finally {
      setLoading(false);
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

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      const details = detailsOf(supplier);
      const haystack = [supplier.name, supplier.phone, supplier.email, details.line, details.poc, details.pocMobile, details.vat]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !term || haystack.includes(term);
      const matchesFilter = filter === "all" || supplier.paymentTerms === filter;
      return matchesQuery && matchesFilter;
    });
  }, [suppliers, query, filter]);

  const openCreate = () => {
    setEditingId(null);
    setViewing(null);
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = (supplier) => {
    setViewing(null);
    setEditingId(supplier._id);
    setForm(formFrom(supplier));
  };

  const save = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      contactPerson: form.poc.trim() || null,
      paymentTerms: form.paymentTerms || "cash",
      address: {
        street: form.address.trim(),
        pocMobile: form.pocMobile.trim(),
        vat: form.vat.trim(),
        file: form.file.trim(),
      },
    };
    try {
      if (editingId) {
        await supplierService.update(editingId, payload);
        setMessage({ type: "success", text: t("nav.supplier_updated") });
      } else {
        await supplierService.create(payload);
        setMessage({ type: "success", text: t("nav.supplier_saved") });
      }
      setForm(null);
      setEditingId(null);
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("suppliers.error_creating_supplier") });
    }
  };

  const remove = async (supplier) => {
    if (!window.confirm(t("nav.supplier_confirm_delete"))) return;
    try {
      await supplierService.delete(supplier._id);
      setMessage({ type: "success", text: t("nav.supplier_deleted") });
      if (viewing?._id === supplier._id) setViewing(null);
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("suppliers.error_deleting_supplier") });
    }
  };

  const columnLabel = {
    name: t("nav.supplier_name"),
    mobile: t("nav.supplier_mobile"),
    email: t("nav.supplier_email"),
    address: t("nav.supplier_address"),
    poc: t("nav.supplier_poc"),
    pocMobile: t("nav.supplier_poc_mobile"),
    vat: t("nav.supplier_vat"),
    file: t("nav.supplier_file"),
  };

  const cell = (supplier, id) => {
    const details = detailsOf(supplier);
    if (id === "name") return supplier.name;
    if (id === "mobile") return supplier.phone || "—";
    if (id === "email") return supplier.email || "—";
    if (id === "address") return details.line || "—";
    if (id === "poc") return details.poc || "—";
    if (id === "pocMobile") return details.pocMobile || "—";
    if (id === "vat") return details.vat || "—";
    return (
      <button type="button" className="supplier-view" onClick={() => setViewing(supplier)}>
        <Eye size={14} />
        {t("common.view")}
      </button>
    );
  };

  return (
    <div className="supplier-info" data-direction={i18n.dir()}>
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.supplier_information")}</h1>
      <div className="supplier-toolbar">
        <label className="supplier-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("inventory.quick_search")}
            aria-label={t("inventory.quick_search")}
          />
        </label>
        <label className="supplier-menu">
          <ListFilter size={14} aria-hidden="true" />
          <span>{t("nav.requisition_filter")}</span>
          <select aria-label={t("nav.requisition_filter")} value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">{t("suppliers.filter_all")}</option>
            <option value="cash">{t("suppliers.payment_cash")}</option>
            <option value="credit">{t("suppliers.payment_credit")}</option>
            <option value="installment">{t("suppliers.payment_installment")}</option>
          </select>
        </label>
        <div className="supplier-columns">
          <button type="button" className="supplier-menu" onClick={() => setColumnsOpen((open) => !open)}>
            <Columns3 size={14} aria-hidden="true" />
            {t("nav.supplier_columns")}
          </button>
          {columnsOpen && (
            <div className="supplier-column-menu" role="group" aria-label={t("nav.supplier_columns")}>
              {COLUMN_IDS.map((id) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={columns[id]}
                    onChange={() => setColumns((current) => ({ ...current, [id]: !current[id] }))}
                  />
                  {columnLabel[id]}
                </label>
              ))}
            </div>
          )}
        </div>
        {canManage && (
          <button type="button" className="supplier-new" onClick={openCreate}>
            <Plus size={16} />
            {t("nav.supplier_new")}
          </button>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {COLUMN_IDS.filter((id) => columns[id]).map((id) => (
                <th key={id}>{columnLabel[id]}</th>
              ))}
              <th>{t("inventory.action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COLUMN_IDS.filter((id) => columns[id]).length + 1}>{t("common.loading")}</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_IDS.filter((id) => columns[id]).length + 1}>{t("nav.supplier_empty")}</td>
              </tr>
            ) : (
              visible.map((supplier) => (
                <tr key={supplier._id}>
                  {COLUMN_IDS.filter((id) => columns[id]).map((id) => (
                    <td key={id}>{cell(supplier, id)}</td>
                  ))}
                  <td className="supplier-actions">
                    {canManage && (
                      <>
                        <button type="button" className="supplier-edit" aria-label={t("common.edit")} onClick={() => openEdit(supplier)}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="supplier-delete" aria-label={t("common.delete")} onClick={() => remove(supplier)}>
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
        <div className="supplier-overlay">
          <form className="supplier-dialog" onSubmit={save}>
            <header>
              <h2>{editingId ? t("suppliers.edit_supplier") : t("nav.supplier_new")}</h2>
              <button type="button" aria-label={t("common.close")} onClick={() => setForm(null)}>
                <X size={18} />
              </button>
            </header>
            <label>
              {t("nav.supplier_name")}
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              {t("nav.supplier_mobile")}
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
            </label>
            <label>
              {t("nav.supplier_email")}
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              {t("nav.supplier_address")}
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>
            <label>
              {t("nav.supplier_poc")}
              <input value={form.poc} onChange={(event) => setForm({ ...form, poc: event.target.value })} />
            </label>
            <label>
              {t("nav.supplier_poc_mobile")}
              <input value={form.pocMobile} onChange={(event) => setForm({ ...form, pocMobile: event.target.value })} />
            </label>
            <label>
              {t("nav.supplier_vat")}
              <input value={form.vat} onChange={(event) => setForm({ ...form, vat: event.target.value })} />
            </label>
            <label>
              {t("nav.supplier_file")}
              <input value={form.file} onChange={(event) => setForm({ ...form, file: event.target.value })} placeholder="https://" />
            </label>
            <label>
              {t("suppliers.payment_terms")}
              <select value={form.paymentTerms} onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })}>
                <option value="cash">{t("suppliers.payment_cash")}</option>
                <option value="credit">{t("suppliers.payment_credit")}</option>
                <option value="installment">{t("suppliers.payment_installment")}</option>
              </select>
            </label>
            <footer>
              <button type="button" className="supplier-cancel" onClick={() => setForm(null)}>
                {t("common.cancel")}
              </button>
              <button type="submit" className="supplier-new">
                {editingId ? t("common.update") : t("common.save")}
              </button>
            </footer>
          </form>
        </div>
      )}

      {viewing && (
        <div className="supplier-overlay">
          <section className="supplier-dialog">
            <header>
              <h2>{viewing.name}</h2>
              <button type="button" aria-label={t("common.close")} onClick={() => setViewing(null)}>
                <X size={18} />
              </button>
            </header>
            {[
              ["nav.supplier_mobile", viewing.phone],
              ["nav.supplier_email", viewing.email],
              ["nav.supplier_address", detailsOf(viewing).line],
              ["nav.supplier_poc", detailsOf(viewing).poc],
              ["nav.supplier_poc_mobile", detailsOf(viewing).pocMobile],
              ["nav.supplier_vat", detailsOf(viewing).vat],
            ].map(([key, value]) => (
              <p key={key}>
                <span>{t(key)}</span>
                <strong>{value || "—"}</strong>
              </p>
            ))}
            <p>
              <span>{t("nav.supplier_file")}</span>
              {detailsOf(viewing).file ? (
                <a href={detailsOf(viewing).file} target="_blank" rel="noreferrer">
                  {t("common.view")}
                </a>
              ) : (
                <strong>{t("nav.supplier_no_file")}</strong>
              )}
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
