import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@hooks/useAuth";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  Users,
  Settings,
  Check,
  X,
  Save,
} from "lucide-react";
import roleService from "@services/roleService";
import { PERMISSIONS } from "@utils/permissionUtils";
import PageHeader from "@components/PageHeader";
import "./Roles.css";

const Roles = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Check permissions according to API guide
  const canManageRoles =
    user?.role?.permissions?.includes("manage_roles") || false;
  const canViewRoles = user?.role?.permissions?.includes("view_roles") || false;

  // State hooks must be declared before any early returns
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [],
  });

  // If user doesn't have view_roles permission, show access denied
  if (!canViewRoles) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <Shield size={48} />
          <h2>{t("common.access_denied")}</h2>
          <p>{t("roles.no_permission")}</p>
        </div>
      </div>
    );
  }

  // Fetch roles and permissions
  const fetchRoles = useCallback(async () => {
    try {
      const response = await roleService.getAll();
      setRoles(response.data || response || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || t("roles.error_fetching_roles"),
      });
    }
  }, [t]);

  const fetchPermissions = useCallback(async () => {
    try {
      console.log("Fetching permission metadata from server...");
      const response = await roleService.getPermissionMetadata();
      console.log("Permission metadata response:", response);

      // Data is already grouped by module from this endpoint
      // Expected structure: [{ module: "Staff Management", permissions: [{ key: "view_staff", label: "View Staff" }] }]
      const metadata = response.data || response || [];
      setPermissions(metadata);
    } catch (error) {
      console.error("Error fetching permission metadata:", error);

      // Fallback to local permissions grouped by first part of key if API fails
      console.log("API failed, using local permissions as fallback");
      const localPermissions = Object.values(PERMISSIONS);
      const fallbackGrid = {};
      localPermissions.forEach((p) => {
        const category = p.split("_")[0];
        if (!fallbackGrid[category]) fallbackGrid[category] = [];
        fallbackGrid[category].push({ key: p, label: p.replace(/_/g, " ") });
      });

      const fallbackMetadata = Object.entries(fallbackGrid).map(
        ([module, perms]) => ({
          module: module.charAt(0).toUpperCase() + module.slice(1),
          permissions: perms,
        }),
      );

      setPermissions(fallbackMetadata);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          t("roles.error_fetching_permissions"),
      });
    }
  }, [t]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRoles(), fetchPermissions()]);
      setLoading(false);
    };
    loadData();
  }, [fetchRoles, fetchPermissions]);

  // Filter roles based on search
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRole) {
        await roleService.update(selectedRole._id, formData);
        setMessage({ type: "success", text: t("roles.role_updated") });
      } else {
        await roleService.create(formData);
        setMessage({ type: "success", text: t("roles.role_created") });
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedRole(null);
      resetForm();
      fetchRoles();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || t("roles.error_saving_role"),
      });
    }
  };

  // Handle role deletion
  const handleDelete = async (id) => {
    if (window.confirm(t("roles.confirm_delete_role"))) {
      try {
        await roleService.delete(id);
        setMessage({ type: "success", text: t("roles.role_deleted") });
        fetchRoles();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || t("roles.error_deleting_role"),
        });
      }
    }
  };

  // Handle edit role
  const handleEdit = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || [],
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: [],
    });
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionKey) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter((p) => p !== permissionKey)
        : [...prev.permissions, permissionKey],
    }));
  };

  // Permissions are already grouped in state
  const permissionGroups = permissions;

  return (
    <div>
      {/* Header */}
      <PageHeader
        icon={Shield}
        title={t("roles.title")}
        subtitle={t("roles.page_description")}
      >
        {canManageRoles && (
          <button
            onClick={() => {
              setShowAddModal(true);
              resetForm();
            }}
            className="btn-primary"
          >
            <Plus size={20} />
            {t("roles.add_role")}
          </button>
        )}
      </PageHeader>

      {/* Search and Filter */}
      <div className="search-filter-container">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder={t("roles.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Roles List */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t("common.loading")}</p>
        </div>
      ) : (
        <div className="roles-grid">
          {filteredRoles.length === 0 ? (
            <div className="no-data">
              <Shield size={48} />
              <h3>{t("roles.no_roles_found")}</h3>
              <p>{t("roles.no_roles_description")}</p>
            </div>
          ) : (
            filteredRoles.map((role) => (
              <div key={role._id} className="role-card">
                <div className="role-header">
                  <div className="role-info">
                    <h3>{role.name}</h3>
                    {role.description && <p>{role.description}</p>}
                  </div>
                  <div className="role-badge">
                    <Users size={16} />
                    {role.userCount || 0} {t("roles.users")}
                  </div>
                </div>
                <div className="role-permissions">
                  <h4>
                    {t("roles.permissions")} ({role.permissions?.length || 0})
                  </h4>
                  <div className="permission-tags">
                    {(role.permissions || []).slice(0, 5).map((permission) => (
                      <span key={permission} className="permission-tag">
                        {permission.replace(/_/g, " ")}
                      </span>
                    ))}
                    {(role.permissions || []).length > 5 && (
                      <span className="permission-more">
                        +{(role.permissions || []).length - 5} {t("roles.more")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="role-actions">
                  {canManageRoles && (
                    <button
                      onClick={() => handleEdit(role)}
                      className="btn-icon btn-edit"
                      title={t("common.edit")}
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {canManageRoles && (
                    <button
                      onClick={() => handleDelete(role._id)}
                      className="btn-icon btn-delete"
                      title={t("common.delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Role Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal role-modal">
            <div className="modal-header">
              <h2>
                <Shield size={20} />
                {selectedRole ? t("roles.edit_role") : t("roles.add_role")}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedRole(null);
                  resetForm();
                }}
                className="btn-close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="role-form">
              <div className="modal-body">
                <div className="form-group">
                  <label>{t("roles.role_name")} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder={t("roles.role_name_placeholder")}
                  />
                </div>
                <div className="form-group">
                  <label>{t("roles.role_description")}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows="3"
                    placeholder={t("roles.role_description_placeholder")}
                  />
                </div>
                <div className="form-group">
                  <label>{t("roles.permissions")}</label>
                  <div className="permissions-grid">
                    {permissionGroups.map((group) => (
                      <div key={group.module} className="permission-category">
                        <h4>{group.module}</h4>
                        <div className="permission-list">
                          {group.permissions.map((perm) => (
                            <label key={perm.key} className="permission-checkbox">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm.key)}
                                onChange={() => handlePermissionToggle(perm.key)}
                              />
                              <span>{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedRole(null);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  {selectedRole
                    ? t("roles.update_role")
                    : t("roles.create_role")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}
    </div>
  );
};

export default Roles;
