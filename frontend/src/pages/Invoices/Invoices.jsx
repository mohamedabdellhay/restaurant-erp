import React, { useState, useEffect } from "react";
import PageHeader from "@components/PageHeader";
import Alert from "@components/Alert";
import "./Invoices.css";
import { useTranslation } from "react-i18next";
import { useRestaurant } from "@hooks/useRestaurant";
import { useAuth } from "@hooks/useAuth";
import { RoleBasedUI } from "@utils/roleUtils";
import {
  Receipt,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Save,
  Filter,
  FileText,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Printer,
} from "lucide-react";
import { formatMoney } from "../../utils/money";
import invoiceService from "@services/invoiceService";
import orderService from "@services/orderService";

const Invoices = () => {
  const { t, i18n } = useTranslation();
  const { getThemeColors, getCurrency } = useRestaurant();
  const currency = getCurrency();
  const { user } = useAuth();

  // Get theme colors for dynamic styling
  const themeColors = getThemeColors();
  const primaryColor = themeColors.primary || "#f59e0b";
  const secondaryColor = themeColors.secondary || "#6366f1";

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [statistics, setStatistics] = useState(null);

  // Form state for add/edit - simplified to match API
  const [formData, setFormData] = useState({
    orderId: "",
    status: "unpaid",
    method: "cash",
  });

  // Order search state
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderSearchResults, setOrderSearchResults] = useState([]);
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);
  const [showOrderResults, setShowOrderResults] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchStatistics();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getAll();
      setInvoices(response.data || response);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch invoices",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await invoiceService.getStatistics();
      setStatistics(response.data || response);
    } catch (error) {
      console.error("Failed to fetch statistics", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (selectedInvoice) {
        // Update payment status and method
        response = await invoiceService.updatePaymentStatus(selectedInvoice._id, {
          status: formData.status,
          method: formData.method,
        });
        setMessage({ type: "success", text: "Invoice updated successfully!" });
      } else {
        // Create invoice from order
        response = await invoiceService.create({ orderId: formData.orderId });
        setMessage({ type: "success", text: "Invoice created successfully!" });
      }

      // Handle Payment Gateway Redirect (e.g., Kashier)
      if (response && response.data && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
        return;
      } else if (response && response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
        return;
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchInvoices();
      fetchStatistics();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Operation failed",
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await invoiceService.delete(id);
        setMessage({ type: "success", text: "Invoice deleted successfully!" });
        fetchInvoices();
        fetchStatistics();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Delete failed",
        });
      }
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await invoiceService.updatePaymentStatus(id, { status });
      setMessage({ type: "success", text: "Status updated successfully!" });
      fetchInvoices();
      fetchStatistics();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Status update failed",
      });
    }
  };

  const handleGeneratePDF = async (id) => {
    try {
      const blob = await invoiceService.generatePDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage({ type: "success", text: "PDF downloaded successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "PDF generation failed",
      });
    }
  };

  const handleSendEmail = async (id) => {
    const email = prompt("Enter email address:");
    if (email) {
      try {
        await invoiceService.sendByEmail(id, { email });
        setMessage({ type: "success", text: "Invoice sent successfully!" });
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to send email",
        });
      }
    }
  };

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      orderId: invoice.order?._id || "",
      status: invoice.paymentStatus || "unpaid",
      method: invoice.paymentMethod || "cash",
    });
    setShowEditModal(true);
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setFormData({
      orderId: "",
      status: "unpaid",
      method: "cash",
    });
    setSelectedInvoice(null);
    setOrderSearchQuery("");
    setOrderSearchResults([]);
    setShowOrderResults(false);
    setSelectedOrder(null);
  };

  // Order search functions
  const handleOrderSearch = async (query) => {
    setOrderSearchQuery(query);
    if (query.length < 2) {
      setOrderSearchResults([]);
      setShowOrderResults(false);
      return;
    }

    setOrderSearchLoading(true);
    try {
      const response = await orderService.search(query);
      setOrderSearchResults(response.data || response || []);
      setShowOrderResults(true);
    } catch (error) {
      console.error("Order search failed:", error);
      setOrderSearchResults([]);
    } finally {
      setOrderSearchLoading(false);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setFormData({ ...formData, orderId: order._id });
    setOrderSearchQuery(
      `${order.customer?.name || ""} - ${order._id.substring(0, 8)}...`,
    );
    setShowOrderResults(false);
  };

  const calculateInvoiceTotal = (invoice) => {
    // Use grandTotal from API if available, otherwise calculate
    return invoice.grandTotal !== undefined
      ? invoice.grandTotal
      : (invoice.subTotal || 0) +
          ((invoice.subTotal || 0) * (invoice.taxPercent || 0)) / 100;
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      invoice.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || invoice.paymentStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle size={16} className="text-green-500" />;
      case "pending":
        return <Clock size={16} className="text-yellow-500" />;
      case "unpaid":
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "status-paid";
      case "pending":
        return "status-pending";
      case "unpaid":
        return "status-unpaid";
      default:
        return "status-pending";
    }
  };

  return (
    <div>
      <PageHeader
        icon={Receipt}
        title={t("nav.invoices")}
        subtitle={t("invoices.manage_description")}
      >
        <RoleBasedUI user={user} allowedRoles={["admin", "manager", "cashier"]}>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="btn-primary"
          >
            <Plus size={20} />
            {t("invoices.add_new")}
          </button>
        </RoleBasedUI>
      </PageHeader>

      {/* Stats Cards */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText />
            </div>
            <div className="stat-content">
              <h3>{statistics.totalInvoices || invoices.length}</h3>
              <p>{t("invoices.total_invoices")}</p>
            </div>
          </div>
          <div className="stat-card paid">
            <div className="stat-icon">
              <CheckCircle />
            </div>
            <div className="stat-content">
              <h3>
                {statistics.paidCount ||
                  invoices.filter((i) => i.paymentStatus === "paid").length}
              </h3>
              <p>{t("invoices.paid")}</p>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">
              <Clock />
            </div>
            <div className="stat-content">
              <h3>
                {statistics.unpaidCount ||
                  invoices.filter((i) => i.paymentStatus === "unpaid").length}
              </h3>
              <p>{t("invoices.unpaid")}</p>
            </div>
          </div>
          <div className="stat-card revenue">
            <div className="stat-icon">
              <DollarSign />
            </div>
            <div className="stat-content">
              <h3>
                {formatMoney(
                  statistics.totalRevenue ||
                    invoices.reduce((sum, i) => sum + calculateInvoiceTotal(i), 0),
                  currency,
                )}
              </h3>
              <p>{t("invoices.total_revenue")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder={t("invoices.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            {t("invoices.filter_all")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "paid" ? "active" : ""}`}
            onClick={() => setFilterStatus("paid")}
          >
            {t("invoices.filter_paid")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            {t("invoices.filter_pending")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "unpaid" ? "active" : ""}`}
            onClick={() => setFilterStatus("unpaid")}
          >
            {t("invoices.filter_unpaid")}
          </button>
        </div>
      </div>

      {/* Message */}
      <Alert type={message.type} message={message.text} />

      {/* Invoices Table */}
      <div className="invoices-table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t("common.loading")}</p>
          </div>
        ) : (
          <table className="invoices-table">
            <thead>
              <tr>
                <th data-direction={i18n.dir()}>{t("invoices.number")}</th>
                <th data-direction={i18n.dir()}>{t("invoices.customer")}</th>
                <th data-direction={i18n.dir()}>{t("invoices.date")}</th>
                <th data-direction={i18n.dir()}>{t("invoices.amount")}</th>
                <th data-direction={i18n.dir()}>{t("invoices.status")}</th>
                <th data-direction={i18n.dir()}>
                  {t("invoices.payment_method")}
                </th>
                <th data-direction={i18n.dir()}>{t("invoices.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    {t("invoices.no_invoices_found")}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>
                      <span className="invoice-number">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <div className="customer-info">
                        <User size={16} />
                        <span>
                          {invoice.customer?.name ||
                            invoice.order?.customer?.name ||
                            "N/A"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <Calendar size={16} />
                        <span>
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="amount">
                        {formatMoney(
                          invoice.grandTotal ?? calculateInvoiceTotal(invoice),
                          currency,
                        )}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${getStatusClass(invoice.paymentStatus)}`}
                      >
                        {getStatusIcon(invoice.paymentStatus)}
                        {t(`invoices.status_${invoice.paymentStatus}`)}
                      </span>
                    </td>
                    <td>
                      <div className="payment-method">
                        <CreditCard size={16} />
                        <span>{invoice.paymentMethod}</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleViewDetails(invoice)}
                          className="btn-icon btn-view"
                          title={t("common.view")}
                        >
                          <FileText size={16} />
                        </button>
                        <RoleBasedUI
                          user={user}
                          allowedRoles={["admin", "manager", "cashier"]}
                        >
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                invoice._id,
                                invoice.paymentStatus === "paid"
                                  ? "unpaid"
                                  : "paid",
                              )
                            }
                            className="btn-icon btn-toggle"
                            title={
                              invoice.paymentStatus === "paid"
                                ? t("invoices.mark_unpaid")
                                : t("invoices.mark_paid")
                            }
                          >
                            {invoice.paymentStatus === "paid" ? (
                              <XCircle size={16} />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                          </button>
                        </RoleBasedUI>
                        <RoleBasedUI
                          user={user}
                          allowedRoles={["admin", "manager", "cashier"]}
                        >
                          <button
                            onClick={() => handleEdit(invoice)}
                            className="btn-icon btn-edit"
                            title={t("common.edit")}
                          >
                            <Edit size={16} />
                          </button>
                        </RoleBasedUI>
                        <button
                          onClick={() => handleGeneratePDF(invoice._id)}
                          className="btn-icon btn-download"
                          title={t("invoices.download_pdf")}
                        >
                          <Download size={16} />
                        </button>
                        <RoleBasedUI
                          user={user}
                          allowedRoles={["admin", "manager"]}
                        >
                          <button
                            onClick={() => handleSendEmail(invoice._id)}
                            className="btn-icon btn-email"
                            title={t("invoices.send_email")}
                          >
                            <Mail size={16} />
                          </button>
                        </RoleBasedUI>
                        <RoleBasedUI user={user} allowedRoles={["admin"]}>
                          <button
                            onClick={() => handleDelete(invoice._id)}
                            className="btn-icon btn-delete"
                            title={t("common.delete")}
                          >
                            <Trash2 size={16} />
                          </button>
                        </RoleBasedUI>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>
                {showEditModal ? (
                  <>
                    <Edit size={20} />
                    {t("invoices.edit_invoice")}
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    {t("invoices.add_new_invoice")}
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
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="invoice-form">
              {showAddModal ? (
                // Create Invoice Form - order search
                <div className="form-group order-search-container">
                  <label>{t("invoices.search_order")} *</label>
                  <div className="order-search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                      type="text"
                      placeholder={t("invoices.search_order_placeholder")}
                      value={orderSearchQuery}
                      onChange={(e) => handleOrderSearch(e.target.value)}
                      required
                    />
                    {orderSearchLoading && (
                      <span className="loading-spinner">...</span>
                    )}
                  </div>
                  <p className="form-hint">{t("invoices.search_order_help")}</p>

                  {/* Search Results Dropdown */}
                  {showOrderResults && orderSearchResults.length > 0 && (
                    <div className="order-search-results">
                      {orderSearchResults.map((order) => (
                        <div
                          key={order._id}
                          className="order-result-item"
                          onClick={() => handleSelectOrder(order)}
                        >
                          <div className="order-result-header">
                            <span className="order-id">
                              {order._id.substring(0, 8)}...
                            </span>
                            <span className="order-status">{order.status}</span>
                          </div>
                          <div className="order-result-customer">
                            <User size={14} />
                            <span>
                              {order.customer?.name ||
                                t("invoices.guest_customer")}
                            </span>
                            {order.customer?.phone && (
                              <span className="phone">
                                ({order.customer.phone})
                              </span>
                            )}
                          </div>
                          <div className="order-result-details">
                            <span className="items-count">
                              {order.items?.length || 0} {t("invoices.items")}
                            </span>
                            <span className="order-total">
                              {formatMoney(order.total, currency)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showOrderResults &&
                    orderSearchQuery.length >= 2 &&
                    orderSearchResults.length === 0 &&
                    !orderSearchLoading && (
                      <div className="order-search-no-results">
                        {t("invoices.no_orders_found")}
                      </div>
                    )}

                  {/* Hidden input to store selected orderId */}
                  <input type="hidden" value={formData.orderId} required />
                </div>
              ) : (
                // Edit Invoice Form - status and method
                <div className="form-grid">
                  <div className="form-group">
                    <label>{t("invoices.payment_status")} *</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      required
                    >
                      <option value="paid">{t("invoices.status_paid")}</option>
                      <option value="unpaid">
                        {t("invoices.status_unpaid")}
                      </option>
                      <option value="pending">
                        {t("invoices.status_pending")}
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t("invoices.payment_method")} *</label>
                    <select
                      value={formData.method}
                      onChange={(e) =>
                        setFormData({ ...formData, method: e.target.value })
                      }
                      required
                    >
                      <option value="cash">{t("invoices.cash")}</option>
                      <option value="card">{t("invoices.card")}</option>
                      <option value="wallet">{t("invoices.wallet")}</option>
                      <option value="online">{t("invoices.online")}</option>
                    </select>
                  </div>
                </div>
              )}

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
                  {showEditModal ? (
                    <>
                      <Save size={16} />
                      {t("common.update")}
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      {t("invoices.generate")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                <Receipt size={20} />
                {t("invoices.invoice_details")}
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedInvoice(null);
                }}
                className="btn-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="invoice-details">
              <div className="invoice-header">
                <h3>{selectedInvoice.invoiceNumber}</h3>
                <span
                  className={`status-badge ${getStatusClass(selectedInvoice.paymentStatus)}`}
                >
                  {getStatusIcon(selectedInvoice.paymentStatus)}
                  {t(`invoices.status_${selectedInvoice.paymentStatus}`)}
                </span>
              </div>

              <div className="invoice-info">
                <div className="info-row">
                  <span className="label">{t("invoices.order")}:</span>
                  <span className="value">
                    {selectedInvoice.order?._id
                      ? selectedInvoice.order._id.substring(0, 8) + "..."
                      : "N/A"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">{t("invoices.customer")}:</span>
                  <span className="value">
                    {selectedInvoice.customer?.name ||
                      selectedInvoice.order?.customer?.name ||
                      "N/A"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">{t("invoices.email")}:</span>
                  <span className="value">
                    {selectedInvoice.customer?.email ||
                      selectedInvoice.order?.customer?.email ||
                      "N/A"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">{t("invoices.date")}:</span>
                  <span className="value">
                    {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">{t("invoices.payment_method")}:</span>
                  <span className="value">{selectedInvoice.paymentMethod}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t("invoices.issued_by")}:</span>
                  <span className="value">
                    {selectedInvoice.issuedBy?.name || "N/A"}
                  </span>
                </div>
              </div>

              {(selectedInvoice.items?.length > 0 ||
                selectedInvoice.order?.items?.length > 0) && (
                <div className="invoice-items">
                  <h4>{t("invoices.order_items")}</h4>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>{t("invoices.item_name")}</th>
                        <th>{t("invoices.quantity")}</th>
                        <th>{t("invoices.price")}</th>
                        <th>{t("invoices.total")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedInvoice.items?.length
                        ? selectedInvoice.items
                        : selectedInvoice.order.items
                      ).map((item, index) => {
                        const quantity = item.quantity ?? item.qty ?? 1;
                        return (
                          <tr key={item._id || index}>
                            <td>
                              {item.product?.name ||
                                item.menuItem?.name ||
                                item.name ||
                                "N/A"}
                            </td>
                            <td>{quantity}</td>
                            <td>{formatMoney(item.price, currency)}</td>
                            <td>
                              {formatMoney(
                                item.total ?? quantity * (item.price || 0),
                                currency,
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="invoice-summary">
                <div className="summary-row">
                  <span>{t("invoices.subtotal")}:</span>
                  <span>{formatMoney(selectedInvoice.subTotal, currency)}</span>
                </div>
                <div className="summary-row">
                  <span>
                    {t("invoices.tax")} ({selectedInvoice.taxPercent || 0}%):
                  </span>
                  <span>
                    {formatMoney(
                      (selectedInvoice.subTotal || 0) *
                        ((selectedInvoice.taxPercent || 0) / 100),
                      currency,
                    )}
                  </span>
                </div>
                <div className="summary-row total">
                  <span>{t("invoices.total_amount")}:</span>
                  <span>
                    {formatMoney(
                      selectedInvoice.grandTotal ??
                        calculateInvoiceTotal(selectedInvoice),
                      currency,
                    )}
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => handleGeneratePDF(selectedInvoice._id)}
                  className="btn-primary"
                >
                  <Printer size={16} />
                  {t("invoices.print_pdf")}
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn-secondary"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
