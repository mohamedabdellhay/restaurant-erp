import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownUp, Eye, Filter, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import { useRestaurant } from "@hooks/useRestaurant";
import categoryService from "@services/categoryService";
import inventoryService from "@services/inventoryService";
import menuService from "@services/menuService";
import { formatMoney } from "../../utils/money";
import "./FoodItems.css";

const STATIONS = [
  { id: "dining", label: "nav.food_item_station_dining" },
  { id: "juice", label: "nav.food_item_station_juice" },
  { id: "kitchen", label: "nav.food_item_station_kitchen" },
];

const SORTS = [
  { id: "name", label: "nav.food_item_item" },
  { id: "price", label: "nav.food_item_price" },
  { id: "cost", label: "nav.food_item_cost" },
  { id: "profit", label: "nav.food_item_profit" },
  { id: "code", label: "nav.food_item_code" },
  { id: "prep", label: "nav.food_item_prep" },
];

const EMPTY_FORM = { code: "", categoryId: "", name: "", price: "", station: "", prep: "", lines: [] };

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

function recipeCost(item) {
  return (item?.recipe || []).reduce((sum, entry) => {
    const qty = Number(entry.qty) || 0;
    const cost = Number(entry.inventoryItem?.costPrice) || 0;
    return sum + qty * cost;
  }, 0);
}

function listedCost(item, note) {
  const food = recipeCost(item);
  const extra = note?.otherMode === "amount" ? Number(note.otherValue) || 0 : (food * (Number(note?.otherValue) || 0)) / 100;
  return food + extra;
}

