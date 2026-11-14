import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Package, Plus, Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import inventoryService from "@services/inventoryService";
import ingredientCategoryService from "@services/ingredientCategoryService";
import supplierService from "@services/supplierService";
import { useRestaurant } from "@hooks/useRestaurant";
import { formatMoney } from "../../utils/money";
import "./Purchase.css";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function categoryIdOf(item) {
  const category = item.ingredientCategory;
  if (category && typeof category === "object") return category._id || "";
  return category || "";
}

const Purchase = () => {
  const { t } = useTranslation();
  const { getCurrency } = useRestaurant();
  const currency = getCurrency();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [letter, setLetter] = useState("");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState([]);
  const [panel, setPanel] = useState("");
  const [showSupplier, setShowSupplier] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState({
    deliveryDate: "",
    deliveryTime: "",
    supplierId: "",
    invoiceNo: "",
    paid: "",
    fileName: "",
    destination: "",
  });

  const load = async () => {
    try {
      const [itemResult, categoryResult, supplierResult] = await Promise.all([
        inventoryService.getAll(),
        ingredientCategoryService.getAll(),
        supplierService.getAll(),
      ]);
      setItems(itemResult?.data || []);
      setCategories(categoryResult?.data || []);
      setSuppliers(supplierResult?.data || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || t("nav.purchase_load_failed"),
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = window.setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => window.clearTimeout(timer);
  }, [message.text]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryId && categoryIdOf(item) !== categoryId) return false;
      if (letter && !String(item.name || "").toUpperCase().startsWith(letter)) return false;
      if (term && !String(item.name || "").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [items, categoryId, letter, query]);

  const lineFor = (itemId) => lines.find((line) => line.itemId === itemId);
  const itemById = (itemId) => items.find((item) => item._id === itemId);

  const lineTotal = (line) => {
    const item = itemById(line.itemId);
    return (Number(line.qty) || 0) * (Number(item?.costPrice) || 0);
  };

  const purchaseTotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);

  const toggleItem = (item) => {
    setLines((current) => {
      if (current.some((line) => line.itemId === item._id)) {
        return current.filter((line) => line.itemId !== item._id);
      }
      return [...current, { itemId: item._id, qty: "1", expiry: "" }];
    });
  };

  const updateQty = (itemId, qty) => {
    setLines((current) =>
      current.map((line) => (line.itemId === itemId ? { ...line, qty } : line)),
    );
  };

  const updateExpiry = (itemId, expiry) => {
    setLines((current) =>
      current.map((line) => (line.itemId === itemId ? { ...line, expiry } : line)),
    );
  };

  const resetEntry = (keepPanel = false) => {
    setLines([]);
    if (!keepPanel) setPanel("");
    setDetails({
      deliveryDate: "",
      deliveryTime: "",
      supplierId: "",
      invoiceNo: "",
      paid: "",
      fileName: "",
      destination: "",
    });
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      const result = await ingredientCategoryService.create(name);
      const created = result?.data;
      if (created) {
        setCategories((current) => [...current, created]);
        setCategoryId(created._id);
      } else {
        load();
      }
      setNewCategory("");
      setAddingCategory(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || t("nav.purchase_load_failed"),
      });
    }
  };

  const submit = async () => {
    const ready = lines.filter((line) => Number(line.qty) > 0);
    if (!ready.length) {
      setMessage({ type: "error", text: t("nav.purchase_need_items") });
      return;
    }
    setSaving(true);
    try {
      for (const line of ready) {
        await inventoryService.updateStock(line.itemId, {
          amount: Number(line.qty),
          type: "addition",
        });
      }
      setMessage({ type: "success", text: t("nav.purchase_saved") });
      resetEntry();
      load();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || t("nav.purchase_load_failed"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="purchase-page">
      {message.text && <Alert type={message.type} message={message.text} />}
      <div className="purchase-head">
        {panel === "po" || panel === "requisition" ? (
          <button type="button" className="purchase-po-title" onClick={() => setPanel("")}>
            <ArrowLeft size={18} />
            {t(panel === "po" ? "nav.purchase_po_title" : "nav.purchase_requisition_title")}
          </button>
        ) : (
          <h1>{t("nav.purchase_title")}</h1>
        )}
        <div>
          <button
            type="button"
            className={panel === "po" ? "active" : ""}
            onClick={() => setPanel((current) => (current === "po" ? "" : "po"))}
          >
            {t("nav.purchase_po")}
          </button>
          <button
            type="button"
            className={panel === "requisition" ? "active" : ""}
            onClick={() =>
              setPanel((current) => (current === "requisition" ? "" : "requisition"))
            }
          >
            {t("nav.purchase_requisition")}
          </button>
        </div>
      </div>

      <section className="purchase-card">
        <div className="purchase-categories">
          <span>{t("nav.purchase_category")}</span>
          <button type="button" aria-label={t("nav.purchase_add_category")} onClick={() => setAddingCategory((open) => !open)}>
            <Plus size={16} />
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              className={categoryId === category._id ? "active" : ""}
              onClick={() => {
                setCategoryId(category._id);
                setLetter("");
              }}
            >
              {category.name}
            </button>
          ))}
          {categories.length === 0 && <em>{t("nav.purchase_no_categories")}</em>}
        </div>
        {addingCategory && (
          <form
            className="purchase-new-category"
            onSubmit={(event) => {
              event.preventDefault();
              addCategory();
            }}
          >
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder={t("nav.purchase_category_name")}
            />
            <button type="submit">{t("nav.purchase_add_category")}</button>
          </form>
        )}

        <div className="purchase-workspace">
          <div className="purchase-supplies">
            <div className="purchase-supply-bar">
              <strong>
                {t("nav.purchase_supplies")}
                <Link to="/inventory" aria-label={t("nav.inventory")}>
                  <Plus size={16} />
                </Link>
              </strong>
              <button type="button" onClick={() => { setLetter(""); setQuery(""); }}>
                <ArrowLeft size={14} />
                {t("nav.purchase_back")}
              </button>
              <label>
                <Search size={14} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("nav.purchase_search")}
                />
              </label>
            </div>
            <div className="purchase-grid-wrap">
              <div className="purchase-grid">
                {visible.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className={lineFor(item._id) ? "selected" : ""}
                    onClick={() => toggleItem(item)}
                  >
                    <Package size={18} />
                    <span>{item.name}</span>
                  </button>
                ))}
                {visible.length === 0 && <p>{t("nav.purchase_no_items")}</p>}
              </div>
              <div className="purchase-letters">
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

          <div className={`purchase-lines ${panel === "po" ? "with-expiry" : ""} ${panel === "requisition" ? "requisition" : ""}`}>
            <div className="purchase-line head">
              <span>{t("nav.purchase_item")}</span>
              <span>{t("nav.purchase_qty")}</span>
              {panel !== "requisition" && <span>{t("nav.purchase_total")}</span>}
              {(panel === "po" || panel === "requisition") && <span>{t("nav.purchase_expiry")}</span>}
            </div>
            {lines.map((line) => {
              const item = itemById(line.itemId);
              if (!item) return null;
              return (
                <div key={line.itemId} className="purchase-line">
                  <span>
                    {item.name}
                    {item.unit ? ` (${item.unit})` : ""}
                    <button type="button" onClick={() => toggleItem(item)} aria-label={t("nav.purchase_remove")}>
                      <Trash2 size={14} />
                    </button>
                  </span>
                  <input
                    inputMode="decimal"
                    value={line.qty}
                    onChange={(event) => updateQty(line.itemId, event.target.value.replace(/[^\d.]/g, ""))}
                  />
                  {panel !== "requisition" && <input readOnly value={lineTotal(line).toFixed(2)} />}
                  {(panel === "po" || panel === "requisition") && (
                    <label className="purchase-expiry">
                      <Calendar size={14} />
                      <input
                        type="date"
                        aria-label={t("nav.purchase_expiry")}
                        value={line.expiry || ""}
                        onChange={(event) => updateExpiry(line.itemId, event.target.value)}
                      />
                    </label>
                  )}
                </div>
              );
            })}
            {lines.length === 0 && <p>{t("nav.purchase_no_lines")}</p>}
          </div>
        </div>

        {panel !== "po" && panel !== "requisition" && (
          <div className="purchase-supplier-head">
            <span>{t("nav.purchase_supplier_info")}</span>
            <button
              type="button"
              className={`purchase-switch ${showSupplier ? "on" : ""}`}
              aria-pressed={showSupplier}
              onClick={() => setShowSupplier((open) => !open)}
            />
          </div>
        )}
        {panel === "requisition" && (
          <div className="purchase-supplier">
            <label>
              {t("nav.purchase_delivery")}
              <input
                type="date"
                value={details.deliveryDate}
                onChange={(event) => setDetails({ ...details, deliveryDate: event.target.value })}
              />
              <input
                type="time"
                value={details.deliveryTime}
                onChange={(event) => setDetails({ ...details, deliveryTime: event.target.value })}
              />
            </label>
            <label>
              {t("nav.purchase_requisition_to")}
              <input
                value={details.destination}
                onChange={(event) => setDetails({ ...details, destination: event.target.value })}
              />
            </label>
          </div>
        )}
        {panel !== "requisition" && (panel === "po" || showSupplier) && (
          <div className="purchase-supplier">
            <label>
              {t("nav.purchase_delivery")}
              <input
                type="date"
                value={details.deliveryDate}
                onChange={(event) => setDetails({ ...details, deliveryDate: event.target.value })}
              />
              <input
                type="time"
                value={details.deliveryTime}
                onChange={(event) => setDetails({ ...details, deliveryTime: event.target.value })}
              />
            </label>
            <label>
              {t("nav.suppliers")}
              <select
                value={details.supplierId}
                onChange={(event) => setDetails({ ...details, supplierId: event.target.value })}
              >
                <option value="">{t("nav.purchase_select_supplier")}</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
            {panel === "po" ? (
              <label className="purchase-file">
                {t("nav.purchase_invoice_file")}
                <input
                  type="file"
                  onChange={(event) =>
                    setDetails({ ...details, fileName: event.target.files?.[0]?.name || "" })
                  }
                />
                <span>{details.fileName || t("nav.purchase_choose_file")}</span>
              </label>
            ) : (
              <label>
                {t("nav.purchase_invoice_no")}
                <input
                  value={details.invoiceNo}
                  onChange={(event) => setDetails({ ...details, invoiceNo: event.target.value })}
                />
              </label>
            )}
          </div>
        )}

        <div className="purchase-footer">
          {panel !== "requisition" && (
            <p>
              {t(panel === "po" ? "nav.purchase_po_amount" : "nav.purchase_grand")}:{" "}
              <strong>{formatMoney(purchaseTotal, currency)}</strong>
            </p>
          )}
          {panel !== "requisition" && (
            <label>
              {t("nav.purchase_paid")}
              <input
                inputMode="decimal"
                value={details.paid}
                onChange={(event) =>
                  setDetails({ ...details, paid: event.target.value.replace(/[^\d.]/g, "") })
                }
              />
            </label>
          )}
          {panel !== "po" && panel !== "requisition" && (
            <label className="purchase-file">
              {t("nav.purchase_invoice_file")}
              <input
                type="file"
                onChange={(event) =>
                  setDetails({ ...details, fileName: event.target.files?.[0]?.name || "" })
                }
              />
              <span>{details.fileName || t("nav.purchase_choose_file")}</span>
            </label>
          )}
          <div>
            <button
              type="button"
              className="purchase-cancel"
              onClick={() => resetEntry(panel === "po" || panel === "requisition")}
            >
              {t("nav.purchase_cancel")}
            </button>
            <button type="button" className="purchase-submit" disabled={saving} onClick={submit}>
              {t("nav.purchase_submit")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Purchase;
