import React, { useState } from "react";
import "./Profile.css";
import { useAuth } from "@hooks/useAuth";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Lock,
  Save,
  AlertCircle,
  CheckCircle,
  Store,
  Briefcase,
} from "lucide-react";

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Personal Info State
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const result = await updateProfile(formData);

    setMessage({
      type: result.success ? "success" : "error",
      text: result.success ? t("profile.update_success") : result.message,
    });
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: t("profile.password_mismatch") });
      return;
    }

    setLoading(true);
    const result = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });

    if (result.success) {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: t("profile.password_success") });
    } else {
      setMessage({ type: "error", text: result.message });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="profile-header">
        <h1>{t("profile.title")}</h1>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar card">
          <div className="user-avatar-large">
            <User size={48} />
          </div>
          <h3>{user?.name}</h3>
          <p className="role-badge">{typeof user?.role === 'object' ? user.role.name : user?.role}</p>

          <div className="sidebar-menu">
            <button
              className={`menu-item ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              <User size={18} />
              {t("profile.personal_info")}
            </button>
            <button
              className={`menu-item ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <Lock size={18} />
              {t("profile.security")}
            </button>
          </div>
        </div>

        <div className="profile-main card">
          {message.text && (
            <div className={`alert ${message.type}`}>
              {message.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              {message.text}
            </div>
          )}

          {activeTab === "personal" ? (
            <form onSubmit={handleInfoSubmit} className="profile-form">
              <h2>{t("profile.personal_info")}</h2>

              <div className="form-group">
                <label>{t("profile.name_label")}</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t("profile.email_label")}</label>
                <div className="input-wrapper">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t("profile.role_label")}</label>
                  <div className="input-wrapper disabled">
                    <Briefcase size={18} />
                    <input type="text" value={(typeof user?.role === 'object' ? user.role.name : user?.role) || ""} disabled />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t("profile.restaurant_label")}</label>
                  <div className="input-wrapper disabled">
                    <Store size={18} />
                    <input
                      type="text"
                      value={user?.restaurant?.name || ""}
                      disabled
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                <Save size={18} />
                {loading ? t("auth.logging_in") : t("profile.update_profile")}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <h2>{t("profile.security")}</h2>

              <div className="form-group">
                <label>{t("profile.current_password")}</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t("profile.new_password")}</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t("profile.confirm_password")}</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                <Save size={18} />
                {loading ? t("auth.logging_in") : t("profile.change_password")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
