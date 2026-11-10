import React, { useState, useEffect } from "react";
import "./Orders.css";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Users,
  Package,
  DollarSign,
  ChefHat,
  CheckCircle,
  XCircle,
  CreditCard,
  UserPlus,
  ShieldCheck,
  Wallet,
  Banknote,
  Globe,
} from "lucide-react";
import paymentService from "@services/paymentService";
import orderService from "@services/orderService";
import invoiceService from "@services/invoiceService";
import tableService from "@services/tableService";
import customerService from "@services/customerService";
import menuService from "@services/menuService";
import CustomerModal from "@components/CustomerModal";
import {
  ProtectedElement,
  ProtectedButton,
} from "@components/ProtectedElement";
import { PERMISSIONS } from "@utils/permissionUtils";
import { useRestaurant } from "@hooks/useRestaurant";
import { formatMoney } from "../../utils/money";

const Orders = () => {
  const { t, i18n } = useTranslation();
  const { getCurrency } = useRestaurant();
  const currency = getCurrency();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    type: "dineIn",
    table: "",
    customer: "",
    items: [],
    notes: "",
  });

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Payment modal state
  const [paymentData, setPaymentData] = useState({
    orderId: "",
    method: "cash",
    status: "paid",
  });
  const [gateways, setGateways] = useState([]);
  const [loadingGateways, setLoadingGateways] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchTables();
    fetchMenuItems();
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setLoadingGateways(true);
      const response = await paymentService.getSupportedGateways();
      setGateways(response.data || []);
    } catch (error) {
      console.error("Failed to fetch gateways:", error);
    } finally {
      setLoadingGateways(false);
    }
  };

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchOrders = async () => {
    try {
      const result = await orderService.getAll();
      console.log("API Result:", result);
      console.log("Orders array:", result?.data);
      setOrders(result?.data || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch orders",
      });
    }
  };

  const fetchTables = async () => {
    try {
      const response = await tableService.getAll();
      setTables(response.data || response);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await menuService.getAll();
      setMenuItems(response.data || response || []);
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
    }
  };

  // Search customers by phone or name
  const searchCustomers = async (query) => {
    if (!query || query.length < 3) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    try {
      setSearchingCustomers(true);
      const response = await customerService.search(query);
      setCustomerSearchResults(response.data || response);
      setShowCustomerDropdown(true);
    } catch (error) {
      console.error("Error searching customers:", error);
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
    } finally {
      setSearchingCustomers(false);
    }
  };

  // Handle customer search input
  const handleCustomerSearch = (value) => {
    setCustomerSearch(value);
    searchCustomers(value);
  };

  // Select customer from search results
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.phone);
    setFormData({ ...formData, customer: customer._id });
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  // Clear customer selection
  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setFormData({ ...formData, customer: "" });
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  // Create new customer
  const createNewCustomer = () => {
    setShowCustomerModal(true);
  };

  // Handle customer creation success
  const handleCustomerCreated = (newCustomer) => {
    setSelectedCustomer(newCustomer);
    setCustomerSearch(newCustomer.phone);
    setFormData({ ...formData, customer: newCustomer._id });
    setShowCustomerModal(false);
    setMessage({
      type: "success",
      text: "Customer created and selected successfully!",
    });
  };

  // Order items management
  const addOrderItem = (menuItem) => {
    const newItem = {
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1,
      modifiers: [],
      notes: "",
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
  };

  const removeOrderItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateOrderItem = (index, field, value) => {
    const newItems = formData.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    setFormData({ ...formData, items: newItems });
  };

  const calculateOrderTotal = () => {
    return formData.items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const modifiersTotal =
        item.modifiers?.reduce(
          (modTotal, mod) => modTotal + (mod.price || 0),
          0,
        ) || 0;
      return total + itemTotal + modifiersTotal * item.quantity;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedOrder) {
        // Update order
        await orderService.update(selectedOrder._id, formData);
        setMessage({ type: "success", text: "Order updated successfully!" });
      } else {
        // Create new order
        await orderService.create(formData);
        setMessage({ type: "success", text: "Order created successfully!" });
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Operation failed",
      });
    }
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setFormData({
      type: order.type || "dineIn",
      table: order.table || "",
      customer: order.customer || "",
      items: order.items || [],
      notes: order.notes || "",
    });

    // Set customer search state if customer exists
    if (order.customer) {
      setCustomerSearch(order.customer);
      setSelectedCustomer(order.customer);
    }

    setShowEditModal(true);
  };

  const handleDelete = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await orderService.delete(orderId);
        setMessage({ type: "success", text: "Order deleted successfully!" });
        fetchOrders();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Delete failed",
        });
      }
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, { status: newStatus });
      setMessage({
        type: "success",
        text: "Order status updated successfully!",
      });
      fetchOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Status update failed",
      });
    }
  };

  const handleGenerateInvoice = async (order) => {
    try {
      await invoiceService.create({ orderId: order._id });
      setMessage({ type: "success", text: "Invoice generated successfully!" });
      fetchOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Invoice generation failed",
      });
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      // If payment method is online, get a payment link
      if (paymentData.method === "online") {
        const response = await orderService.getPaymentLink(paymentData.orderId);
        if (response && response.data && response.data.checkoutUrl) {
          window.location.href = response.data.checkoutUrl;
          return;
        } else if (response && response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
          return;
        }
      }

      const response = await invoiceService.updatePaymentStatus(
        paymentData.orderId,
        {
          status: paymentData.status,
          method: paymentData.method,
        },
      );

      // Handle Payment Gateway Redirect if returned from update (backup/fallback)
      if (response && response.data && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
        return;
      }

      setMessage({ type: "success", text: "Payment processed successfully!" });
      setShowPaymentModal(false);
      setPaymentData({ orderId: "", method: "cash", status: "paid" });
      fetchOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Payment failed",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: "dineIn",
      table: "",
      customer: "",
      items: [],
      notes: "",
    });
    setSelectedOrder(null);
    setCustomerSearch("");
    setSelectedCustomer(null);
    setCustomerSearchResults([]);
    setShowCustomerDropdown(false);
  };

  const filteredOrders = orders.filter((order) => {
    const customerName =
      order.customer?.name ||
      (typeof order.customer === "string" ? order.customer : "");
    const matchesSearch =
      (customerName &&
        customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.notes &&
        order.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filterStatus === "all" || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "in_kitchen":
        return "text-blue-600 bg-blue-50";
      case "served":
        return "text-green-600 bg-green-50";
      case "paid":
        return "text-purple-600 bg-purple-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "in_kitchen":
        return <ChefHat size={16} />;
      case "served":
        return <CheckCircle size={16} />;
      case "paid":
        return <DollarSign size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const getOrderTypeColor = (type) => {
    switch (type) {
      case "dineIn":
        return "text-blue-600 bg-blue-50";
      case "takeaway":
        return "text-orange-600 bg-orange-50";
      case "delivery":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTableName = (table) => {
    if (!table) return "-";
    if (typeof table === "object" && table.number) {
      return table.number;
    }
    return "Unassigned";
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => {
      const itemPrice = item.menuItem?.price || item.price || 0;
      const itemTotal = itemPrice * item.qty;
      const modifiersTotal = item.modifiers
        ? item.modifiers.reduce((sum, mod) => sum + (mod.price || 0), 0)
        : 0;
      return total + (itemTotal + modifiersTotal) * item.qty;
    }, 0);
  };

  return (
    <div data-direction={i18n.dir()}>
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Package size={28} />
            {t("nav.orders")}
          </h1>
          <p>{t("nav.orders_manage_description")}</p>
        </div>
        <ProtectedElement permission={PERMISSIONS.MANAGE_ORDERS}>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="btn-primary"
          >
            <Plus size={20} />
            {t("nav.orders_add_new")}
          </button>
        </ProtectedElement>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Package />
          </div>
          <div className="stat-content">
            <h3>{orders.length}</h3>
            <p>{t("nav.orders_total_orders")}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-content">
            <h3>{orders.filter((o) => o.status === "pending").length}</h3>
            <p>{t("nav.orders_pending_orders")}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <ChefHat />
          </div>
          <div className="stat-content">
            <h3>{orders.filter((o) => o.status === "in_kitchen").length}</h3>
            <p>{t("nav.orders_in_kitchen")}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign />
          </div>
          <div className="stat-content">
            <h3>{orders.filter((o) => o.status === "paid").length}</h3>
            <p>{t("nav.orders_paid_orders")}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder={t("nav.orders_search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            {t("nav.orders_filter_all")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            {t("nav.orders_filter_pending")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "in_kitchen" ? "active" : ""}`}
            onClick={() => setFilterStatus("in_kitchen")}
          >
            {t("nav.orders_filter_in_kitchen")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "served" ? "active" : ""}`}
            onClick={() => setFilterStatus("served")}
          >
            {t("nav.orders_filter_served")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "paid" ? "active" : ""}`}
            onClick={() => setFilterStatus("paid")}
          >
            {t("nav.orders_filter_paid")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "cancelled" ? "active" : ""}`}
            onClick={() => setFilterStatus("cancelled")}
          >
            {t("nav.orders_filter_cancelled")}
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th data-direction={i18n.dir()}>{t("nav.orders_order_id")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_customer")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_type")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_table")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_items")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_total")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_status")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td data-direction={i18n.dir()}>
                  <span className="order-id">#{order._id.slice(-6)}</span>
                </td>
                <td data-direction={i18n.dir()}>
                  <div className="customer-info">
                    <Users size={16} />
                    <span>
                      {order.customer?.name ||
                        order.customer ||
                        t("nav.orders_guest_customer")}
                    </span>
                  </div>
                </td>
                <td data-direction={i18n.dir()}>
                  <span
                    className={`status-badge ${getOrderTypeColor(order.type)}`}
                  >
                    {t(`nav.orders_${order.type}`)}
                  </span>
                </td>
                <td data-direction={i18n.dir()}>
                  {order.type === "dineIn" ? getTableName(order.table) : "-"}
                </td>
                <td data-direction={i18n.dir()}>
                  <div className="items-info">
                    <span>
                      {order.items?.length || 0}{" "}
                      {order.items?.length === 1
                        ? t("nav.orders_item")
                        : t("nav.orders_items")}
                    </span>
                    {order.items?.length > 0 && (
                      <span className="items-total">
                        {order.items[0].menuItem?.name ||
                          order.items[0].name ||
                          ""}
                        {order.items.length > 1
                          ? ` +${order.items.length - 1}`
                          : ""}
                      </span>
                    )}
                  </div>
                </td>
                <td data-direction={i18n.dir()}>
                  <div className="total-info">
                    <span>
                      {formatMoney(
                        order.total ?? calculateTotal(order.items || []),
                        currency,
                      )}
                    </span>
                  </div>
                </td>
                <td data-direction={i18n.dir()}>
                  <span
                    className={`status-badge ${getStatusColor(order.status)}`}
                  >
                    {getStatusIcon(order.status)}
                    {t(`nav.orders_status_${order.status}`)}
                  </span>
                </td>
                <td data-direction={i18n.dir()}>
                  <div className="action-buttons">
                    <ProtectedButton
                      permission={PERMISSIONS.MANAGE_ORDERS}
                      onClick={() => handleEdit(order)}
                      className="btn-edit"
                      title={t("nav.orders_edit_order")}
                    >
                      <Edit2 size={16} />
                    </ProtectedButton>
                    <ProtectedButton
                      permission={PERMISSIONS.MANAGE_ORDERS}
                      onClick={() => handleDelete(order._id)}
                      className="btn-delete"
                      title={t("nav.orders_delete_order")}
                    >
                      <Trash2 size={16} />
                    </ProtectedButton>
                    <ProtectedElement permission={PERMISSIONS.MANAGE_ORDERS}>
                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order._id, "in_kitchen")
                          }
                          className="btn-status"
                          title={t("nav.orders_start_preparation")}
                        >
                          <ChefHat size={16} />
                        </button>
                      )}
                      {order.status === "in_kitchen" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order._id, "served")
                          }
                          className="btn-status"
                          title={t("nav.orders_mark_served")}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {order.status === "served" && (
                        <>
                          <ProtectedButton
                            permission={PERMISSIONS.MANAGE_INVOICES}
                            onClick={() => handleGenerateInvoice(order)}
                            className="btn-invoice"
                            title={t("nav.orders_generate_invoice")}
                          >
                            <DollarSign size={16} />
                          </ProtectedButton>
                          <button
                            onClick={() => {
                              setPaymentData({
                                ...paymentData,
                                orderId: order._id,
                              });
                              setShowPaymentModal(true);
                            }}
                            className="btn-payment"
                            title={t("nav.orders_process_payment")}
                          >
                            <CreditCard size={16} />
                          </button>
                        </>
                      )}
                    </ProtectedElement>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Order Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {showEditModal ? (
                  <>
                    <Edit2 size={20} />
                    {t("nav.orders_edit_order")}
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    {t("nav.orders_add_new_order")}
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="btn-close"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="order-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t("nav.orders_order_type")}</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option value="dineIn">{t("nav.orders_dine_in")}</option>
                    <option value="takeaway">{t("nav.orders_takeaway")}</option>
                    <option value="delivery">{t("nav.orders_delivery")}</option>
                  </select>
                </div>

                {formData.type === "dineIn" && (
                  <div className="form-group">
                    <label>{t("nav.orders_table")}</label>
                    <select
                      value={formData.table}
                      onChange={(e) =>
                        setFormData({ ...formData, table: e.target.value })
                      }
                    >
                      <option value="">{t("nav.orders_select_table")}</option>
                      {tables.map((table) => (
                        <option key={table._id} value={table._id}>
                          {table.number} ({table.seats} seats)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>{t("nav.orders_customer")}</label>
                  <div className="customer-search-container">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      placeholder={t("nav.orders_customer_placeholder")}
                      className="customer-search-input"
                    />
                    {showCustomerDropdown && (
                      <div className="customer-dropdown">
                        {searchingCustomers ? (
                          <div className="customer-loading">Searching...</div>
                        ) : (
                          customerSearchResults.map((customer) => (
                            <div
                              key={customer._id}
                              className="customer-option"
                              onClick={() => selectCustomer(customer)}
                            >
                              <div className="customer-info">
                                <div className="customer-name">
                                  {customer.name}
                                </div>
                                <div className="customer-phone">
                                  {customer.phone}
                                </div>
                                {customer.email && (
                                  <div className="customer-email">
                                    {customer.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}

                        {customerSearchResults.length === 0 &&
                          customerSearch.length >= 3 &&
                          !searchingCustomers && (
                            <div
                              className="customer-option create-customer-option"
                              onClick={createNewCustomer}
                            >
                              <div className="customer-info">
                                <div className="customer-name">
                                  <UserPlus size={16} />
                                  Create New Customer
                                </div>
                                <div className="customer-phone">
                                  {customerSearch}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {selectedCustomer && (
                      <div className="selected-customer-info">
                        <div className="customer-details">
                          <strong>{selectedCustomer.name}</strong>
                          <span>{selectedCustomer.phone}</span>
                          {selectedCustomer.email && (
                            <span>{selectedCustomer.email}</span>
                          )}
                          <button
                            type="button"
                            onClick={clearCustomerSelection}
                            className="clear-customer-btn"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items Section */}
                <div className="form-group full-width order-items-section">
                  <label>{t("nav.orders_items")}</label>

                  {/* Menu Items Selection */}
                  <div className="menu-items-selection">
                    <select
                      onChange={(e) => {
                        const selectedItem = menuItems.find(
                          (item) => item._id === e.target.value,
                        );
                        if (selectedItem) {
                          addOrderItem(selectedItem);
                          e.target.value = ""; // Reset selection
                        }
                      }}
                      value=""
                    >
                      <option value="">{t("nav.orders_select_item")}</option>
                      {menuItems
                        .filter((item) => item.isActive !== false)
                        .map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} - {formatMoney(item.price, currency)}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Selected Items List */}
                  {formData.items.length > 0 && (
                    <div className="selected-items-list">
                      {formData.items.map((item, index) => (
                        <div key={index} className="order-item-row">
                          <div className="item-info">
                            <span className="item-name">{item.name}</span>
                            <span className="item-price">
                              {formatMoney(item.price, currency)}
                            </span>
                          </div>
                          <div className="item-controls">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateOrderItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="quantity-input"
                            />
                            <input
                              type="text"
                              placeholder={t("nav.orders_item_notes")}
                              value={item.notes || ""}
                              onChange={(e) =>
                                updateOrderItem(index, "notes", e.target.value)
                              }
                              className="item-notes-input"
                            />
                            <button
                              type="button"
                              onClick={() => removeOrderItem(index)}
                              className="btn-icon btn-delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Order Total */}
                      <div className="order-total">
                        <strong>{t("nav.orders_total")}:</strong>
                        <span>{formatMoney(calculateOrderTotal(), currency)}</span>
                      </div>
                    </div>
                  )}

                  {formData.items.length === 0 && (
                    <p className="no-items-message">
                      {t("nav.orders_no_items")}
                    </p>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>{t("nav.orders_notes")}</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder={t("nav.orders_notes_placeholder")}
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  {showEditModal ? t("common.update") : t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                <CreditCard size={20} />
                {t("nav.orders_process_payment")}
              </h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentData({
                    orderId: "",
                    method: "cash",
                    status: "paid",
                  });
                }}
                className="btn-close"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handlePayment} className="payment-form">
              <div className="mb-8">
                <label className="block mb-4 font-semibold text-[var(--text-primary)] text-lg">
                  {t("nav.orders_payment_method")}
                </label>
                <div className="payment-method-grid">
                  {[
                    { id: "cash", icon: <Banknote size={24} />, label: t("nav.orders_cash") },
                    { id: "card", icon: <CreditCard size={24} />, label: t("nav.orders_card") },
                    { id: "online", icon: <Globe size={24} />, label: t("nav.orders_online") },
                    { id: "wallet", icon: <Wallet size={24} />, label: t("nav.orders_wallet") },
                  ].map((method) => (
                    <div
                      key={method.id}
                      className={`payment-method-card ${paymentData.method === method.id ? "active" : ""}`}
                      onClick={() => setPaymentData({ ...paymentData, method: method.id })}
                    >
                      <div className="method-icon">{method.icon}</div>
                      <span className="method-label">{method.label}</span>
                      {paymentData.method === method.id && (
                        <div className="method-active-check">
                          <CheckCircle size={14} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group pb-4">
                  <label className="block mb-3 font-medium text-[var(--text-secondary)]">
                    {t("nav.orders_payment_status")}
                  </label>
                  <select
                    value={paymentData.status}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, status: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
                  >
                    <option value="paid">{t("nav.orders_paid")}</option>
                    <option value="unpaid">{t("nav.orders_unpaid")}</option>
                  </select>
                </div>
              </div>

              {paymentData.method === "online" && gateways.length > 0 && (
                <div className="online-payment-indicator p-4 mb-6 rounded-xl bg-green-50/50 border border-green-100 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                        Secure Online Payment
                      </p>
                      <p className="text-sm text-green-600">
                        {t("landing.secure_notice")}
                      </p>
                    </div>
                  </div>
                  {gateways[0].logo && (
                    <img 
                      src={gateways[0].logo} 
                      alt={gateways[0].name} 
                      className="h-8 w-auto object-contain opacity-80" 
                    />
                  )}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentData({
                      orderId: "",
                      method: "cash",
                      status: "paid",
                    });
                  }}
                  className="btn-secondary"
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  {t("nav.orders_process_payment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCustomerCreated={handleCustomerCreated}
        initialData={{
          phone: customerSearch,
        }}
      />
    </div>
  );
};

export default Orders;
