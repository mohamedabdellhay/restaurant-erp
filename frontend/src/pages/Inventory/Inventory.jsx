import React, { useState, useEffect } from "react";
import "./Inventory.css";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  X,
  Save,
  Filter,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
  ChevronDown,
} from "lucide-react";
import inventoryService from "@services/inventoryService";
import supplierService from "@services/supplierService";

const Inventory = () => {
  const { t, i18n } = useTranslation();

  // Get theme colors for dynamic styling

  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterCategory, setFilterCategory] = useState("all");
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
  });

  useEffect(() => {
    fetchItems();
    fetchLowStockItems();
    fetchSuppliers();
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
    setFormData({
      name: item.name || "",
      sku: item.sku || "",
      unit: item.unit || "",
      costPrice: item.costPrice || "",
      supplier: item.supplier || "",
      minStockAlert: item.minStockAlert || 10,
    });

    // Set supplier search term to show supplier name if supplier exists
    if (item.supplier) {
      const supplier = suppliers.find((s) => s._id === item.supplier);
      setSupplierSearchTerm(supplier ? supplier.name : "");
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

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterCategory === "all" || item.category === filterCategory;

    return matchesSearch && matchesFilter;
  });

  const getStockLevelColor = (currentStock, minStock) => {
    // Handle division by zero 2/5*100
    if (!minStock || minStock === 0) return "#10b981"; // Green
    const percentage = (Number(currentStock) / Number(minStock)) * 100;
    if (percentage <= 60) return "#ef4444"; // Red
    if (percentage <= 100) return "#f59e0b"; // Orange
    return "#10b981"; // Green
  };

  const getStockLevelLabel = (currentStock, minStock) => {
    // Handle division by zero
    if (!minStock || minStock === 0) return "Good";
    const percentage = (Number(currentStock) / Number(minStock)) * 100;
    if (percentage <= 60) return "Critical";
    if (percentage <= 100) return "Low";
    return "Good";
  };

  return (
    <div className="inventory-page" data-direction={i18n.dir()}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">
          {t("nav.inventory") || "Inventory Management"}
        </h1>
        <div className="page-actions">
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={20} />
            {t("inventory.add_new") || "Add Item"}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Low Stock Alert */}
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

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search
            size={20}
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
            }}
          />
          <input
            type="text"
            placeholder={t("inventory.search_placeholder") || "Search items..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: "3rem" }}
            className="form-input"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">
            {t("inventory.filter_all") || "All Categories"}
          </option>
          <option value="food">{t("inventory.category_food") || "Food"}</option>
          <option value="beverage">
            {t("inventory.category_beverage") || "Beverage"}
          </option>
          <option value="supplies">
            {t("inventory.category_supplies") || "Supplies"}
          </option>
          <option value="other">
            {t("inventory.category_other") || "Other"}
          </option>
        </select>
      </div>

      {/* Statistics Cards */}
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
              $
              {items
                .reduce(
                  (sum, item) => sum + (item.stock * item.costPrice || 0),
                  0,
                )
                .toFixed(2)}
            </h3>
            <p>{t("inventory.total_value") || "Total Value"}</p>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="inventory-table">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t("inventory.name") || "Name"}</th>
                <th>{t("inventory.sku") || "SKU"}</th>
                <th>{t("inventory.unit") || "Unit"}</th>
                <th>{t("inventory.cost_price") || "Cost Price"}</th>
                <th>{t("inventory.stock") || "Stock"}</th>
                <th>{t("inventory.min_stock") || "Min Stock"}</th>
                <th>{t("inventory.status") || "Status"}</th>
                <th>{t("inventory.actions") || "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    {t("common.loading") || "Loading..."}
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    {t("inventory.no_items_found") || "No items found"}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.sku || "-"}</td>
                    <td>{item.unit || "-"}</td>
                    <td>${item.costPrice || 0}</td>
                    <td>{item.stock || 0}</td>
                    <td>{item.minStockAlert || 10}</td>
                    <td>
                      <span
                        className="stock-level"
                        style={{
                          color: getStockLevelColor(
                            item.stock,
                            item.minStockAlert,
                          ),
                        }}
                      >
                        <div
                          className="stock-indicator"
                          style={{
                            backgroundColor: getStockLevelColor(
                              item.stock,
                              item.minStockAlert,
                            ),
                          }}
                        ></div>
                        {t(
                          `inventory.${getStockLevelLabel(item.stock, item.minStockAlert).toLowerCase()}`,
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleStockUpdate(item)}
                          className="btn-icon btn-stock"
                          title={t("inventory.update_stock") || "Update Stock"}
                        >
                          <Package size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="btn-icon btn-edit"
                          title={t("common.edit") || "Edit"}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="btn-icon btn-delete"
                          title={t("common.delete") || "Delete"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
