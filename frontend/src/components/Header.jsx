import { Bell, Moon, Search, Sun, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import "./Header.css";

const Header = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const roleName =
    typeof user?.role === "object" ? user.role?.name : user?.role;
  const roleLabel = user?.isPlatformOwner
    ? t("platform.owner")
    : roleName === "Admin"
      ? t("header.administrator")
      : roleName || t("header.administrator");

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
  };

  return (
    <header className="app-header">
      <label className="app-header-search">
        <Search size={16} aria-hidden="true" />
        <input type="search" placeholder={t("header.search_placeholder")} />
      </label>

      <div className="app-header-end">
        <button
          type="button"
          onClick={toggleLanguage}
          className="app-header-icon lang-toggle"
          title="Switch language"
        >
          <span className="lang-label">{i18n.language === "en" ? "AR" : "EN"}</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="app-header-icon"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button type="button" className="app-header-icon" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <button
          type="button"
          className="app-header-user"
          onClick={() => navigate("/profile")}
        >
          <span className="app-header-user-copy">
            <strong>{user?.name || "Admin User"}</strong>
            <small>{roleLabel}</small>
          </span>
          <span className="app-header-avatar">
            <User size={18} />
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
