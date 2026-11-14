import { useEffect, useMemo, useState } from "react";
import { Package, Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import inventoryService from "@services/inventoryService";
import ingredientCategoryService from "@services/ingredientCategoryService";
import { useRestaurant } from "@hooks/useRestaurant";
import "./StockCount.css";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function categoryIdOf(item) {
  const category = item.ingredientCategory;
  if (category && typeof category === "object") return category._id || "";
  return category || "";
}

function draftKey(restaurantId) {
  return `stockCountDraft:${restaurantId || "restaurant"}`;
}

function readDraft(restaurantId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(draftKey(restaurantId)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const StockCount = () => {
  const { t } = useTranslation();
  const { getRestaurantId } = useRestaurant();
  const restaurantId = getRestaurantId();
  const [supplies, setSupplies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [letter, setLetter] = useState("");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLines(readDraft(restaurantId));
  }, [restaurantId]);

  useEffect(() => {
    inventoryService
      .getAll()
      .then((result) => setSupplies(result?.data || []))
      .catch(() => setSupplies([]));
    ingredientCategoryService
      .getAll()
      .then((result) => setCategories(result?.data || []))
      .catch(() => setCategories([]));
  }, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return supplies.filter((item) => {
      if (categoryId && categoryIdOf(item) !== categoryId) return false;
      if (letter && !String(item.name || "").toUpperCase().startsWith(letter)) return false;
      if (term && !String(item.name || "").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [supplies, categoryId, letter, query]);

  const itemLabel = (item) => `${item.name}${item.unit ? ` (${item.unit})` : ""}`;

  const toggleSupply = (item) => {
    setMessage("");
    setLines((current) => {
      if (current.some((line) => line.itemId === item._id)) {
        return current.filter((line) => line.itemId !== item._id);
      }
      return [
        ...current,
        {
          itemId: item._id,
          name: item.name,
          unit: item.unit || "",
          counted: String(item.stock ?? 0),
          comment: "",
        },
      ];
    });
  };

  const updateLine = (itemId, patch) => {
    setLines((current) => current.map((line) => (line.itemId === itemId ? { ...line, ...patch } : line)));
  };

  const saveDraft = () => {
    localStorage.setItem(draftKey(restaurantId), JSON.stringify(lines));
    setMessage(t("nav.stock_count_saved"));
  };

  const cancel = () => {
    setLines([]);
    localStorage.removeItem(draftKey(restaurantId));
    setMessage("");
  };

  const submit = async () => {
    const ready = lines.filter((line) => line.counted !== "");
    if (!ready.length) return;
    setSaving(true);
    try {
      for (const line of ready) {
        await inventoryService.update(line.itemId, { stock: Number(line.counted) || 0 });
      }
      setLines([]);
      localStorage.removeItem(draftKey(restaurantId));
      const result = await inventoryService.getAll();
      setSupplies(result?.data || []);
      setMessage(t("nav.stock_count_submitted"));
    } catch {
      setMessage(t("nav.stock_count_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="count-page">
      <h1>{t("nav.stock_count_title")}</h1>
      <section className="count-card">
        <div className="count-categories">
          <span>{t("nav.purchase_category")}</span>
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              className={categoryId === category._id ? "active" : ""}
              onClick={() => {
                setCategoryId((current) => (current === category._id ? "" : category._id));
                setLetter("");
              }}
            >
              {category.name}
            </button>
          ))}
          {categories.length === 0 && <em>{t("nav.purchase_no_categories")}</em>}
        </div>
        <div className="count-workspace">
          <div>
            <div className="count-supply-bar">
              <strong>{t("nav.purchase_supplies")}</strong>
              <label>
                <Search size={14} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("nav.purchase_search")}
                />
              </label>
            </div>
            <p className="count-popular">
              {t("nav.requisition_popular", { count: String(visible.length).padStart(2, "0") })}
            </p>
            <div className="count-grid-wrap">
              <div className="count-grid">
                {visible.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className={lines.some((line) => line.itemId === item._id) ? "selected" : ""}
                    onClick={() => toggleSupply(item)}
                  >
                    <Package size={16} />
                    <span>{item.name}</span>
                  </button>
                ))}
                {visible.length === 0 && <p>{t("nav.purchase_no_items")}</p>}
              </div>
              <div className="count-letters">
                {LETTERS.map((mark) => (
                  <button
                    key={mark}
                    type="button"
                    className={letter === mark ? "active" : ""}
                    onClick={() => setLetter((current) => (current === mark ? "" : mark))}
                  >
                    {mark}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="count-sheet">
            <div className="count-row head">
              <span>{t("nav.po_line_items")}</span>
              <span>{t("nav.stock_count_counted")}</span>
              <span>{t("nav.stock_count_comment")}</span>
            </div>
            {lines.map((line) => (
              <div key={line.itemId} className="count-row">
                <span>
                  {itemLabel(line)}
                  <button type="button" aria-label={t("nav.purchase_remove")} onClick={() => toggleSupply({ _id: line.itemId })}>
                    <Trash2 size={14} />
                  </button>
                </span>
                <input
                  inputMode="decimal"
                  aria-label={t("nav.stock_count_counted")}
                  value={line.counted}
                  onChange={(event) =>
                    updateLine(line.itemId, { counted: event.target.value.replace(/[^\d.]/g, "") })
                  }
                />
                <input
                  aria-label={t("nav.stock_count_comment")}
                  placeholder={t("nav.stock_count_placeholder")}
                  value={line.comment}
                  onChange={(event) => updateLine(line.itemId, { comment: event.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
        {message && <p className="count-message">{message}</p>}
        <div className="count-actions">
          <button type="button" className="count-cancel" onClick={cancel}>{t("nav.purchase_cancel")}</button>
          <button type="button" className="count-draft" onClick={saveDraft}>{t("nav.stock_count_draft")}</button>
          <button type="button" className="count-submit" disabled={saving} onClick={submit}>
            {t("nav.purchase_submit")}
          </button>
        </div>
      </section>
    </div>
  );
};

export default StockCount;
