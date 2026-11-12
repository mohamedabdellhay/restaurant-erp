import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Save, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "@components/PageHeader";
import Alert from "@components/Alert";
import { useAuth } from "@hooks/useAuth";
import "./Profile.css";

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { t } = useTranslation();
  const [section, setSection] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [visible, setVisible] = useState({});
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const roleLabel = user?.isPlatformOwner
    ? t("platform.owner")
    : (typeof user?.role === "object" ? user?.role?.name : user?.role) || "";
  const restaurantName = user?.isPlatformOwner ? "" : user?.restaurant?.name || "";

  const handleInfoSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    const result = await updateProfile(formData);
    setMessage({
      type: result.success ? "success" : "error",
      text: result.success ? t("profile.update_success") : result.message,
    });
    setLoading(false);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
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
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage({ type: "success", text: t("profile.password_success") });
    } else {
      setMessage({ type: "error", text: result.message });
    }
    setLoading(false);
  };

  const passwordField = (name, label) => (
    <label className="profile-field">
      <span>{label}</span>
      <span className="profile-control">
        <Lock size={16} aria-hidden="true" />
        <input
          type={visible[name] ? "text" : "password"}
          value={passwordData[name]}
          onChange={(event) =>
            setPasswordData({ ...passwordData, [name]: event.target.value })
          }
          required
          autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
        />
        <button
          type="button"
          className="profile-reveal"
          aria-label={visible[name] ? t("auth.hide_password") : t("auth.show_password")}
          onClick={() => setVisible((current) => ({ ...current, [name]: !current[name] }))}
        >
          {visible[name] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  );

  return (
    <div className="profile-page">
      <PageHeader
        icon={User}
        title={t("profile.title")}
        subtitle={t("profile.subtitle")}
      />

      <section className="profile-identity">
        <div className="profile-avatar" aria-hidden="true">
          <User size={28} />
        </div>
        <div>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
        </div>
        {roleLabel ? <span className="profile-role">{roleLabel}</span> : null}
      </section>

      <nav className="profile-nav" aria-label={t("profile.title")}>
        <button
          type="button"
          className={section === "personal" ? "active" : ""}
          onClick={() => setSection("personal")}
        >
          <User size={16} />
          {t("profile.personal_info")}
        </button>
        <button
          type="button"
          className={section === "security" ? "active" : ""}
          onClick={() => setSection("security")}
        >
          <Lock size={16} />
          {t("profile.security")}
        </button>
      </nav>

      <Alert type={message.type} message={message.text} />

      {section === "personal" ? (
        <form className="profile-card" onSubmit={handleInfoSubmit}>
          <h2>{t("profile.personal_info")}</h2>
          <div className="profile-grid">
            <label className="profile-field">
              <span>{t("profile.name_label")}</span>
              <span className="profile-control">
                <User size={16} aria-hidden="true" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  required
                  autoComplete="name"
                />
              </span>
            </label>
            <label className="profile-field">
              <span>{t("profile.email_label")}</span>
              <span className="profile-control">
                <Mail size={16} aria-hidden="true" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  required
                  autoComplete="email"
                />
              </span>
            </label>
            <label className="profile-field">
              <span>{t("profile.role_label")}</span>
              <input value={roleLabel} disabled />
            </label>
            {restaurantName ? (
              <label className="profile-field">
                <span>{t("profile.restaurant_label")}</span>
                <input value={restaurantName} disabled />
              </label>
            ) : null}
          </div>
          <div className="profile-actions">
            <button type="submit" disabled={loading}>
              <Save size={16} />
              {loading ? t("common.processing") : t("profile.update_profile")}
            </button>
          </div>
        </form>
      ) : (
        <form className="profile-card" onSubmit={handlePasswordSubmit}>
          <h2>{t("profile.security")}</h2>
          <div className="profile-grid">
            {passwordField("currentPassword", t("profile.current_password"))}
            {passwordField("newPassword", t("profile.new_password"))}
            {passwordField("confirmPassword", t("profile.confirm_password"))}
          </div>
          <div className="profile-actions">
            <button type="submit" disabled={loading}>
              <Save size={16} />
              {loading ? t("common.processing") : t("profile.change_password")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
