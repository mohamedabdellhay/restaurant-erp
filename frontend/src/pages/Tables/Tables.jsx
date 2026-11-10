import React, { useState, useEffect } from "react";
import "./Tables.css";
import { useTranslation } from "react-i18next";
// import { useRestaurant } from "@hooks/useRestaurant";
import {
  SquareMenu,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Save,
  Filter,
} from "lucide-react";
import tableService from "@services/tableService";

const Tables = () => {
  const { t, i18n } = useTranslation();
  // const { getThemeColors } = useRestaurant();

  // Get theme colors for dynamic styling
  // const themeColors = getThemeColors();
  // const primaryColor = themeColors.primary || "#f59e0b";
  // const secondaryColor = themeColors.secondary || "#6366f1";
  // const accentColor = themeColors.accent || "#10b981";

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterStatus, setFilterStatus] = useState("all");
  const user = JSON.parse(localStorage.getItem("user"));
  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    number: "",
    seats: "",
    status: "available",
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await tableService.getAll();
      setTables(response.data || response);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch tables",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTable) {
        // Update table
        await tableService.update(selectedTable._id, formData);
        setMessage({ type: "success", text: "Table updated successfully!" });
      } else {
        // Create new table
        await tableService.create(formData);
        setMessage({ type: "success", text: "Table created successfully!" });
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchTables();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Operation failed",
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      try {
        await tableService.delete(id);
        setMessage({ type: "success", text: "Table deleted successfully!" });
        fetchTables();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Delete failed",
        });
      }
    }
  };

  const handleEdit = (table) => {
    setSelectedTable(table);
    setFormData({
      number: table.number,
      seats: table.seats,
      status: table.status,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      number: "",
      seats: "",
      status: "available",
    });
    setSelectedTable(null);
  };

  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.number
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || table.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const availableTablesCount = tables.filter(
    (table) => table.status === "available",
  ).length;

  const occupiedTablesCount = tables.filter(
    (table) => table.status === "occupied",
  ).length;

  const reservedTablesCount = tables.filter(
    (table) => table.status === "reserved",
  ).length;

  // const maintenanceTablesCount = tables.filter(
  //   (table) => table.status === "maintenance",
  // ).length;

  const getStatusIcon = (status) => {
    switch (status) {
      case "available":
        return <CheckCircle size={16} />;
      case "occupied":
        return <Users size={16} />;
      case "reserved":
        return <Clock size={16} />;
      case "maintenance":
        return <AlertCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  // const getStatusColor = (status) => {
  //   switch (status) {
  //     case "available":
  //       return "var(--success)";
  //     case "occupied":
  //       return "var(--primary)";
  //     case "reserved":
  //       return "var(--warning)";
  //     case "maintenance":
  //       return "var(--danger)";
  //     default:
  //       return "var(--text-muted)";
  //   }
  // };

  return (
    <div className="tables-page" data-direction={i18n.dir()}>
      <div className="page-header">
        <div className="header-content">
          <h1>
            <SquareMenu size={28} />
            {t("nav.tables")}
          </h1>
          <p>{t("table.tables_manage_description")}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary"
        >
          <Plus size={20} />
          {t("table.tables_add_new")}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <SquareMenu />
          </div>
          <div className="stat-content">
            <h3>{tables.length}</h3>
            <p>{t("table.tables_total_tables")}</p>
          </div>
        </div>
        <div className="stat-card available">
          <div className="stat-icon">
            <CheckCircle />
          </div>
          <div className="stat-content">
            <h3>{availableTablesCount}</h3>
            <p>{t("table.tables_available_tables")}</p>
          </div>
        </div>
        <div className="stat-card occupied">
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-content">
            <h3>{occupiedTablesCount}</h3>
            <p>{t("table.tables_occupied_tables")}</p>
          </div>
        </div>
        <div className="stat-card reserved">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-content">
            <h3>{reservedTablesCount}</h3>
            <p>{t("table.tables_reserved_tables")}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder={t("table.tables_search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            {t("table.tables_filter_all")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "available" ? "active" : ""}`}
            onClick={() => setFilterStatus("available")}
          >
            {t("table.tables_filter_available")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "occupied" ? "active" : ""}`}
            onClick={() => setFilterStatus("occupied")}
          >
            {t("table.tables_filter_occupied")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "reserved" ? "active" : ""}`}
            onClick={() => setFilterStatus("reserved")}
          >
            {t("table.tables_filter_reserved")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "maintenance" ? "active" : ""}`}
            onClick={() => setFilterStatus("maintenance")}
          >
            {t("table.tables_filter_maintenance")}
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Tables Grid */}
      <div className="tables-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t("common.loading")}</p>
          </div>
        ) : (
          <div className="tables-grid">
            {filteredTables.length === 0 ? (
              <div className="no-data">
                <SquareMenu size={48} />
                <h3>{t("table.tables_no_tables_found")}</h3>
                <p>{t("table.tables_no_tables_description")}</p>
              </div>
            ) : (
              filteredTables.map((table) => (
                <div key={table._id} className={`table-card ${table.status}`}>
                  <div className="table-header">
                    <div className="table-number">
                      <span className="number">{table.number}</span>
                      <span className="capacity">
                        {table.seats} {t("table.tables_seats")}
                      </span>
                    </div>
                    <div className="table-status">
                      {getStatusIcon(table.status)}
                      <span>{t(`table.tables_status_${table.status}`)}</span>
                    </div>
                  </div>

                  <div className="table-body"></div>

                  {["admin", "manager"].includes(user?.role) && (
                    <div className="table-actions">
                      <button
                        onClick={() => handleEdit(table)}
                        className="btn-icon btn-edit"
                        title={t("common.edit")}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(table._id)}
                        className="btn-icon btn-delete"
                        title={t("common.delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))
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
                    {t("table.tables_edit_table")}
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    {t("table.tables_add_new_table")}
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

            <form onSubmit={handleSubmit} className="table-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t("table.tables_table_number")} *</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                    required
                    placeholder="T1"
                  />
                </div>

                <div className="form-group">
                  <label>{t("table.tables_capacity")} *</label>
                  <input
                    type="number"
                    value={formData.seats}
                    onChange={(e) =>
                      setFormData({ ...formData, seats: e.target.value })
                    }
                    required
                    min="1"
                    max="20"
                  />
                </div>

                <div className="form-group">
                  <label>{t("table.tables_status")} *</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    required
                  >
                    <option value="available">
                      {t("table.tables_status_available")}
                    </option>
                    <option value="occupied">
                      {t("table.tables_status_occupied")}
                    </option>
                    <option value="reserved">
                      {t("table.tables_status_reserved")}
                    </option>
                    <option value="maintenance">
                      {t("table.tables_status_maintenance")}
                    </option>
                  </select>
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
    </div>
  );
};

export default Tables;
