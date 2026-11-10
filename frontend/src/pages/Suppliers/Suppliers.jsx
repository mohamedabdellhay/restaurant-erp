import React, { useState, useEffect } from "react";
import "./Suppliers.css";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  Download,
  Filter,
} from "lucide-react";
import supplierService from "@services/supplierService";

const Suppliers = () => {
  const { t, i18n } = useTranslation();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [statementData, setStatementData] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterPaymentTerms, setFilterPaymentTerms] = useState("all");

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    paymentTerms: "cash",
  });

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amount: "",
    description: "",
  });

  useEffect(() => {
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

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getAll();
      setSuppliers(response.data || response);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch suppliers",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        console.log("Updating supplier:", selectedSupplier._id, formData);
        // Update supplier
        console.log("form data", formData);

        await supplierService.update(selectedSupplier._id, formData);
        setMessage({ type: "success", text: "Supplier updated successfully!" });
      } else {
        // Create new supplier
        await supplierService.create(formData);
        setMessage({ type: "success", text: "Supplier created successfully!" });
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Operation failed",
      });
    }
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      paymentTerms: supplier.paymentTerms || "cash",
    });
    setShowEditModal(true);
  };

  const handleDelete = async (supplierId) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await supplierService.delete(supplierId);
        setMessage({ type: "success", text: "Supplier deleted successfully!" });
        fetchSuppliers();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to delete supplier",
        });
      }
    }
  };

  const handleViewStatement = async (supplier) => {
    try {
      const response = await supplierService.getStatement(supplier._id);
      setStatementData(response.data.transactions || response);
      setSelectedSupplier(supplier);
      setShowStatementModal(true);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch statement",
      });
    }
  };

  const handleRecordPayment = (supplier) => {
    setSelectedSupplier(supplier);
    setPaymentData({ amount: "", description: "" });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await supplierService.recordPayment(selectedSupplier._id, paymentData);
      setMessage({ type: "success", text: "Payment recorded successfully!" });
      setShowPaymentModal(false);
      resetPaymentForm();
      fetchSuppliers();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to record payment",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      paymentTerms: "cash",
    });
    setSelectedSupplier(null);
  };

  const resetPaymentForm = () => {
    setPaymentData({ amount: "", description: "" });
    setSelectedSupplier(null);
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.includes(searchTerm) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterPaymentTerms === "all" ||
      supplier.paymentTerms === filterPaymentTerms;

    return matchesSearch && matchesFilter;
  });

  const getPaymentTermsColor = (terms) => {
    switch (terms) {
      case "cash":
        return "var(--success)";
      case "credit":
        return "var(--primary)";
      case "installment":
        return "var(--warning)";
      default:
        return "var(--text-muted)";
    }
  };

  const getPaymentTermsLabel = (terms) => {
    switch (terms) {
      case "cash":
        return t("suppliers.payment_cash") || "Cash";
      case "credit":
        return t("suppliers.payment_credit") || "Credit";
      case "installment":
        return t("suppliers.payment_installment") || "Installment";
      default:
        return terms;
    }
  };

  return (
    <div className="suppliers-page" data-direction={i18n.dir()}>
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Users size={28} />
            {t("nav.suppliers") || "Suppliers Management"}
          </h1>
          <p>
            {t("suppliers.manage_description") ||
              "Manage your suppliers and track payments"}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={20} />
          {t("suppliers.add_new") || "Add Supplier"}
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{suppliers.length}</h3>
            <p>{t("suppliers.total_suppliers") || "Total Suppliers"}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>{suppliers.filter((s) => s.paymentTerms === "cash").length}</h3>
            <p>{t("suppliers.cash_suppliers") || "Cash Suppliers"}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <h3>
              {suppliers.filter((s) => s.paymentTerms === "credit").length}
            </h3>
            <p>{t("suppliers.credit_suppliers") || "Credit Suppliers"}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder={
              t("suppliers.search_placeholder") || "Search suppliers..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterPaymentTerms}
          onChange={(e) => setFilterPaymentTerms(e.target.value)}
          className="filter-select"
        >
          <option value="all">
            {t("suppliers.filter_all") || "All Payment Terms"}
          </option>
          <option value="cash">{t("suppliers.payment_cash") || "Cash"}</option>
          <option value="credit">
            {t("suppliers.payment_credit") || "Credit"}
          </option>
          <option value="installment">
            {t("suppliers.payment_installment") || "Installment"}
          </option>
        </select>
      </div>

      {/* Suppliers Table */}
      <div className="suppliers-table">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th data-direction={i18n.dir()}>
                  {t("suppliers.name") || "Name"}
                </th>
                <th data-direction={i18n.dir()}>
                  {t("suppliers.phone") || "Phone"}
                </th>
                <th data-direction={i18n.dir()}>
                  {t("suppliers.email") || "Email"}
                </th>
                <th data-direction={i18n.dir()}>
                  {t("suppliers.payment_terms") || "Payment Terms"}
                </th>
                <th data-direction={i18n.dir()}>
                  {t("suppliers.balance") || "Balance"}
                </th>
                <th data-direction={i18n.dir()}>
                  {t("suppliers.actions") || "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    {t("common.loading") || "Loading..."}
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    {t("suppliers.no_suppliers_found") || "No suppliers found"}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td data-direction={i18n.dir()}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: getPaymentTermsColor(
                              supplier.paymentTerms,
                            ),
                          }}
                        ></div>
                        {supplier.name}
                      </div>
                    </td>
                    <td data-direction={i18n.dir()}>{supplier.phone || "-"}</td>
                    <td data-direction={i18n.dir()}>{supplier.email || "-"}</td>
                    <td data-direction={i18n.dir()}>
                      <span
                        className="payment-terms-badge"
                        style={{
                          backgroundColor: getPaymentTermsColor(
                            supplier.paymentTerms,
                          ),
                        }}
                      >
                        {getPaymentTermsLabel(supplier.paymentTerms)}
                      </span>
                    </td>
                    <td
                      data-direction={i18n.dir()}
                      className={
                        supplier.balance >= 0
                          ? "balance-positive"
                          : "balance-negative"
                      }
                    >
                      ${Math.abs(supplier.balance || 0).toFixed(2)}
                    </td>
                    <td data-direction={i18n.dir()}>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleViewStatement(supplier)}
                          className="btn-icon btn-view"
                          title={
                            t("suppliers.view_statement") || "View Statement"
                          }
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleRecordPayment(supplier)}
                          className="btn-icon btn-edit"
                          title={
                            t("suppliers.record_payment") || "Record Payment"
                          }
                        >
                          <DollarSign size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="btn-icon btn-edit"
                          title={t("common.edit") || "Edit"}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier._id)}
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

      {/* Add/Edit Supplier Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {selectedSupplier
                  ? t("suppliers.edit_supplier") || "Edit Supplier"
                  : t("suppliers.add_new_supplier") || "Add New Supplier"}
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
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t("suppliers.name") || "Supplier Name"} *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={
                      t("suppliers.name_placeholder") || "Enter supplier name"
                    }
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("suppliers.phone") || "Phone Number"}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder={
                      t("suppliers.phone_placeholder") || "Enter phone number"
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>{t("suppliers.email") || "Email Address"}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder={
                      t("suppliers.email_placeholder") || "Enter email address"
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>
                    {t("suppliers.payment_terms") || "Payment Terms"} *
                  </label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentTerms: e.target.value })
                    }
                    className="form-select"
                    required
                  >
                    <option value="cash">
                      {t("suppliers.payment_cash") || "Cash"}
                    </option>
                    <option value="credit">
                      {t("suppliers.payment_credit") || "Credit"}
                    </option>
                    <option value="installment">
                      {t("suppliers.payment_installment") || "Installment"}
                    </option>
                  </select>
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
                  {selectedSupplier
                    ? t("common.update") || "Update"
                    : t("common.create") || "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {showStatementModal && selectedSupplier && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {t("suppliers.account_statement") || "Account Statement"} -{" "}
                {selectedSupplier.name}
              </h2>
              <button
                onClick={() => {
                  setShowStatementModal(false);
                  setSelectedSupplier(null);
                }}
                className="btn-close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="statement-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t("suppliers.date") || "Date"}</th>
                      <th>{t("suppliers.description") || "Description"}</th>
                      <th>{t("suppliers.type") || "Type"}</th>
                      <th>{t("suppliers.amount") || "Amount"}</th>
                      <th>{t("suppliers.balance") || "Balance"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementData.map((transaction, index) => (
                      <tr key={index}>
                        <td>
                          {new Date(transaction.createdAt).toLocaleDateString(
                            "en-GB",
                          )}
                        </td>
                        <td>{transaction.description}</td>
                        <td>{transaction.type}</td>
                        <td
                          className={
                            transaction.type === "payment"
                              ? "balance-positive"
                              : "balance-negative"
                          }
                        >
                          ${transaction.amount.toFixed(2)}
                        </td>
                        <td
                          className={
                            transaction.amount >= 0
                              ? "balance-positive"
                              : "balance-negative"
                          }
                        >
                          ${transaction.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedSupplier && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {t("suppliers.record_payment") || "Record Payment"} -{" "}
                {selectedSupplier.name}
              </h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  resetPaymentForm();
                }}
                className="btn-close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>
                    {t("suppliers.payment_amount") || "Payment Amount"} *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amount: e.target.value })
                    }
                    placeholder={
                      t("suppliers.payment_amount_placeholder") ||
                      "Enter amount"
                    }
                    className="form-input"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    {t("suppliers.payment_description") || "Description"}
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={paymentData.description}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        description: e.target.value,
                      })
                    }
                    placeholder={
                      t("suppliers.payment_description_placeholder") ||
                      "Enter description"
                    }
                    className="form-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetPaymentForm();
                  }}
                  className="btn-secondary"
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                <button type="submit" className="btn-primary">
                  <DollarSign size={16} />
                  {t("suppliers.record_payment") || "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
