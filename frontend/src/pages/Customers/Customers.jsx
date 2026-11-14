import { useEffect, useMemo, useRef, useState } from "react";
import { ListFilter, Pencil, Plus, Printer, Search, Trash2, Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import { useRestaurant } from "@hooks/useRestaurant";
import customerService from "@services/customerService";
import { assignmentKey, discountGroupName, readDiscountAssignments, readDiscountGroups } from "./discountGroups";
import "./Customers.css";

const EMPTY_FORM = { name: "", phone: "", address: "", group: "" };

function splitCsv(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function parseCustomers(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsv(lines[0]).map((cell) => cell.toLowerCase());
  const hasHeader = header.some((cell) => /name|phone|mobile|address|discount|group/.test(cell));
  const indexOf = (names, fallback) => {
    if (!hasHeader) return fallback;
    const found = header.findIndex((cell) => names.some((name) => cell.includes(name)));
    return found >= 0 ? found : fallback;
  };
  const nameIndex = indexOf(["name"], 0);
  const phoneIndex = indexOf(["mobile", "phone"], 1);
  const addressIndex = indexOf(["address"], 2);
  const groupIndex = indexOf(["discount", "group"], 3);
  return lines.slice(hasHeader ? 1 : 0).map((line) => {
    const cells = splitCsv(line);
    return {
      name: cells[nameIndex] || "",
      phone: cells[phoneIndex] || "",
      address: cells[addressIndex] || "",
      group: cells[groupIndex] || "",
    };
  }).filter((row) => row.name && row.phone);
}

const Customers = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { getRestaurantId } = useRestaurant();
  const restaurantId = getRestaurantId();
  const canManage = hasPermission("manage_customers");
  const fileRef = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [groups, setGroups] = useState({});
  const [catalog, setCatalog] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = async () => {
    try {
      setLoading(true);
      const result = await customerService.getAll();
      const rows = result?.data || result;
      setCustomers(Array.isArray(rows) ? rows : []);
      setGroups(readDiscountAssignments(restaurantId));
      setCatalog(readDiscountGroups(restaurantId));
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("common.error") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [restaurantId]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const groupNames = useMemo(
    () => [...new Set(customers.map((customer) => discountGroupName(catalog, groups[customer._id])).filter(Boolean))].sort(),
    [customers, groups, catalog],
  );

  const visible = customers.filter((customer) => {
    const group = discountGroupName(catalog, groups[customer._id]);
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || [customer.name, customer.phone, customer.address, group].join(" ").toLowerCase().includes(term);
    const matchesFilter = filter === "all" || group === filter;
    return matchesQuery && matchesFilter;
  });

  const writeGroups = (next) => {
    setGroups(next);
    localStorage.setItem(assignmentKey(restaurantId), JSON.stringify(next));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = (customer) => {
    setEditingId(customer._id);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      group: groups[customer._id] || "",
    });
  };

  const save = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };
    try {
      const result = editingId
        ? await customerService.update(editingId, payload)
        : await customerService.create(payload);
      const saved = result?.data || result;
      const id = saved?._id || editingId;
      if (id) {
        const next = { ...groups };
        const group = form.group.trim();
        if (group) next[id] = group;
        else delete next[id];
        writeGroups(next);
      }
      setMessage({ type: "success", text: t(editingId ? "nav.customer_updated" : "nav.customer_saved") });
      setForm(null);
      setEditingId(null);
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("common.error") });
    }
  };

  const remove = async (customer) => {
    if (!window.confirm(t("nav.customer_confirm_delete"))) return;
    try {
      await customerService.delete(customer._id);
      const next = { ...readDiscountAssignments(restaurantId) };
      delete next[customer._id];
      writeGroups(next);
      setMessage({ type: "success", text: t("nav.customer_deleted") });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("common.error") });
    }
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const rows = parseCustomers(await file.text());
    if (!rows.length) {
      setMessage({ type: "error", text: t("nav.customer_import_none") });
      return;
    }
    let imported = 0;
    const next = { ...readDiscountAssignments(restaurantId) };
    const known = readDiscountGroups(restaurantId);
    for (const row of rows) {
      try {
        const result = await customerService.create({
          name: row.name,
          phone: row.phone,
          address: row.address,
        });
        const saved = result?.data || result;
        const match = known.find((group) => group.name.toLowerCase() === row.group.toLowerCase());
        if (saved?._id && match) next[saved._id] = match.id;
        imported += 1;
      } catch {
        imported += 0;
      }
    }
    writeGroups(next);
    setMessage({
      type: imported ? "success" : "error",
      text: imported ? t("nav.customer_imported", { count: imported }) : t("nav.customer_import_none"),
    });
    await load();
  };

  return (
    <div className="customers-page">
      <Alert type={message.type} message={message.text} />
      <header className="customer-info-title">
        <h1>{t("nav.customer_information")}</h1>
        <button type="button" className="customer-print" onClick={() => window.print()}>
          <Printer size={15} />
          {t("nav.customer_print")}
        </button>
      </header>
      <div className="customer-toolbar">
        <label className="customer-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("inventory.quick_search")}
            aria-label={t("inventory.quick_search")}
          />
        </label>
        <label className="customer-menu">
          <ListFilter size={14} aria-hidden="true" />
          <span>{t("nav.requisition_filter")}</span>
          <select aria-label={t("nav.requisition_filter")} value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">{t("nav.customer_filter_all")}</option>
            {groupNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {canManage && (
          <div className="customer-toolbar-actions">
            <button type="button" className="customer-import" onClick={() => fileRef.current?.click()}>
              <Upload size={15} />
              {t("nav.customer_import")}
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={importFile} />
            <button type="button" className="customer-new" onClick={openCreate}>
              <Plus size={16} />
              {t("nav.customer_new")}
            </button>
          </div>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.customer_name")}</th>
              <th>{t("nav.customer_mobile")}</th>
              <th>{t("nav.customer_address")}</th>
              <th>{t("nav.customer_discount")}</th>
              <th>{t("inventory.action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>{t("common.loading")}</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={5}>{t("nav.customer_empty")}</td>
              </tr>
            ) : (
              visible.map((customer) => (
                <tr key={customer._id}>
                  <td>{customer.name}</td>
                  <td>{customer.phone || "—"}</td>
                  <td>{customer.address || "—"}</td>
                  <td>{discountGroupName(catalog, groups[customer._id]) || "—"}</td>
                  <td className="customer-actions">
                    {canManage && (
                      <>
                        <button type="button" className="customer-edit" aria-label={t("common.edit")} onClick={() => openEdit(customer)}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="customer-delete" aria-label={t("common.delete")} onClick={() => remove(customer)}>
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
        <div className="customer-overlay">
          <form className="customer-dialog" onSubmit={save}>
            <header>
              <h2>{editingId ? t("common.edit") : t("nav.customer_new")}</h2>
              <button type="button" aria-label={t("common.close")} onClick={() => setForm(null)}>
                <X size={18} />
              </button>
            </header>
            <label>
              {t("nav.customer_name")}
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              {t("nav.customer_mobile")}
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
            </label>
            <label>
              {t("nav.customer_address")}
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>
            <label>
              {t("nav.customer_discount")}
              <select value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })}>
                <option value="">{t("nav.sfg_select")}</option>
                {catalog.filter((group) => group.enabled || group.id === form.group).map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <footer>
              <button type="button" className="customer-cancel" onClick={() => setForm(null)}>
                {t("common.cancel")}
              </button>
              <button type="submit" className="customer-new">
                {t("common.save")}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
};

export default Customers;
