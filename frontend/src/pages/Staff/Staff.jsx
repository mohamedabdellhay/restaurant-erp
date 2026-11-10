import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ProtectedElement,
  ProtectedButton,
} from "@components/ProtectedElement";
import { PERMISSIONS } from "@utils/permissionUtils";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  X,
  Check,
  Filter,
} from "lucide-react";
import staffService from "@services/staffService";
import "./Staff.css";

const Staff = () => {
  const { t, i18n } = useTranslation();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    department: "", // Will be set to first department _id or name
    role: "", // Will be set to first role _id or name
    isActive: true,
  });

  useEffect(() => {
    fetchStaff();
    fetchRoles();
    fetchDepartments();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffService.getAll();
      // Handle the actual API response structure
      setStaff(response.data || response);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch staff",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const roleService = (await import("@services/roleService")).default;
      const response = await roleService.getAll();
      const rolesData = response.data || response || [];
      setRoles(rolesData);

      // Set default role in form if not already set
      if (rolesData.length > 0 && !formData.role) {
        setFormData(prev => ({ ...prev, role: rolesData[0]._id || rolesData[0].name }));
      }
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const departmentService = (await import("@services/departmentService")).default;
      const response = await departmentService.getAll();
      setDepartments(response.data || response || []);
    } catch (error) {
      console.error("Failed to fetch departments", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedStaff) {
        // Update staff
        await staffService.update(selectedStaff._id, formData);
        setMessage({ type: "success", text: "Staff updated successfully!" });
      } else {
        // Create new staff
        await staffService.create(formData);
        setMessage({ type: "success", text: "Staff created successfully!" });
      }
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Operation failed",
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        await staffService.delete(id);
        setMessage({ type: "success", text: "Staff deleted successfully!" });
        fetchStaff();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Delete failed",
        });
      }
    }
  };

  const handleToggleStatus = async (id, status) => {
    try {
      await staffService.toggleStatus(id, status);
      setMessage({ type: "success", text: "Status updated successfully!" });
      fetchStaff();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Status update failed",
      });
    }
  };

  const handleEdit = async (staffMember) => {
    try {
      setModalLoading(true);
      setShowEditModal(true);

      // Fetch fresh staff data from server
      const response = await staffService.getById(staffMember._id);
      const staffData = response.data || response;

      setSelectedStaff(staffData);
      setFormData({
        name: staffData.name || "",
        email: staffData.email || "",
        phone: staffData.phone || "",
        department: staffData.department?._id || staffData.department?.name || staffData.department || "",
        password: "", // Don't show password in edit mode
        role: staffData.role?._id || staffData.role?.name || staffData.role || "",
        isActive: staffData.isActive !== undefined ? staffData.isActive : true,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch staff details",
      });
      setShowEditModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      department: departments.length > 0 ? (departments[0]._id || departments[0].name) : "",
      role: roles.length > 0 ? (roles[0]._id || roles[0].name) : "",
      isActive: true,
    });
    setSelectedStaff(null);
  };

  const filteredStaff = staff.filter((member) => {
    const roleName = member.role?.name || member.role || "";
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roleName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && member.isActive) ||
      (filterStatus === "inactive" && !member.isActive);

    return matchesSearch && matchesFilter;
  });

  const activeStaffCount = staff.filter((member) => member.isActive).length;
  const inactiveStaffCount = staff.filter((member) => !member.isActive).length;

  return (
    <div>
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Users size={28} />
            {t("nav.staff")}
          </h1>
          <p>{t("staff.manage_description")}</p>
        </div>
        <ProtectedButton
          permission={PERMISSIONS.MANAGE_STAFF}
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary"
        >
          <Plus size={20} />
          {t("staff.add_new")}
        </ProtectedButton>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-content">
            <h3>{staff.length}</h3>
            <p>{t("staff.total_staff")}</p>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon">
            <ToggleRight />
          </div>
          <div className="stat-content">
            <h3>{activeStaffCount}</h3>
            <p>{t("staff.active_staff")}</p>
          </div>
        </div>
        <div className="stat-card inactive">
          <div className="stat-icon">
            <ToggleLeft />
          </div>
          <div className="stat-content">
            <h3>{inactiveStaffCount}</h3>
            <p>{t("staff.inactive_staff")}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder={t("staff.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            {t("staff.filter_all")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "active" ? "active" : ""}`}
            onClick={() => setFilterStatus("active")}
          >
            {t("staff.filter_active")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "inactive" ? "active" : ""}`}
            onClick={() => setFilterStatus("inactive")}
          >
            {t("staff.filter_inactive")}
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Staff Table */}
      <div className="staff-table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t("common.loading")}</p>
          </div>
        ) : (
          <table className="staff-table">
            <thead>
              <tr>
                <th data-direction={i18n.dir()}>{t("staff.name")}</th>
                <th data-direction={i18n.dir()}>{t("staff.email")}</th>
                <th data-direction={i18n.dir()}>{t("staff.phone")}</th>
                <th data-direction={i18n.dir()}>{t("staff.role")}</th>
                <th data-direction={i18n.dir()}>{t("staff.status")}</th>
                <th data-direction={i18n.dir()}>{t("staff.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    {t("staff.no_staff_found")}
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member._id}>
                    <td>
                      <div className="staff-name">
                        <div className="avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{member.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <Mail size={16} />
                        {member.email}
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <Phone size={16} />
                        {member.phone || "N/A"}
                      </div>
                    </td>
                    <td>{member.role?.name || member.role || "N/A"}</td>
                    <td>
                      <span
                        className={`status-badge ${member.isActive ? "active" : "inactive"}`}
                      >
                        {member.isActive ? (
                          <ToggleRight size={16} />
                        ) : (
                          <ToggleLeft size={16} />
                        )}
                        {t(
                          `staff.status_${member.isActive ? "active" : "inactive"}`,
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <ProtectedButton
                          permission={PERMISSIONS.MANAGE_STAFF}
                          onClick={() => handleEdit(member)}
                          className="btn-icon btn-edit"
                          title={t("common.edit")}
                        >
                          <Edit size={16} />
                        </ProtectedButton>

                        <ProtectedButton
                          permission={PERMISSIONS.MANAGE_STAFF}
                          onClick={() =>
                            handleToggleStatus(member._id, member.isActive)
                          }
                          className="btn-icon btn-toggle"
                          title={t("staff.toggle_status")}
                        >
                          {member.isActive ? (
                            <ToggleLeft size={16} />
                          ) : (
                            <ToggleRight size={16} />
                          )}
                        </ProtectedButton>

                        <ProtectedButton
                          permission={PERMISSIONS.MANAGE_STAFF}
                          onClick={() => handleDelete(member._id)}
                          className="btn-icon btn-delete"
                          title={t("common.delete")}
                        >
                          <Trash2 size={16} />
                        </ProtectedButton>
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
          <div className="modal">
            <div className="modal-header">
              <h2>
                {showEditModal ? (
                  <>
                    <Edit size={20} />
                    {t("staff.edit_staff")}
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    {t("staff.add_new_staff")}
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
            {modalLoading ? (
              <div className="modal-loading">
                <div className="spinner"></div>
                <p>Loading staff data...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="staff-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>{t("staff.name")} *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{t("staff.email")} *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{t("staff.phone")} *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      {t("staff.password")} {!selectedStaff && "*"}
                    </label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required={!selectedStaff}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t("staff.department")} *</label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      required
                    >
                      <option value="">{t("staff.select_department")}</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id || dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t("staff.role")} *</label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role._id || role.name} value={role._id || role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t("staff.status")}</label>
                    <select
                      value={formData.isActive ? "active" : "inactive"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.value === "active",
                        })
                      }
                    >
                      <option value="active">{t("staff.status_active")}</option>
                      <option value="inactive">
                        {t("staff.status_inactive")}
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
                        <Check size={16} />
                        {t("common.update")}
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
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

export default Staff;
