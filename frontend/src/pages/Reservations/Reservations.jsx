import React, { useState, useEffect } from "react";
import "./Reservations.css";
import { useTranslation } from "react-i18next";
import { useRestaurant } from "@hooks/useRestaurant";
import { useAuth } from "@hooks/useAuth";
import { RoleBasedUI } from "@utils/roleUtils";
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Save,
  Filter,
  User,
  FileText,
  UserPlus,
} from "lucide-react";
import reservationService from "@services/reservationService";
import tableService from "@services/tableService";
import customerService from "@services/customerService";
import CustomerModal from "@components/CustomerModal";

const Reservations = () => {
  const { t, i18n } = useTranslation();
  const { getThemeColors } = useRestaurant();
  const { user } = useAuth();

  // Get theme colors for dynamic styling
  const themeColors = getThemeColors();
  const primaryColor = themeColors.primary || "#f59e0b";

  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state for add/edit
  const [formData, setFormData] = useState({
    table: "", // Optional for guest requests
    reservedAt: "",
    numberOfGuests: "",
    name: "", // Guest name (required for guest requests)
    phone: "", // Guest phone (required for guest requests - used for customer identification)
    email: "", // Guest email (optional)
    notes: "",
  });

  // Toggle between admin reservation and guest request
  const [isGuestRequest, setIsGuestRequest] = useState(false);

  // For admin mode - customer search by phone
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    fetchReservations();
    fetchTables();
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

  // Search customers by phone number
  const searchCustomersByPhone = async (phone) => {
    if (!phone || phone.length < 3) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    try {
      setSearchingCustomers(true);
      const response = await customerService.search(phone);
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
    searchCustomersByPhone(value);
  };

  // Select customer from search results
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.phone);
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  // Clear customer selection
  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  // Create new customer from guest request
  const createCustomerFromGuest = async () => {
    if (!formData.name || !formData.phone) {
      setMessage({
        type: "error",
        text: "Name and phone are required to create a customer",
      });
      return null;
    }

    try {
      const customerData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || "",
        address: "",
      };

      const response = await customerService.create(customerData);
      return response.data || response;
    } catch (error) {
      console.error("Error creating customer:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create customer",
      });
      return null;
    }
  };

  // Handle customer creation success from modal
  const handleCustomerCreated = (newCustomer) => {
    setSelectedCustomer(newCustomer);
    setCustomerSearch(newCustomer.phone);
    setShowCustomerModal(false);
    setMessage({
      type: "success",
      text: "Customer created and selected successfully!",
    });
  };

  // Open customer modal with initial data
  const openCustomerModal = () => {
    setShowCustomerModal(true);
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationService.getAll();
      setReservations(response.data || response);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch reservations",
      });
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedReservation) {
        // Update reservation status and table assignment
        const updateData = {
          status: formData.status || selectedReservation.status,
          table: formData.table || selectedReservation.table,
          notes: formData.notes || selectedReservation.notes,
        };

        // Ensure table is assigned when confirming
        if (updateData.status === "confirmed" && !updateData.table) {
          setMessage({
            type: "error",
            text: "Table must be assigned when confirming reservation",
          });
          return;
        }

        await reservationService.update(selectedReservation._id, updateData);
        setMessage({
          type: "success",
          text: "Reservation updated successfully!",
        });
      } else {
        // Create new reservation or guest request
        if (isGuestRequest) {
          // Check if customer exists, if not create one
          let customer = selectedCustomer;
          if (!customer && formData.phone) {
            // Search for existing customer first
            try {
              const searchResults = await customerService.search(
                formData.phone,
              );
              const existingCustomer = searchResults.data?.find(
                (c) => c.phone === formData.phone,
              );
              if (existingCustomer) {
                customer = existingCustomer;
              } else {
                // Create new customer
                customer = await createCustomerFromGuest();
              }
            } catch (error) {
              // If search fails, try to create customer directly
              customer = await createCustomerFromGuest();
            }
          }

          // Submit guest request with customer ID if available
          const guestRequestData = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email, // Optional
            table: formData.table, // Optional
            reservedAt: formData.reservedAt,
            numberOfGuests: formData.numberOfGuests,
            notes: formData.notes, // Optional
            customer: customer?._id, // Link to customer if created/found
          };
          await reservationService.createGuestRequest(guestRequestData);
          setMessage({
            type: "success",
            text: customer
              ? "Customer created and reservation request submitted successfully!"
              : "Reservation request submitted successfully!",
          });
        } else {
          // Create admin reservation
          const adminReservationData = {
            customer: selectedCustomer?._id || customerSearch, // Customer ID from search or manual input
            table: formData.table,
            reservedAt: formData.reservedAt,
            numberOfGuests: formData.numberOfGuests,
            notes: formData.notes,
          };
          await reservationService.create(adminReservationData);
          setMessage({
            type: "success",
            text: "Reservation created successfully!",
          });
        }
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchReservations();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Operation failed",
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this reservation?")) {
      try {
        await reservationService.delete(id);
        setMessage({
          type: "success",
          text: "Reservation deleted successfully!",
        });
        fetchReservations();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Delete failed",
        });
      }
    }
  };

  const handleEdit = (reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      table: reservation.table || "",
      reservedAt: new Date(reservation.reservedAt).toISOString().slice(0, 16),
      numberOfGuests: reservation.numberOfGuests,
      name: reservation.name || "",
      phone: reservation.phone || "",
      email: reservation.email || "",
      notes: reservation.notes || "",
      status: reservation.status || "pending",
    });

    // Set customer for admin mode
    if (reservation.customer) {
      setSelectedCustomer(reservation.customer);
      setCustomerSearch(reservation.customer._id || reservation.customer);
    }

    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      table: "", // Optional for guest requests
      reservedAt: "",
      numberOfGuests: "",
      name: "", // Guest name
      phone: "", // Guest phone
      email: "", // Guest email (optional)
      notes: "",
      status: "pending",
    });
    setSelectedReservation(null);
    setIsGuestRequest(false);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      (reservation.customer &&
        typeof reservation.customer === "string" &&
        reservation.customer
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (reservation.name &&
        typeof reservation.name === "string" &&
        reservation.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reservation.notes &&
        typeof reservation.notes === "string" &&
        reservation.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filterStatus === "all" || reservation.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const pendingReservationsCount = reservations.filter(
    (r) => r.status === "pending",
  ).length;
  const confirmedReservationsCount = reservations.filter(
    (r) => r.status === "confirmed",
  ).length;
  const cancelledReservationsCount = reservations.filter(
    (r) => r.status === "cancelled",
  ).length;
  const completedReservationsCount = reservations.filter(
    (r) => r.status === "completed",
  ).length;

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "confirmed":
        return <CheckCircle size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
      case "completed":
        return <CheckCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "var(--warning)";
      case "confirmed":
        return "var(--success)";
      case "cancelled":
        return "var(--danger)";
      case "completed":
        return "var(--primary)";
      default:
        return "var(--text-muted)";
    }
  };

  const getTableName = (table) => {
    return table ? table.number : "Unknown";
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  return (
    <div className="reservations-page" data-direction={i18n.dir()}>
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Calendar size={28} />
            {t("reservations.reservations")}
          </h1>
          <p>{t("reservations.manage_description")}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary"
        >
          <RoleBasedUI user={user} allowedRoles={["admin", "manager"]}>
            <Plus size={20} />
            {t("reservations.add_new")}
          </RoleBasedUI>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar />
          </div>
          <div className="stat-content">
            <h3>{reservations.length}</h3>
            <p>{t("reservations.total_reservations")}</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-content">
            <h3>{pendingReservationsCount}</h3>
            <p>{t("reservations.pending_reservations")}</p>
          </div>
        </div>
        <div className="stat-card confirmed">
          <div className="stat-icon">
            <CheckCircle />
          </div>
          <div className="stat-content">
            <h3>{confirmedReservationsCount}</h3>
            <p>{t("reservations.confirmed_reservations")}</p>
          </div>
        </div>
        <div className="stat-card cancelled">
          <div className="stat-icon">
            <XCircle />
          </div>
          <div className="stat-content">
            <h3>{cancelledReservationsCount}</h3>
            <p>{t("reservations.cancelled_reservations")}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder={t("reservations.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            {t("reservations.filter_all")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            {t("reservations.filter_pending")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "confirmed" ? "active" : ""}`}
            onClick={() => setFilterStatus("confirmed")}
          >
            {t("reservations.filter_confirmed")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "cancelled" ? "active" : ""}`}
            onClick={() => setFilterStatus("cancelled")}
          >
            {t("reservations.filter_cancelled")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "completed" ? "active" : ""}`}
            onClick={() => setFilterStatus("completed")}
          >
            {t("reservations.filter_completed")}
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Reservations Table */}
      <div className="reservations-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t("common.loading")}</p>
          </div>
        ) : (
          <div className="reservations-table-container">
            {filteredReservations.length === 0 ? (
              <div className="no-data">
                <Calendar size={48} />
                <h3>{t("reservations.no_found")}</h3>
                <p>{t("reservations.no_description")}</p>
              </div>
            ) : (
              <table className="reservations-table">
                <thead>
                  <tr>
                    <th data-direction={i18n.dir()}>
                      {t("reservations.customer")}
                    </th>
                    <th data-direction={i18n.dir()}>
                      {t("reservations.table")}
                    </th>
                    <th data-direction={i18n.dir()}>
                      {t("reservations.date_time")}
                    </th>
                    <th data-direction={i18n.dir()}>
                      {t("reservations.guests")}
                    </th>
                    <th data-direction={i18n.dir()}>
                      {t("reservations.duration")}
                    </th>
                    <th data-direction={i18n.dir()}>
                      {t("reservations.status")}
                    </th>
                    <th data-direction={i18n.dir()}>
                      {t("reservations.notes")}
                    </th>
                    <th data-direction={i18n.dir()}>
                      {t("reservations.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation._id}>
                      <td data-direction={i18n.dir()}>
                        <div className="customer-info">
                          <User size={16} />
                          <span>
                            {reservation.name ||
                              (typeof reservation.customer === "string"
                                ? reservation.customer
                                : reservation.customer?.name ||
                                  "Unknown Customer")}
                          </span>
                        </div>
                      </td>
                      <td data-direction={i18n.dir()}>
                        <div
                          className="table-info"
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <MapPin size={16} />
                          <span>{getTableName(reservation.table)}</span>
                        </div>
                      </td>
                      <td data-direction={i18n.dir()}>
                        <div className="datetime-info">
                          <Clock size={16} />
                          <span>{formatDateTime(reservation.reservedAt)}</span>
                        </div>
                      </td>
                      <td data-direction={i18n.dir()}>
                        <div className="guests-info">
                          <Users size={16} />
                          <span>{reservation.numberOfGuests}</span>
                        </div>
                      </td>
                      <td data-direction={i18n.dir()}>
                        <div className="duration-info">
                          <Clock size={16} />
                          <span>{reservation.durationMinutes} min</span>
                        </div>
                      </td>
                      <td data-direction={i18n.dir()}>
                        <span
                          className={`status-badge ${reservation.status}`}
                          style={{ color: getStatusColor(reservation.status) }}
                        >
                          {getStatusIcon(reservation.status)}
                          {t(`reservations.status_${reservation.status}`)}
                        </span>
                      </td>
                      <td data-direction={i18n.dir()}>
                        <div className="notes-info">
                          {reservation.notes ? (
                            <>
                              <FileText size={16} />
                              <span>{reservation.notes}</span>
                            </>
                          ) : (
                            <span className="no-notes">-</span>
                          )}
                        </div>
                      </td>
                      <td data-direction={i18n.dir()}>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(reservation)}
                            className="btn-icon btn-edit"
                            title={t("common.edit")}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(reservation._id)}
                            className="btn-icon btn-delete"
                            title={t("common.delete")}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal" data-direction={i18n.dir()}>
            <div className="modal-header">
              <h2>
                {showEditModal ? (
                  <>
                    <Edit size={20} />
                    {t("reservations.edit_reservation")}
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    {isGuestRequest
                      ? t("reservations.guest_request")
                      : t("reservations.add_new_reservation")}
                  </>
                )}
              </h2>
              <div className="modal-header-actions">
                {!showEditModal && (
                  <div className="request-type-toggle">
                    <button
                      type="button"
                      className={`toggle-btn ${!isGuestRequest ? "active" : ""}`}
                      onClick={() => setIsGuestRequest(false)}
                    >
                      {t("reservations.admin_reservation")}
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${isGuestRequest ? "active" : ""}`}
                      onClick={() => setIsGuestRequest(true)}
                    >
                      {t("reservations.guest_request")}
                    </button>
                  </div>
                )}
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
            </div>

            <form onSubmit={handleSubmit} className="reservation-form">
              <div className="form-grid">
                {isGuestRequest ? (
                  // Guest Request Fields (Public Access)
                  <>
                    <div className="form-group">
                      <label>{t("reservations.guest_name")} *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        placeholder={t("reservations.guest_name_placeholder")}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t("reservations.guest_phone")} *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        required
                        placeholder={t("reservations.guest_phone_placeholder")}
                      />
                      <small className="form-help">
                        {t("reservations.phone_help")}
                      </small>
                    </div>

                    <div className="form-group">
                      <label>{t("reservations.guest_email")}</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder={t("reservations.guest_email_placeholder")}
                      />
                      <small className="form-help">
                        {t("reservations.email_help")}
                      </small>
                    </div>
                  </>
                ) : (
                  // Admin Reservation Fields (Protected)
                  <div className="form-group">
                    <label>{t("reservations.customer_phone")} *</label>
                    <div className="customer-search-container">
                      <div className="search-input-wrapper">
                        <input
                          type="tel"
                          value={customerSearch}
                          onChange={(e) => handleCustomerSearch(e.target.value)}
                          required
                          placeholder={t(
                            "reservations.customer_phone_placeholder",
                          )}
                          className={
                            selectedCustomer ? "customer-selected" : ""
                          }
                        />
                        {selectedCustomer && (
                          <button
                            type="button"
                            onClick={clearCustomerSelection}
                            className="clear-customer-btn"
                            title={t("reservations.clear_customer")}
                          >
                            <X size={16} />
                          </button>
                        )}
                        {searchingCustomers && (
                          <div className="search-spinner">
                            <div className="spinner-small"></div>
                          </div>
                        )}
                      </div>

                      {showCustomerDropdown && (
                        <div className="customer-dropdown">
                          {customerSearchResults.map((customer) => (
                            <div
                              key={customer.phone}
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
                          ))}
                        </div>
                      )}

                      {customerSearchResults.length === 0 &&
                        customerSearch.length >= 3 &&
                        !searchingCustomers && (
                          <div
                            className="customer-option create-customer-option"
                            onClick={openCustomerModal}
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

                      {selectedCustomer && (
                        <div className="selected-customer-info">
                          <div className="customer-details">
                            <strong>{selectedCustomer.name}</strong>
                            <span>{selectedCustomer.phone}</span>
                            {selectedCustomer.email && (
                              <span>{selectedCustomer.email}</span>
                            )}
                          </div>
                        </div>
                      )}

                      <small className="form-help">
                        {t("reservations.customer_phone_help")}
                      </small>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>{t("reservations.table")}</label>
                  <select
                    value={formData.table}
                    onChange={(e) =>
                      setFormData({ ...formData, table: e.target.value })
                    }
                  >
                    <option value="">
                      {isGuestRequest
                        ? t("reservations.table_optional")
                        : t("reservations.select_table")}
                    </option>
                    {tables.map((table) => (
                      <option key={table._id} value={table._id}>
                        {table.number} ({table.seats} seats)
                      </option>
                    ))}
                  </select>
                  <small className="form-help">
                    {isGuestRequest
                      ? t("reservations.table_help_guest")
                      : t("reservations.table_help_admin")}
                  </small>
                </div>

                <div className="form-group">
                  <label>{t("reservations.date_time")} *</label>
                  <input
                    type="datetime-local"
                    value={formData.reservedAt}
                    onChange={(e) =>
                      setFormData({ ...formData, reservedAt: e.target.value })
                    }
                    required
                    min={new Date().toISOString().slice(0, 16)} // Prevent past dates
                  />
                  <small className="form-help">
                    {t("reservations.datetime_help")}
                  </small>
                </div>

                <div className="form-group">
                  <label>{t("reservations.guests")} *</label>
                  <input
                    type="number"
                    value={formData.numberOfGuests}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numberOfGuests: e.target.value,
                      })
                    }
                    required
                    min="1"
                    max="20"
                  />
                  <small className="form-help">
                    {t("reservations.guests_help")}
                  </small>
                </div>

                {selectedReservation && (
                  <div className="form-group">
                    <label>{t("reservations.status")}</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="pending">
                        {t("reservations.status_pending")}
                      </option>
                      <option value="confirmed">
                        {t("reservations.status_confirmed")}
                      </option>
                      <option value="cancelled">
                        {t("reservations.status_cancelled")}
                      </option>
                      <option value="completed">
                        {t("reservations.status_completed")}
                      </option>
                    </select>
                  </div>
                )}

                <div className="form-group full-width">
                  <label>{t("reservations.notes")}</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder={t("reservations.notes_placeholder")}
                    rows={3}
                  />
                  <small className="form-help">
                    {t("reservations.notes_help")}
                  </small>
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
                  {showEditModal ? (
                    <>
                      <Save size={16} />
                      {t("common.update")}
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      {t("common.create")}
                    </>
                  )}
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
          name: formData.name,
          email: formData.email,
        }}
      />
    </div>
  );
};

export default Reservations;
