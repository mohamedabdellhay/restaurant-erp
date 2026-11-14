import React, { useState, useEffect } from "react";
import Alert from "@components/Alert";
import "./Inventory.css";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  X,
  Save,
  ChevronDown,
} from "lucide-react";
import inventoryService from "@services/inventoryService";
import ingredientCategoryService from "@services/ingredientCategoryService";
import supplierService from "@services/supplierService";
import { useRestaurant } from "@hooks/useRestaurant";
import { useAuth } from "@hooks/useAuth";
import { getErrorMessage } from "../../utils/errorMessage";
import { formatMoney } from "../../utils/money";

const Inventory = () => {
  const { t, i18n } = useTranslation();
  const { getCurrency } = useRestaurant();
  const { hasPermission } = useAuth();
  const currency = getCurrency();
  const canManage = hasPermission("manage_inventory");

  // Get theme colors for dynamic styling

  const [items, setItems] = useState([]);
  const [ingredientCategories, setIngredientCategories] = useState([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [stockUpdateData, setStockUpdateData] = useState({
    amount: "",
    type: "addition",
  });
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    unit: "",
    costPrice: "",
    supplier: "",
    minStockAlert: 10,
    ingredientCategoryId: "",
  });

  useEffect(() => {
    fetchItems();
    fetchLowStockItems();
    fetchSuppliers();
    fetchIngredientCategories();
  }, []);

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showSupplierDropdown &&
        !event.target.closest(".supplier-search-dropdown")
      ) {
        setShowSupplierDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSupplierDropdown]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getAll();
      setItems(response.data || response);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || "Failed to fetch inventory items",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const response = await inventoryService.getLowStock();
      setLowStockItems(response.data || response);
    } catch (error) {
      console.error("Failed to fetch low stock items:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getAll();
      setSuppliers(response.data || response);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        // Update item
        await inventoryService.update(selectedItem._id, formData);
        setMessage({ type: "success", text: "Item updated successfully!" });
      } else {
        // Create new item
        await inventoryService.create(formData);
        setMessage({ type: "success", text: "Item created successfully!" });
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchItems();
      fetchLowStockItems();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Operation failed",
      });
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    const supplierId =
      item.supplier && typeof item.supplier === "object"
        ? item.supplier._id
        : item.supplier || "";
    const categoryId =
      item.ingredientCategory && typeof item.ingredientCategory === "object"
        ? item.ingredientCategory._id
        : item.ingredientCategoryId || "";
    setFormData({
      name: item.name || "",
      sku: item.sku || "",
      unit: item.unit || "",
      costPrice: item.costPrice || "",
      supplier: supplierId,
      minStockAlert: item.minStockAlert || 10,
      ingredientCategoryId: categoryId,
    });

    if (supplierId) {
      const supplier = suppliers.find((s) => s._id === supplierId);
      setSupplierSearchTerm(
        supplier?.name ||
          (typeof item.supplier === "object" ? item.supplier.name : "") ||
          "",
      );
    } else {
      setSupplierSearchTerm("");
    }

    setShowEditModal(true);
  };

  const handleDelete = async (itemId) => {
    if (
      window.confirm("Are you sure you want to delete this inventory item?")
    ) {
      try {
        await inventoryService.delete(itemId);
        setMessage({ type: "success", text: "Item deleted successfully!" });
        fetchItems();
        fetchLowStockItems();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to delete item",
        });
      }
    }
  };

  const handleStockUpdate = (item) => {
    setSelectedItem(item);
    setStockUpdateData({ amount: "", type: "addition" });
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    const amount = parseFloat(stockUpdateData.amount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({
        type: "error",
        text: "Please enter a valid positive number for stock amount",
      });
      return;
    }

    try {
      console.log("Updating stock for item:", selectedItem._id);
      console.log("Stock update data:", {
        amount: amount,
        type: stockUpdateData.type,
      });

      const response = await inventoryService.updateStock(selectedItem._id, {
        amount: amount,
        type: stockUpdateData.type,
      });

      console.log("Stock update response:", response);

      setMessage({ type: "success", text: "Stock updated successfully!" });
      setShowStockModal(false);
      setStockUpdateData({ amount: "", type: "addition" });
      setSelectedItem(null);
      fetchItems();
      fetchLowStockItems();
    } catch (error) {
      console.error("Stock update error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update stock",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      unit: "",
      costPrice: "",
      supplier: "",
      minStockAlert: 10,
      ingredientCategoryId: "",
    });
    setSelectedItem(null);
    setSupplierSearchTerm("");
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()),
  );

  const handleSupplierSelect = (supplier) => {
    setFormData({ ...formData, supplier: supplier._id });
    setSupplierSearchTerm(supplier.name);
    setShowSupplierDropdown(false);
  };

  const categoryLabel = (item) =>
    item.ingredientCategory && typeof item.ingredientCategory === "object"
      ? item.ingredientCategory.name
      : "";

  const filteredItems = items.filter((item) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [item.name, item.sku, item.unit, categoryLabel(item)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const formatQty = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "0";
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(number);
  };

  const stockLevelKey = (currentStock, minStock) => {
    if (!minStock || Number(minStock) === 0) return "in_stock";
    const percentage = (Number(currentStock) / Number(minStock)) * 100;
    if (percentage <= 60) return "critical";
    if (percentage <= 100) return "low";
    return "in_stock";
  };

  const fetchIngredientCategories = async () => {
    try {
      const response = await ingredientCategoryService.getAll();
      if (response.success) setIngredientCategories(response.data || []);
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    }
  };

  const openCategoryModal = (category = null) => {
    setEditingCategory(category);
    setCategoryName(category?.name || "");
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryName("");
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) return;
    try {
      const response = editingCategory
        ? await ingredientCategoryService.update(editingCategory._id, name)
        : await ingredientCategoryService.create(name);
      if (!response.success) {
        setMessage({ type: "error", text: response.message });
        return;
      }
      setMessage({
        type: "success",
        text: editingCategory
          ? t("inventory.category_updated")
          : t("inventory.category_created"),
      });
      closeCategoryModal();
      fetchIngredientCategories();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm(t("inventory.confirm_delete_category"))) return;
    try {
      const response = await ingredientCategoryService.delete(id);
      if (!response.success) {
        setMessage({ type: "error", text: response.message });
        return;
      }
      setMessage({ type: "success", text: t("inventory.category_deleted") });
      fetchIngredientCategories();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    }
  };

  const visibleCategories = ingredientCategories.filter((category) =>
    category.name?.toLowerCase().includes(categoryQuery.trim().toLowerCase()),
  );

  return (
    <div data-direction={i18n.dir()}>
      <section className="ingredient-category">
        <h1>{t("inventory.ingredients_category")}</h1>
        <div className="ingredient-category-toolbar">
          <label className="ingredient-category-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={categoryQuery}
              onChange={(event) => setCategoryQuery(event.target.value)}
              placeholder={t("inventory.quick_search")}
            />
          </label>
          {canManage && (
            <button
              type="button"
              className="btn-primary ingredient-category-new"
              onClick={() => openCategoryModal()}
            >
              <Plus size={16} />
              {t("inventory.new_category")}
            </button>
          )}
        </div>
        <div className="table-container ingredient-category-table">
          <table>
            <thead>
              <tr>
                <th>{t("inventory.ingredients_category")}</th>
                <th className="ingredient-category-action-col">{t("inventory.action")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleCategories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="ingredient-category-empty">
                    {t("inventory.no_categories")}
                  </td>
                </tr>
              ) : (
                visibleCategories.map((category) => (
                  <tr key={category._id}>
                    <td>{category.name}</td>
                    <td className="ingredient-category-action-col">
                      {canManage && (
                        <>
                          <button
                            type="button"
                            className="ingredient-category-edit"
                            onClick={() => openCategoryModal(category)}
                            aria-label={t("common.edit")}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="ingredient-category-delete"
                            onClick={() => deleteCategory(category._id)}
                            aria-label={t("common.delete")}
                          >
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
      </section>

      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {editingCategory
                  ? t("inventory.edit_category")
                  : t("inventory.new_category")}
              </h2>
              <button type="button" className="btn-close" onClick={closeCategoryModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveCategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="ingredient-category-name">
                    {t("inventory.category_name")}
                  </label>
                  <input
                    id="ingredient-category-name"
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeCategoryModal}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  {editingCategory ? t("common.update") : t("common.add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Alert type={message.type} message={message.text} />

      {lowStockItems.length > 0 && (
        <div className="low-stock-alert">
          <div className="low-stock-header">
            <AlertTriangle size={24} style={{ color: "var(--error)" }} />
            <h3 className="low-stock-title">
              {t("inventory.low_stock_alert") || "Low Stock Alert"}
            </h3>
            <span style={{ color: "var(--text-secondary)" }}>
              {lowStockItems.length}{" "}
              {t("inventory.items_below_minimum") ||
                "items below minimum stock"}
            </span>
          </div>
        </div>
      )}

      <section className="ingredient-item">
        <h1>{t("inventory.ingredients_item")}</h1>
        <div className="ingredient-item-toolbar">
          <label className="ingredient-item-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("inventory.quick_search")}
            />
          </label>
          <button
            type="button"
            className="btn-primary ingredient-item-new"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            {t("inventory.new_item")}
          </button>
        </div>
        <div className="table-container ingredient-item-table">
          <table>
            <thead>
              <tr>
                <th>{t("inventory.item_name")}</th>
                <th>{t("inventory.category")}</th>
                <th>{t("inventory.unit")}</th>
                <th>{t("inventory.storage_capacity")}</th>
                <th>{t("inventory.existing_quantity")}</th>
                <th>{t("inventory.price_per_unit")}</th>
                <th>{t("inventory.value")}</th>
                <th>{t("inventory.stock_level")}</th>
                <th className="ingredient-item-action-col">{t("inventory.action")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="ingredient-item-empty">
                    {t("common.loading") || "Loading..."}
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="ingredient-item-empty">
                    {t("inventory.no_items_found")}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const level = stockLevelKey(item.stock, item.minStockAlert);
                  const value = (Number(item.stock) || 0) * (Number(item.costPrice) || 0);
                  return (
                    <tr key={item._id}>
                      <td>
                        <span className="ingredient-item-name">
                          <span className="ingredient-item-thumb" aria-hidden="true">
                            <Package size={16} />
                          </span>
                          <span>{item.name}</span>
                        </span>
                      </td>
                      <td>{categoryLabel(item) || "—"}</td>
                      <td>{item.unit || "—"}</td>
                      <td>{formatQty(item.minStockAlert)}</td>
                      <td>{formatQty(item.stock)}</td>
                      <td>{formatMoney(item.costPrice, currency)}</td>
                      <td>{formatMoney(value, currency)}</td>
                      <td>
                        <span className={`ingredient-stock ingredient-stock-${level}`}>
                          {t(`inventory.${level}`)}
                        </span>
                      </td>
                      <td className="ingredient-item-action-col">
                        <button
                          type="button"
                          className="ingredient-item-stock"
                          onClick={() => handleStockUpdate(item)}
                          aria-label={t("inventory.update_stock")}
                        >
                          <Package size={15} />
                        </button>
                        <button
                          type="button"
                          className="ingredient-item-edit"
                          onClick={() => handleEdit(item)}
                          aria-label={t("common.edit")}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="ingredient-item-delete"
                          onClick={() => handleDelete(item._id)}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3>{items.length}</h3>
            <p>{t("inventory.total_items") || "Total Items"}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{lowStockItems.length}</h3>
            <p>{t("inventory.low_stock_items") || "Low Stock Items"}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <h3>
              {formatMoney(
                items.reduce(
                  (sum, item) => sum + (item.stock * item.costPrice || 0),
                  0,
                ),
                currency,
              )}
            </h3>
            <p>{t("inventory.total_value") || "Total Value"}</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {selectedItem
                  ? t("inventory.edit_item") || "Edit Item"
                  : t("inventory.add_new_item") || "Add New Item"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t("inventory.name") || "Item Name"} *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={
                      t("inventory.name_placeholder") || "Enter item name"
                    }
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("inventory.sku") || "SKU"}</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder={t("inventory.sku_placeholder") || "Enter SKU"}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ingredient-item-category">
                    {t("inventory.category")}
                  </label>
                  <select
                    id="ingredient-item-category"
                    className="form-input"
                    value={formData.ingredientCategoryId}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        ingredientCategoryId: event.target.value,
                      })
                    }
                  >
                    <option value="">{t("inventory.no_category")}</option>
                    {ingredientCategories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t("inventory.unit") || "Unit"}</label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder={
                      t("inventory.unit_placeholder") || "Enter unit"
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>{t("inventory.cost_price") || "Cost Price"} *</label>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: e.target.value })
                    }
                    placeholder={
                      t("inventory.cost_price_placeholder") ||
                      "Enter cost price"
                    }
                    className="form-input"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("inventory.supplier") || "Supplier"}</label>
                  <div className="supplier-search-dropdown">
                    <div className="supplier-input-wrapper">
                      <input
                        type="text"
                        name="supplier"
                        value={supplierSearchTerm}
                        onChange={(e) => {
                          setSupplierSearchTerm(e.target.value);
                          setShowSupplierDropdown(true);
                        }}
                        onFocus={() => setShowSupplierDropdown(true)}
                        placeholder={
                          t("inventory.supplier_placeholder") ||
                          "Search supplier..."
                        }
                        className="form-input"
                      />
                      <ChevronDown
                        size={20}
                        className="dropdown-arrow"
                        onClick={() =>
                          setShowSupplierDropdown(!showSupplierDropdown)
                        }
                      />
                    </div>
                    {showSupplierDropdown && (
                      <div className="supplier-dropdown-list">
                        {filteredSuppliers.length === 0 ? (
                          <div className="no-suppliers-found">
                            {t("inventory.no_suppliers_found") ||
                              "No suppliers found"}
                          </div>
                        ) : (
                          filteredSuppliers.map((supplier) => (
                            <div
                              key={supplier._id}
                              className="supplier-option"
                              onClick={() => handleSupplierSelect(supplier)}
                            >
                              <div className="supplier-info">
                                <div className="supplier-name">
                                  {supplier.name}
                                </div>
                                <div className="supplier-details">
                                  {supplier.phone && (
                                    <span className="supplier-phone">
                                      {supplier.phone}
                                    </span>
                                  )}
                                  {supplier.paymentTerms && (
                                    <span className="supplier-terms">
                                      {supplier.paymentTerms}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    {t("inventory.min_stock") || "Minimum Stock Alert"} *
                  </label>
                  <input
                    type="number"
                    name="minStockAlert"
                    value={formData.minStockAlert}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStockAlert: e.target.value,
                      })
                    }
                    placeholder={
                      t("inventory.min_stock_placeholder") ||
                      "Enter minimum stock"
                    }
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  {selectedItem
                    ? t("common.update") || "Update"
                    : t("common.create") || "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {t("inventory.update_stock") || "Update Stock"} -{" "}
                {selectedItem.name}
              </h2>
              <button
                onClick={() => {
                  setShowStockModal(false);
                  setSelectedItem(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStockSubmit}>
              <div className="modal-body">
                <div className="current-stock-info">
                  <p>
                    <strong>
                      {t("inventory.current_stock") || "Current Stock"}:
                    </strong>{" "}
                    {selectedItem.stock || 0} {selectedItem.unit || ""}
                  </p>
                  <p>
                    <strong>
                      {t("inventory.min_stock_alert") || "Min Stock Alert"}:
                    </strong>{" "}
                    {selectedItem.minStockAlert || 10} {selectedItem.unit || ""}
                  </p>
                  {stockUpdateData.amount && (
                    <p className="stock-preview">
                      <strong>
                        {t("inventory.new_stock") || "New Stock"}:
                      </strong>
                      <span
                        className={
                          stockUpdateData.type === "addition"
                            ? "stock-addition"
                            : "stock-deduction"
                        }
                      >
                        {stockUpdateData.type === "addition" ? "+" : "-"}
                        {stockUpdateData.amount} ={" "}
                        {stockUpdateData.type === "addition"
                          ? (
                              parseFloat(selectedItem.stock || 0) +
                              parseFloat(stockUpdateData.amount)
                            ).toFixed(0)
                          : (
                              parseFloat(selectedItem.stock || 0) -
                              parseFloat(stockUpdateData.amount)
                            ).toFixed(0)}{" "}
                        {selectedItem.unit || ""}
                      </span>
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label>
                    {t("inventory.stock_amount") || "Stock Amount"} *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={stockUpdateData.amount}
                    onChange={(e) =>
                      setStockUpdateData({
                        ...stockUpdateData,
                        amount: e.target.value,
                      })
                    }
                    placeholder={
                      t("inventory.stock_amount_placeholder") || "Enter amount"
                    }
                    className="form-input"
                    step="1"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("inventory.update_type") || "Update Type"} *</label>
                  <select
                    name="type"
                    value={stockUpdateData.type}
                    onChange={(e) =>
                      setStockUpdateData({
                        ...stockUpdateData,
                        type: e.target.value,
                      })
                    }
                    className="form-select"
                    required
                  >
                    <option value="addition">
                      {t("inventory.stock_addition") || "Addition"}
                    </option>
                    <option value="deduction">
                      {t("inventory.stock_deduction") || "Deduction"}
                    </option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowStockModal(false);
                    setStockUpdateData({ amount: "", type: "addition" });
                  }}
                  className="btn-secondary"
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                <button type="submit" className="btn-primary">
                  <Package size={16} />
                  {t("inventory.update_stock") || "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
