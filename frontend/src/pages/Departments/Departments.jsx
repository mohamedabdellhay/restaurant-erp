import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@hooks/useAuth";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Building,
  Users,
  Shield,
  X,
  Check,
} from "lucide-react";
import departmentService from "@services/departmentService";
import { hasPermission, PERMISSIONS } from "@utils/permissionUtils";
import PageHeader from "@components/PageHeader";
import "./Departments.css";

const Departments = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Permission checks
  const canViewDepartments = hasPermission(user, PERMISSIONS.VIEW_DEPARTMENTS);
  const canManageDepartments = hasPermission(
    user,
    PERMISSIONS.MANAGE_DEPARTMENTS,
  );

  // Temporary workaround: Grant Admin users department access
  const isAdmin = user?.role?.name?.toLowerCase() === "admin";
  const canViewDepartmentsFixed = canViewDepartments || isAdmin;
  const canManageDepartmentsFixed = canManageDepartments || isAdmin;

  // Debug logging
  console.log("Departments Debug Info:", {
    user,
    userRole: user?.role,
    userPermissions: user?.role?.permissions,
    canViewDepartments: canViewDepartmentsFixed,
    canManageDepartments: canManageDepartmentsFixed,
    isAdmin,
    VIEW_DEPARTMENTS: PERMISSIONS.VIEW_DEPARTMENTS,
    MANAGE_DEPARTMENTS: PERMISSIONS.MANAGE_DEPARTMENTS,
  });

  useEffect(() => {
    if (canViewDepartmentsFixed) {
      fetchDepartments();
    }
  }, [canViewDepartmentsFixed]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getAll();
      // Handle the actual API response structure
      setDepartments(response.data || response);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch departments",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedDepartment) {
        // Update department
        await departmentService.update(selectedDepartment._id, formData);
        setMessage({
          type: "success",
          text: "Department updated successfully!",
        });
      } else {
        // Create new department
        await departmentService.create(formData);
        setMessage({
          type: "success",
          text: "Department created successfully!",
        });
      }
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchDepartments();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save department",
      });
    }
  };

  const handleEdit = async (department) => {
    try {
      setModalLoading(true);
      setShowEditModal(true);

      setSelectedDepartment(department);
      setFormData({
        name: department.name || "",
        description: department.description || "",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || "Failed to fetch department details",
      });
      setShowEditModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await departmentService.delete(id);
        setMessage({
          type: "success",
          text: "Department deleted successfully!",
        });
        fetchDepartments();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to delete department",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setSelectedDepartment(null);
  };

  const filteredDepartments = departments.filter((department) => {
    const matchesSearch =
      department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (department.description &&
        department.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Debug logging
  console.log("Departments Debug Info:", {
    user,
    userRole: user?.role,
    userPermissions: user?.role?.permissions,
    canViewDepartments,
    canManageDepartments,
    VIEW_DEPARTMENTS: PERMISSIONS.VIEW_DEPARTMENTS,
    MANAGE_DEPARTMENTS: PERMISSIONS.MANAGE_DEPARTMENTS,
  });

  // Access denied view - but let's show the page anyway for debugging
  const showAccessDenied = !canViewDepartmentsFixed;

  if (showAccessDenied) {
    return (
      <div className="access-denied">
        <Shield size={48} />
        <h2>{t("common.access_denied")}</h2>
        <p>{t("departments.no_permission")}</p>

        {/* Debug info for development */}
        {import.meta.env.DEV && (
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              background: "#f5f5f5",
              borderRadius: "4px",
            }}
          >
            <h4>Debug Information:</h4>
            <p>
              <strong>User:</strong> {JSON.stringify(user, null, 2)}
            </p>
            <p>
              <strong>Role:</strong> {JSON.stringify(user?.role, null, 2)}
            </p>
            <p>
              <strong>Permissions:</strong>{" "}
              {JSON.stringify(user?.role?.permissions, null, 2)}
            </p>
            <p>
              <strong>Can View Departments:</strong>{" "}
              {canViewDepartmentsFixed ? "YES" : "NO"}
            </p>
            <p>
              <strong>Can Manage Departments:</strong>{" "}
              {canManageDepartmentsFixed ? "YES" : "NO"}
            </p>
            <p>
              <strong>Is Admin:</strong> {isAdmin ? "YES" : "NO"}
            </p>
            <p>
              <strong>Permission Check:</strong>{" "}
              {hasPermission(user, PERMISSIONS.VIEW_DEPARTMENTS)
                ? "PASS"
                : "FAIL"}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={Building}
        title={t("departments.title")}
        subtitle={t("departments.subtitle")}
      >
        {canManageDepartmentsFixed && (
          <button
            onClick={() => {
              setShowAddModal(true);
              resetForm();
            }}
            className="btn-primary"
          >
            <Plus size={20} />
            {t("departments.add_department")}
          </button>
        )}
      </PageHeader>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Building />
          </div>
          <div className="stat-content">
            <h3>{departments.length}</h3>
            <p>{t("departments.total_departments")}</p>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon">
            <Check />
          </div>
          <div className="stat-content">
            <h3>{departments.filter((d) => d.isActive !== false).length}</h3>
            <p>{t("departments.active_departments")}</p>
          </div>
        </div>
        <div className="stat-card inactive">
          <div className="stat-icon">
            <X />
          </div>
          <div className="stat-content">
            <h3>{departments.filter((d) => d.isActive === false).length}</h3>
            <p>{t("departments.inactive_departments")}</p>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Search and Filter */}
      <div className="search-filter-container">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder={t("departments.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Departments Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t("common.loading")}</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="no-data">
            <Building size={48} />
            <h3>{t("departments.no_departments")}</h3>
            <p>{t("departments.no_departments_desc")}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("departments.name")}</th>
                  <th>{t("departments.description")}</th>
                  <th>{t("departments.staff_count")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((department) => (
                  <tr key={department._id}>
                    <td>{department.name}</td>
                    <td>{department.description || "-"}</td>
                    <td>
                      <div className="staff-count">
                        <Users size={16} />
                        {department.staffCount || 0}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {canManageDepartmentsFixed && (
                          <>
                            <button
                              onClick={() => handleEdit(department)}
                              className="btn-icon btn-edit-department"
                              title={t("common.edit")}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(department._id)}
                              className="btn-icon btn-delete-department"
                              title={t("common.delete")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {selectedDepartment
                  ? t("departments.edit_department")
                  : t("departments.add_department")}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="btn-close"
              >
                <X size={24} />
              </button>
            </div>

            {modalLoading ? (
              <div className="modal-loading">{t("common.loading")}</div>
            ) : (
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>{t("departments.name")} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder={t("departments.name_placeholder")}
                  />
                </div>

                <div className="form-group">
                  <label>{t("departments.description")}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={t("departments.description_placeholder")}
                    rows="4"
                  />
                </div>

                <div className="modal-actions">
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
                    {selectedDepartment ? (
                      <>
                        <Check size={16} />
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