const FoodItems = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { getRestaurantId, getCurrency } = useRestaurant();
  const restaurantId = getRestaurantId();
  const currency = getCurrency();
  const canManage = hasPermission("manage_menu");
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [meta, setMeta] = useState({});
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [categoryId, setCategoryId] = useState("");
  const [menu, setMenu] = useState("");
  const [form, setForm] = useState(null);
  const [mode, setMode] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const draft = form || EMPTY_FORM;
  const lines = draft.lines || [];

  const load = () => {
    menuService.getAll().then((result) => setItems(result?.data || [])).catch(() => setItems([]));
    categoryService.getAll().then((result) => setCategories(result?.data || [])).catch(() => setCategories([]));
    inventoryService.getAll().then((result) => setSupplies(result?.data || [])).catch(() => setSupplies([]));
    setMeta(readMeta(restaurantId));
  };

  useEffect(() => {
    load();
  }, [restaurantId]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const writeMeta = (next) => {
    setMeta(next);
    localStorage.setItem(metaKey(restaurantId), JSON.stringify(next));
  };

  const stationName = (id) => {
    const station = STATIONS.find((entry) => entry.id === id);
    return station ? t(station.label) : "";
  };

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const itemCategory = item.category?._id || (typeof item.category === "string" ? item.category : "");
      if (categoryId && itemCategory !== categoryId) return false;
      if (!needle) return true;
      const note = meta[item._id] || {};
      return [item.name, item.category?.name, note.code, stationName(note.station)].join(" ").toLowerCase().includes(needle);
    });
    const valueOf = (item) => {
      const note = meta[item._id] || {};
      const cost = listedCost(item, note);
      if (sort === "price") return Number(item.price) || 0;
      if (sort === "cost") return cost;
      if (sort === "profit") return (Number(item.price) || 0) - cost;
      if (sort === "code") return note.code || "";
      if (sort === "prep") return Number(note.prep) || 0;
      return item.name || "";
    };
    return [...filtered].sort((left, right) => {
      const a = valueOf(left);
      const b = valueOf(right);
      if (typeof a === "number" && typeof b === "number") return a - b;
      return String(a).localeCompare(String(b));
    });
  }, [items, query, categoryId, sort, meta, t]);

  const open = (item, nextMode) => {
    const note = item ? meta[item._id] || {} : {};
    setMode(nextMode);
    setForm({
      code: note.code || "",
      categoryId: item?.category?._id || (typeof item?.category === "string" ? item.category : ""),
      name: item?.name || "",
      price: item ? String(item.price ?? "") : "",
      station: note.station || "",
      prep: note.prep || "",
      lines: (item?.recipe || []).map((entry) => ({
        key: entry._id || crypto.randomUUID(),
        itemId: entry.inventoryItem?._id || entry.inventoryItem || "",
        qty: String(entry.qty ?? ""),
      })),
    });
    setMenu("");
  };

  const close = () => {
    setForm(null);
    setMode("");
  };

  const remove = async (id) => {
    if (!window.confirm(t("nav.food_item_confirm_delete"))) return;
    try {
      await menuService.delete(id);
      const next = { ...readMeta(restaurantId) };
      delete next[id];
      writeMeta(next);
      setMessage({ type: "success", text: t("nav.food_item_deleted") });
      load();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || t("common.error") });
    }
  };

  const blank = "—";

  return (
    <div className="food-items">
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.food_items")}</h1>
      <div className="food-items-toolbar">
        <div className="food-items-tools">
          <label>
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("inventory.quick_search")}
              aria-label={t("inventory.quick_search")}
            />
          </label>
          <div className="food-items-drop">
            <button type="button" className="food-items-ghost" onClick={() => setMenu(menu === "sort" ? "" : "sort")}>
              <ArrowDownUp size={14} />
              {t("nav.food_item_sort")}
            </button>
            {menu === "sort" && (
              <div className="food-items-menu">
                {SORTS.map((entry) => (
                  <button key={entry.id} type="button" className={sort === entry.id ? "is-current" : ""} onClick={() => { setSort(entry.id); setMenu(""); }}>
                    {t(entry.label)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="food-items-drop">
            <button type="button" className="food-items-ghost" onClick={() => setMenu(menu === "filter" ? "" : "filter")}>
              <Filter size={14} />
              {t("nav.food_item_filter")}
            </button>
            {menu === "filter" && (
              <div className="food-items-menu">
                <button type="button" className={categoryId === "" ? "is-current" : ""} onClick={() => { setCategoryId(""); setMenu(""); }}>
                  {t("nav.customer_filter_all")}
                </button>
                {categories.map((category) => (
                  <button key={category._id} type="button" className={categoryId === category._id ? "is-current" : ""} onClick={() => { setCategoryId(category._id); setMenu(""); }}>
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {canManage && (
          <button type="button" className="food-items-new" onClick={() => navigate("/food-items/new")}>
            <Plus size={16} />
            {t("nav.food_item_new")}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("nav.food_item_code")}</th>
              <th>{t("nav.food_category")}</th>
              <th>{t("nav.food_item_item")}</th>
              <th>{t("nav.food_item_price")}</th>
              <th>{t("nav.food_item_cost")}</th>
              <th>{t("nav.food_item_profit")}</th>
              <th>{t("nav.food_item_station")}</th>
              <th>{t("nav.food_item_prep")}</th>
              <th>{t("menu.action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9}>{t("nav.food_item_empty")}</td>
              </tr>
            ) : (
              rows.map((item) => {
                const note = meta[item._id] || {};
                const cost = listedCost(item, note);
                const profit = (Number(item.price) || 0) - cost;
                return (
                  <tr key={item._id}>
                    <td>{note.code || blank}</td>
                    <td>{item.category?.name || blank}</td>
                    <td>{item.name}</td>
                    <td>{formatMoney(item.price, currency)}</td>
                    <td>{formatMoney(cost, currency)}</td>
                    <td>{formatMoney(profit, currency)}</td>
                    <td>{stationName(note.station) || blank}</td>
                    <td>{note.prep || blank}</td>
                    <td className="food-items-actions">
                      <button type="button" className="food-items-view" aria-label={t("common.view")} onClick={() => open(item, "view")}>
                        <Eye size={14} />
                      </button>
                      {canManage && (
                        <>
                          <button type="button" className="food-items-edit" aria-label={t("common.edit")} onClick={() => navigate(`/food-items/${item._id}/edit`)}>
                            <Pencil size={14} />
                          </button>
                          <button type="button" className="food-items-delete" aria-label={t("common.delete")} onClick={() => remove(item._id)}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {form && mode === "view" && (
        <div className="food-items-overlay">
          <div className="food-items-dialog">
            <header>
              <h2>{draft.name}</h2>
              <button type="button" aria-label={t("common.close")} onClick={close}>
                <X size={18} />
              </button>
            </header>
            <dl>
              <div><dt>{t("nav.food_item_code")}</dt><dd>{draft.code || blank}</dd></div>
              <div><dt>{t("nav.food_category")}</dt><dd>{categories.find((category) => category._id === draft.categoryId)?.name || blank}</dd></div>
              <div><dt>{t("nav.food_item_price")}</dt><dd>{formatMoney(draft.price, currency)}</dd></div>
              <div><dt>{t("nav.food_item_station")}</dt><dd>{stationName(draft.station) || blank}</dd></div>
              <div><dt>{t("nav.food_item_prep")}</dt><dd>{draft.prep || blank}</dd></div>
            </dl>
            <h3>{t("menu.recipe")}</h3>
            {lines.length === 0 ? (
              <p>{t("nav.food_item_no_recipe")}</p>
            ) : (
              <ul>
                {lines.map((line) => {
                  const supply = supplies.find((entry) => entry._id === line.itemId);
                  const cost = (Number(line.qty) || 0) * (Number(supply?.costPrice) || 0);
                  return (
                    <li key={line.key}>
                      <span>{supply?.name || blank}</span>
                      <span>{line.qty} {supply?.unit || ""}</span>
                      <span>{formatMoney(cost, currency)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default FoodItems;
