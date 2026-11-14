import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useRestaurant } from "@hooks/useRestaurant";
import categoryService from "@services/categoryService";
import inventoryService from "@services/inventoryService";
import menuService from "@services/menuService";
import uploadService from "@services/uploadService";
import "./FoodItemForm.css";

const STATIONS = [
  { id: "dining", label: "nav.food_item_station_dining" },
  { id: "juice", label: "nav.food_item_station_juice" },
  { id: "kitchen", label: "nav.food_item_station_kitchen" },
];

function metaKey(restaurantId) {
  return `menuItemMeta:${restaurantId || "restaurant"}`;
}

function readMeta(restaurantId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(metaKey(restaurantId)) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function decimalText(value) {
  return String(value).replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

function plain(value) {
  return (Number(value) || 0).toFixed(2);
}

function blankLine() {
  return { key: crypto.randomUUID(), itemId: "", qty: "", byVariant: {} };
}

function emptyForm() {
  return {
    code: "",
    categoryId: "",
    name: "",
    prep: "",
    station: "",
    image: "",
    imageName: "",
    price: "",
    lines: [blankLine()],
    useVariant: false,
    variants: [],
    otherMode: "percent",
    otherValue: "",
    variantOther: {},
    marginMode: "percent",
    addSd: false,
    addOns: [],
    options: [],
  };
}

function otherAmount(food, mode, value) {
  const amount = Number(value) || 0;
  return mode === "amount" ? amount : (food * amount) / 100;
}

const FoodItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getRestaurantId, getCurrency } = useRestaurant();
  const restaurantId = getRestaurantId();
  const currency = getCurrency();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [ready, setReady] = useState(!id);
  const [message, setMessage] = useState({ type: "", text: "" });
  const draft = form;
  const lines = draft.lines || [];
  const variants = draft.variants || [];

  useEffect(() => {
    categoryService.getAll().then((result) => setCategories(result?.data || [])).catch(() => setCategories([]));
    inventoryService.getAll().then((result) => setSupplies(result?.data || [])).catch(() => setSupplies([]));
  }, []);

  useEffect(() => {
    if (!id) return undefined;
    let live = true;
    menuService.getById(id).then((result) => {
      if (!live) return;
      const item = result?.data;
      if (!item) return;
      const note = readMeta(restaurantId)[item._id] || {};
      const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
      const storedLines = Array.isArray(note.lines) && note.lines.length ? note.lines : null;
      const recipeLines = (item.recipe || []).map((entry) => ({
        key: entry._id || crypto.randomUUID(),
        itemId: entry.inventoryItem?._id || entry.inventoryItem || "",
        qty: String(entry.qty ?? ""),
        byVariant: {},
      }));
      setForm({
        ...emptyForm(),
        code: note.code || "",
        categoryId: item.category?._id || (typeof item.category === "string" ? item.category : ""),
        name: item.name || "",
        prep: note.prep || "",
        station: note.station || "",
        image: item.image || "",
        imageName: item.image ? item.image.split("/").pop() : "",
        price: item.price == null ? "" : String(item.price),
        lines: storedLines || (recipeLines.length ? recipeLines : [blankLine()]),
        useVariant: Boolean(note.useVariant),
        variants: Array.isArray(note.variants) ? note.variants : [],
        otherMode: note.otherMode === "amount" ? "amount" : "percent",
        otherValue: note.otherValue || "",
        variantOther: note.variantOther || {},
        marginMode: note.marginMode === "amount" ? "amount" : "percent",
        addSd: Boolean(note.addSd),
        addOns: modifiers.filter((entry) => entry.kind !== "option").map((entry) => ({ id: crypto.randomUUID(), name: entry.name || "", price: String(entry.price ?? "") })),
        options: modifiers.filter((entry) => entry.kind === "option").map((entry) => ({ id: crypto.randomUUID(), name: entry.name || "", price: String(entry.price ?? "") })),
      });
      setReady(true);
    }).catch((error) => {
      if (live) setMessage({ type: "error", text: error.response?.data?.message || t("common.error") });
    });
    return () => {
      live = false;
    };
  }, [id, restaurantId]);

  const costOf = (itemId) => Number(supplies.find((entry) => entry._id === itemId)?.costPrice) || 0;

  const qtyFor = (line, variantId) => (variantId ? line.byVariant?.[variantId] : line.qty) || "";

  const foodCost = (variantId) => lines.reduce((sum, line) => sum + (Number(qtyFor(line, variantId)) || 0) * costOf(line.itemId), 0);

  const totalFor = (variantId) => {
    const food = foodCost(variantId);
    if (variantId) {
      const other = draft.variantOther?.[variantId] || { mode: "percent", value: "" };
      return food + otherAmount(food, other.mode === "amount" ? "amount" : "percent", other.value);
    }
    return food + otherAmount(food, draft.otherMode, draft.otherValue);
  };

  const activeTotal = draft.useVariant ? totalFor(variants[0]?.id) : totalFor(null);
  const price = Number(draft.price) || 0;
  const margin = draft.marginMode === "amount" ? price - activeTotal : (activeTotal ? ((price - activeTotal) / activeTotal) * 100 : 0);

  const setPriceFromMargin = (raw) => {
    const next = Number(decimalText(raw));
    if (!Number.isFinite(next)) return;
    const computed = draft.marginMode === "amount" ? activeTotal + next : activeTotal * (1 + next / 100);
    setForm((current) => ({ ...current, price: plain(computed) }));
  };

  const upload = async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      setMessage({ type: "error", text: t("menu.invalid_image_type") });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: t("nav.food_item_picture_too_large") });
      return;
    }
    try {
      const response = await uploadService.uploadImage(file);
      if (response.success && response.data?.url) {
        setForm((current) => ({ ...current, image: response.data.url, imageName: file.name }));
      }
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("menu.image_upload_failed") });
    }
  };

  const patchLine = (key, patch) => {
    setForm((current) => ({
      ...current,
      lines: (current.lines || []).map((line) => (line.key === key ? { ...line, ...patch } : line)),
    }));
  };

  const addLine = () => setForm((current) => ({ ...current, lines: [...(current.lines || []), blankLine()] }));

  const removeLine = (key) => {
    setForm((current) => {
      const next = (current.lines || []).filter((line) => line.key !== key);
      return { ...current, lines: next.length ? next : [blankLine()] };
    });
  };

  const enableVariants = (on) => {
    setForm((current) => {
      if (!on) {
        const first = current.variants?.[0]?.id;
        return {
          ...current,
          useVariant: false,
          lines: (current.lines || []).map((line) => ({ ...line, qty: line.byVariant?.[first] || line.qty })),
        };
      }
      const nextVariants = current.variants?.length ? current.variants : [{ id: crypto.randomUUID(), name: "" }];
      const first = nextVariants[0].id;
      return {
        ...current,
        useVariant: true,
        variants: nextVariants,
        lines: (current.lines || []).map((line) => ({
          ...line,
          byVariant: { ...line.byVariant, [first]: line.byVariant?.[first] || line.qty || "" },
        })),
      };
    });
  };

  const addVariant = () => {
    setForm((current) => ({ ...current, variants: [...(current.variants || []), { id: crypto.randomUUID(), name: "" }] }));
  };

  const removeVariant = (variantId) => {
    setForm((current) => ({ ...current, variants: (current.variants || []).filter((entry) => entry.id !== variantId) }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!ready) return;
    const name = draft.name.trim();
    const nextPrice = Number(draft.price);
    if (!name || !draft.categoryId || !Number.isFinite(nextPrice) || nextPrice < 0) return;
    const firstVariant = variants[0]?.id;
    const recipe = lines
      .map((line) => ({
        inventoryItem: line.itemId,
        qty: Number(draft.useVariant ? line.byVariant?.[firstVariant] : line.qty) || 0,
      }))
      .filter((line) => line.inventoryItem && line.qty > 0);
    const modifiers = [
      ...draft.addOns.map((entry) => ({ name: entry.name.trim(), price: Number(entry.price) || 0, kind: "addon" })),
      ...draft.options.map((entry) => ({ name: entry.name.trim(), price: Number(entry.price) || 0, kind: "option" })),
    ].filter((entry) => entry.name);
    const payload = { name, category: draft.categoryId, price: nextPrice, isActive: true, recipe, modifiers };
    if (draft.image) payload.image = draft.image;
    try {
      const result = id ? await menuService.update(id, payload) : await menuService.create(payload);
      const savedId = result?.data?._id || id;
      if (savedId) {
        const all = readMeta(restaurantId);
        const firstOther = draft.variantOther?.[firstVariant] || {};
        all[savedId] = {
          code: draft.code.trim(),
          station: draft.station,
          prep: draft.prep.trim(),
          useVariant: draft.useVariant,
          variants: draft.useVariant ? variants : [],
          lines: draft.useVariant ? lines : [],
          otherMode: draft.useVariant ? (firstOther.mode === "amount" ? "amount" : "percent") : draft.otherMode,
          otherValue: draft.useVariant ? firstOther.value || "" : draft.otherValue,
          variantOther: draft.variantOther || {},
          marginMode: draft.marginMode,
          addSd: draft.addSd,
        };
        localStorage.setItem(metaKey(restaurantId), JSON.stringify(all));
      }
      navigate("/food-items");
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("common.error") });
    }
  };

  const costCard = (variantId, title) => {
    const food = foodCost(variantId);
    const other = variantId ? draft.variantOther?.[variantId] || { mode: "percent", value: "" } : { mode: draft.otherMode, value: draft.otherValue };
    const mode = other.mode === "amount" ? "amount" : "percent";
    const total = food + otherAmount(food, mode, other.value);
    const setOther = (patch) => {
      if (variantId) {
        setForm((current) => ({
          ...current,
          variantOther: { ...current.variantOther, [variantId]: { ...other, ...patch } },
        }));
      } else {
        setForm((current) => ({ ...current, ...(patch.mode ? { otherMode: patch.mode } : {}), ...(patch.value != null ? { otherValue: patch.value } : {}) }));
      }
    };
    return (
      <section className="food-item-cost" key={variantId || "single"}>
        {title && <h3>{title}</h3>}
        <div><span>{t("nav.food_item_food_cost")}</span><strong>{plain(food)}</strong></div>
        <div>
          <span>{t("nav.food_item_other_cost")}</span>
          <span className="food-item-cost-edit">
            <ModeSwitch mode={mode} currency={currency} onChange={(next) => setOther({ mode: next })} />
            <input value={other.value || ""} inputMode="decimal" onChange={(event) => setOther({ value: decimalText(event.target.value) })} />
          </span>
        </div>
        <div>
          <span>{t("nav.food_item_total_cost")}</span>
          <input value={plain(total)} readOnly />
        </div>
      </section>
    );
  };

  return (
    <form className="food-item-form" onSubmit={save}>
      <Alert type={message.type} message={message.text} />
      <h1>{t(id ? "nav.food_item_edit_title" : "nav.food_item_add")}</h1>
      <div className="food-item-grid">
        <label>
          <span>{t("nav.food_item_food_code")}</span>
          <input value={draft.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
        </label>
        <label>
          <span>{t("nav.food_category")}{id ? "" : "*"}</span>
          <select value={draft.categoryId} required onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}>
            <option value="">{t("nav.sfg_select")}</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("nav.food_item_food_name")}</span>
          <input value={draft.name} required onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        </label>
        <label>
          <span>{t("nav.food_item_prep")}</span>
          <input value={draft.prep} inputMode="numeric" onChange={(event) => setForm((current) => ({ ...current, prep: event.target.value.replace(/\D/g, "") }))} />
        </label>
        <label>
          <span>{t("nav.food_item_station")}</span>
          <select value={draft.station} onChange={(event) => setForm((current) => ({ ...current, station: event.target.value }))}>
            <option value="">{t("nav.sfg_select")}</option>
            {STATIONS.map((station) => (
              <option key={station.id} value={station.id}>{t(station.label)}</option>
            ))}
          </select>
        </label>
        <label className="food-item-picture">
          <span>{t("nav.food_item_picture")}</span>
          <span className="food-item-file">
            <Upload size={14} />
            {draft.imageName || t("nav.food_item_choose_file")}
            <input type="file" accept="image/jpeg,image/png,image/gif" onChange={(event) => upload(event.target.files?.[0])} />
          </span>
          <small>{t("nav.food_item_picture_note")}</small>
        </label>
      </div>

      <section className="food-item-recipe">
        <header>
          <h2>{t("menu.recipe")}</h2>
          <label className="food-item-variant-toggle">
            {t("nav.food_item_use_variant")}
            <button type="button" className={draft.useVariant ? "is-on" : ""} aria-pressed={draft.useVariant} onClick={() => enableVariants(!draft.useVariant)} />
          </label>
        </header>
        {draft.useVariant && (
          <div className="food-item-variants">
            {variants.map((variant, index) => (
              <div key={variant.id}>
                <span>{index + 1}.</span>
                <input value={variant.name} onChange={(event) => setForm((current) => ({ ...current, variants: current.variants.map((entry) => entry.id === variant.id ? { ...entry, name: event.target.value } : entry) }))} />
                {index === variants.length - 1 ? (
                  <button type="button" className="food-item-plus" aria-label={t("common.add")} onClick={addVariant}><Plus size={16} /></button>
                ) : (
                  <button type="button" className="food-item-x" aria-label={t("common.delete")} onClick={() => removeVariant(variant.id)}><X size={16} /></button>
                )}
              </div>
            ))}
            <div className="food-item-actions">
              <button type="submit" className="food-item-save">{t("common.save")}</button>
              <button type="button" className="food-item-cancel" onClick={() => navigate("/food-items")}>{t("common.cancel")}</button>
            </div>
          </div>
        )}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t("nav.food_item_sl")}</th>
                <th>{t("nav.food_item_ingredients")}</th>
                {draft.useVariant && <th>{t("nav.food_item_variant")}</th>}
                <th>{t("nav.food_item_qty_used")}</th>
                <th>{t("nav.food_item_avg_cost")}</th>
                <th>{t("nav.food_item_total_amount")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const groups = draft.useVariant && variants.length ? variants : [null];
                const unit = costOf(line.itemId);
                return groups.map((variant, groupIndex) => {
                  const qty = qtyFor(line, variant?.id);
                  return (
                    <tr key={`${line.key}-${variant?.id || "one"}`}>
                      {groupIndex === 0 && <td rowSpan={groups.length}>{index + 1}</td>}
                      {groupIndex === 0 && (
                        <td rowSpan={groups.length}>
                          <select value={line.itemId} onChange={(event) => patchLine(line.key, { itemId: event.target.value })}>
                            <option value="">{t("nav.sfg_select")}</option>
                            {supplies.map((supply) => (
                              <option key={supply._id} value={supply._id}>{supply.name}{supply.unit ? ` (${supply.unit})` : ""}</option>
                            ))}
                          </select>
                        </td>
                      )}
                      {variant && <td>{variant.name || "—"}</td>}
                      <td>
                        <input
                          value={qty}
                          inputMode="decimal"
                          placeholder="0.00"
                          onChange={(event) => {
                            const next = decimalText(event.target.value);
                            if (variant) patchLine(line.key, { byVariant: { ...line.byVariant, [variant.id]: next } });
                            else patchLine(line.key, { qty: next });
                          }}
                        />
                      </td>
                      <td><input value={plain(unit)} readOnly /></td>
                      <td>{plain((Number(qty) || 0) * unit)}</td>
                      {groupIndex === 0 && (
                        <td rowSpan={groups.length}>
                          {index === lines.length - 1 ? (
                            <button type="button" className="food-item-plus" aria-label={t("common.add")} onClick={addLine}><Plus size={16} /></button>
                          ) : (
                            <button type="button" className="food-item-x" aria-label={t("common.delete")} onClick={() => removeLine(line.key)}><X size={16} /></button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
        <div className={draft.useVariant ? "food-item-cost-grid" : ""}>
          {draft.useVariant
            ? variants.map((variant, index) => costCard(variant.id, `${t("nav.food_item_variant")} ${String(index + 1).padStart(2, "0")} : ${variant.name || "—"}`))
            : costCard(null)}
        </div>
      </section>

      <section className="food-item-price">
        <label>
          <span>{t("nav.food_item_menu_price")}</span>
          <input value={draft.price} inputMode="decimal" onChange={(event) => setForm((current) => ({ ...current, price: decimalText(event.target.value) }))} />
        </label>
        <label>
          <span>{t("nav.food_item_margin")}</span>
          <span className="food-item-cost-edit">
            <ModeSwitch mode={draft.marginMode} currency={currency} onChange={(next) => setForm((current) => ({ ...current, marginMode: next }))} />
            <input value={plain(margin)} inputMode="decimal" onChange={(event) => setPriceFromMargin(event.target.value)} />
          </span>
        </label>
      </section>

      <label className="food-item-sd">
        <input type="checkbox" checked={draft.addSd} onChange={(event) => setForm((current) => ({ ...current, addSd: event.target.checked }))} />
        {t("nav.food_item_add_sd")}
      </label>

      <section className="food-item-modifiers">
        <h2>{t("nav.food_item_modifiers")}</h2>
        <p>{t("nav.food_item_modifiers_hint")}</p>
        <div className="food-item-actions">
          <button type="button" className="food-item-save" onClick={() => setForm((current) => ({ ...current, addOns: [...current.addOns, { id: crypto.randomUUID(), name: "", price: "" }] }))}>
            {t("nav.food_item_add_ons")}
          </button>
          <button type="button" className="food-item-cancel" onClick={() => setForm((current) => ({ ...current, options: [...current.options, { id: crypto.randomUUID(), name: "", price: "" }] }))}>
            {t("nav.food_item_add_options")}
          </button>
        </div>
        <div className="food-item-modifier-box">
          {[...draft.addOns.map((entry) => ({ ...entry, kind: "addOns" })), ...draft.options.map((entry) => ({ ...entry, kind: "options" }))].map((entry) => (
            <div key={entry.id}>
              <input value={entry.name} placeholder={t("menu.modifier_name")} onChange={(event) => setForm((current) => ({ ...current, [entry.kind]: current[entry.kind].map((row) => row.id === entry.id ? { ...row, name: event.target.value } : row) }))} />
              <input value={entry.price} inputMode="decimal" placeholder={t("menu.modifier_price")} onChange={(event) => setForm((current) => ({ ...current, [entry.kind]: current[entry.kind].map((row) => row.id === entry.id ? { ...row, price: decimalText(event.target.value) } : row) }))} />
              <button type="button" className="food-item-x" aria-label={t("common.delete")} onClick={() => setForm((current) => ({ ...current, [entry.kind]: current[entry.kind].filter((row) => row.id !== entry.id) }))}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="food-item-actions">
        <button type="submit" className="food-item-save" disabled={!ready}>{t("common.save")}</button>
        <button type="button" className="food-item-cancel" onClick={() => navigate("/food-items")}>{t("common.cancel")}</button>
      </div>
    </form>
  );
};

function ModeSwitch({ mode, currency, onChange }) {
  return (
    <span className="food-item-switch">
      <button type="button" className={mode === "amount" ? "is-on" : ""} onClick={() => onChange("amount")}>{currency}</button>
      <button type="button" className={mode === "percent" ? "is-on" : ""} onClick={() => onChange("percent")}>%</button>
    </span>
  );
}

export default FoodItemForm;
