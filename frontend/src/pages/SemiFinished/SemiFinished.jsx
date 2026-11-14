import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import { useRestaurant } from "@hooks/useRestaurant";
import ingredientCategoryService from "@services/ingredientCategoryService";
import inventoryService from "@services/inventoryService";
import { formatMoney } from "../../utils/money";
import "./SemiFinished.css";

const blankLine = () => ({ key: crypto.randomUUID(), itemId: "", qty: "0.00" });

const EMPTY = {
  id: "",
  name: "",
  categoryId: "",
  unit: "",
  stock: 0,
  addOnsOn: false,
  lines: [blankLine()],
};

function storageKey(restaurantId) {
  return `semiFinished:${restaurantId || "restaurant"}`;
}

function readRows(restaurantId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(restaurantId)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const SemiFinished = () => {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const { getRestaurantId, getCurrency } = useRestaurant();
  const restaurantId = getRestaurantId();
  const currency = getCurrency();
  const canManage = hasPermission("manage_inventory");
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setRows(readRows(restaurantId));
    ingredientCategoryService
      .getAll()
      .then((result) => setCategories(result?.success ? result.data || [] : []))
      .catch(() => setCategories([]));
    inventoryService
      .getAll()
      .then((result) => setSupplies(result?.data || []))
      .catch(() => setSupplies([]));
  }, [restaurantId]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const saveRows = (next) => {
    setRows(next);
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(next));
  };

  const categoryName = (id) => categories.find((category) => category._id === id)?.name || "";
  const supplyOf = (id) => supplies.find((item) => item._id === id);

  const visible = rows.filter((row) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [row.name, categoryName(row.categoryId), row.unit].join(" ").toLowerCase().includes(term);
  });

  const openCreate = () => setForm({ ...EMPTY, lines: [blankLine()] });

  const openEdit = (row) =>
    setForm({
      ...EMPTY,
      id: row.id,
      name: row.name || "",
      categoryId: row.categoryId || "",
      categoryName: row.categoryName || "",
      unit: row.unit || "",
      stock: row.stock || 0,
      addOnsOn: Boolean(row.addOnsOn),
      lines: (row.lines || []).length
        ? row.lines.map((line) => ({
            key: crypto.randomUUID(),
            itemId: line.itemId,
            name: line.name || "",
            unit: line.unit || "",
            cost: line.cost,
            qty: Number(line.qty || 0).toFixed(2),
          }))
        : [blankLine()],
    });

  const draft = form || EMPTY;
  const lines = draft.lines || [];
  const units = [...new Set([...supplies.map((item) => item.unit), draft.unit].filter(Boolean))];
  const itemChoices = [...supplies];
  lines.forEach((line) => {
    if (line.itemId && !itemChoices.some((item) => item._id === line.itemId)) {
      itemChoices.push({ _id: line.itemId, name: line.name || line.itemId, unit: line.unit, costPrice: line.cost });
    }
  });

  const updateLine = (key, patch) => {
    setForm({
      ...draft,
      lines: lines.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    });
  };

  const lineFigures = (line) => {
    const supply = supplyOf(line.itemId) || itemChoices.find((item) => item._id === line.itemId);
    const qty = Number(line.qty) || 0;
    const cost = Number(supply?.costPrice ?? line.cost) || 0;
    const unit = supply?.unit || line.unit || "";
    return { supply, qty, cost, unit, total: qty * cost };
  };

  const sfgCost = lines.reduce((sum, line) => sum + lineFigures(line).total, 0);

  const save = (event) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name || !draft.categoryId || !draft.unit) return;
    const recipe = lines
      .map((line) => {
        const figures = lineFigures(line);
        if (!figures.supply) return null;
        return {
          itemId: figures.supply._id,
          name: figures.supply.name,
          unit: figures.supply.unit || "",
          qty: figures.qty,
          cost: figures.cost,
        };
      })
      .filter(Boolean);
    const record = {
      id: draft.id || crypto.randomUUID(),
      name,
      categoryId: draft.categoryId,
      categoryName: categoryName(draft.categoryId) || draft.categoryName || "",
      unit: draft.unit,
      stock: Number(draft.stock) || 0,
      avgCost: sfgCost,
      addOnsOn: Boolean(draft.addOnsOn),
      lines: recipe,
    };
    const next = draft.id ? rows.map((row) => (row.id === draft.id ? record : row)) : [record, ...rows];
    saveRows(next);
    setMessage({ type: "success", text: t(draft.id ? "nav.sfg_updated" : "nav.sfg_created") });
    setForm(null);
  };

  const remove = (id) => {
    if (!window.confirm(t("nav.sfg_confirm_delete"))) return;
    saveRows(rows.filter((row) => row.id !== id));
    setMessage({ type: "success", text: t("nav.sfg_deleted") });
  };

  if (form) {
    return (
      <div className="sfg-page" data-direction={i18n.dir()}>
        <Alert type={message.type} message={message.text} />
        <h1>{draft.id ? t("nav.sfg_edit") : t("nav.sfg_add")}</h1>
        <form className="sfg-form" onSubmit={save}>
          <div className="sfg-fields">
            <label>
              {t("nav.sfg_name")}{draft.id ? "" : " *"}
              <input value={draft.name} onChange={(event) => setForm({ ...draft, name: event.target.value })} required />
            </label>
            <label>
              {t("inventory.category")}{draft.id ? "" : " *"}
              <select value={draft.categoryId} onChange={(event) => setForm({ ...draft, categoryId: event.target.value })} required>
                <option value="">{t("nav.sfg_select")}</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
                {draft.categoryId && !categories.some((category) => category._id === draft.categoryId) && (
                  <option value={draft.categoryId}>{draft.categoryName || draft.categoryId}</option>
                )}
              </select>
            </label>
            <label>
              {t("inventory.unit")}{draft.id ? "" : " *"}
              <select value={draft.unit} onChange={(event) => setForm({ ...draft, unit: event.target.value })} required>
                <option value="">{t("nav.sfg_select")}</option>
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
            <label className="sfg-switch">
              {t("inventory.add_ons")}
              <input
                type="checkbox"
                role="switch"
                checked={Boolean(draft.addOnsOn)}
                onChange={(event) => setForm({ ...draft, addOnsOn: event.target.checked })}
              />
            </label>
          </div>

          <section className="sfg-recipe">
            <h2>{t("nav.sfg_recipe")}</h2>
            <div className="sfg-recipe-head">
              <span>{t("nav.sfg_sl")}</span>
              <span>{t("nav.sfg_item")}</span>
              <span>{t("inventory.unit")}</span>
              <span>{t("nav.sfg_qty_used")}</span>
              <span>{t("nav.sfg_avg_unit_cost")}</span>
              <span>{t("nav.sfg_total_amount")}</span>
              <span />
            </div>
            {lines.map((line, index) => {
              const figures = lineFigures(line);
              return (
                <div className="sfg-recipe-line" key={line.key}>
                  <span>{index + 1}</span>
                  <select
                    aria-label={t("nav.sfg_item")}
                    value={line.itemId}
                    onChange={(event) => updateLine(line.key, { itemId: event.target.value })}
                  >
                    <option value="">{t("nav.sfg_item_select")}</option>
                    {itemChoices.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <input aria-label={t("inventory.unit")} value={figures.unit} disabled />
                  <input
                    aria-label={t("nav.sfg_qty_used")}
                    inputMode="decimal"
                    value={line.qty}
                    onChange={(event) => updateLine(line.key, { qty: event.target.value.replace(/[^\d.]/g, "") })}
                  />
                  <input aria-label={t("nav.sfg_avg_unit_cost")} value={line.itemId ? formatMoney(figures.cost, currency) : "0.00"} disabled />
                  <input aria-label={t("nav.sfg_total_amount")} value={line.itemId ? formatMoney(figures.total, currency) : "0.00"} disabled />
                  {index === lines.length - 1 && (
                    <button
                      type="button"
                      className="sfg-plus"
                      aria-label={t("nav.sfg_add_line")}
                      onClick={() => setForm({ ...draft, lines: [...lines, blankLine()] })}
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              );
            })}
            <div className="sfg-cost">
              <span>{t("nav.sfg_cost")}</span>
              <input value={formatMoney(sfgCost, currency)} disabled />
            </div>
          </section>

          <div className="sfg-form-actions">
            <button type="button" className="sfg-cancel" onClick={() => setForm(null)}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="sfg-new">
              {t("nav.purchase_submit")}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="sfg-page" data-direction={i18n.dir()}>
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.sfg_title")}</h1>
      <div className="sfg-toolbar">
        <label className="sfg-search">
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
          <button type="button" className="sfg-new" onClick={openCreate}>
            <Plus size={16} />
            {t("nav.sfg_new")}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.sfg_name")}</th>
              <th>{t("inventory.category")}</th>
              <th>{t("inventory.unit")}</th>
              <th>{t("nav.sfg_stock")}</th>
              <th>{t("nav.sfg_avg_cost")}</th>
              <th>{t("inventory.value")}</th>
              <th className="sfg-action">{t("inventory.action")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="sfg-empty">
                  {t("nav.sfg_empty")}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="sfg-name">
                      <span>{row.name}</span>
                      {row.addOnsOn && <span className="sfg-addons">{t("inventory.add_ons")}</span>}
                    </span>
                  </td>
                  <td>{categoryName(row.categoryId) || row.categoryName || "—"}</td>
                  <td>{row.unit || "—"}</td>
                  <td>{row.stock}</td>
                  <td>{formatMoney(row.avgCost, currency)}</td>
                  <td>{formatMoney((Number(row.stock) || 0) * (Number(row.avgCost) || 0), currency)}</td>
                  <td className="sfg-action">
                    {canManage && (
                      <>
                        <button type="button" className="sfg-edit" onClick={() => openEdit(row)} aria-label={t("common.edit")}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" className="sfg-delete" onClick={() => remove(row.id)} aria-label={t("common.delete")}>
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
    </div>
  );
};

export default SemiFinished;
