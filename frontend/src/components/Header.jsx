import { Menu, Search, Bell, User, Sun, Moon, Languages } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useRestaurant } from "../hooks/useRestaurant";
import { useTranslation } from "react-i18next";

import { useNavigate } from "react-router-dom";

const Header = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { getRestaurantName, getThemeColors } = useRestaurant();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const themeColors = getThemeColors();

  // Debug logging
  console.log("Header - themeColors:", themeColors);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="header glass">
      <div className="header-left">
        <button onClick={toggleSidebar} className="menu-toggle">
          <Menu size={22} />
        </button>
        <div className="restaurant-brand">
          {themeColors.logo ? (
            <img
              src={themeColors.logo}
              alt="Restaurant Logo"
              className="restaurant-logo"
              onError={(e) => {
                console.error("Logo failed to load:", themeColors.logo);
                e.target.style.display = "none";
              }}
            />
          ) : (
            <span className="restaurant-name">{getRestaurantName()}</span>
          )}
        </div>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder={t("header.search_placeholder")} />
        </div>
      </div>

      <div className="header-right">
        <button
          onClick={toggleLanguage}
          className="icon-btn lang-toggle"
          title="Switch Language"
        >
          <Languages size={20} />
          <span className="lang-label">
            {i18n.language === "en" ? "AR" : "EN"}
          </span>
        </button>

        <button
          onClick={toggleTheme}
          className="icon-btn theme-toggle"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button className="icon-btn">
          <Bell size={20} />
          <span className="notification-badge"></span>
        </button>

        <div className="user-profile" onClick={() => navigate("/profile")}>
          <div className="user-info">
            <span className="user-name">{user?.name || "Admin User"}</span>
            <span className="user-role">
              {user?.role?.name === "Admin"
                ? t("header.administrator")
                : user?.role?.name || t("header.administrator")}
            </span>
          </div>
          <div className="avatar">
            <User size={20} />
          </div>
        </div>
      </div>

      <style>{`
        .header {
          height: 70px;
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          min-width: 0;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .header-left {
          flex: 1;
        }

        .header-right {
          flex-shrink: 0;
        }

        .menu-toggle {
          color: var(--text-secondary);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
        }

        .menu-toggle:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        [data-theme='dark'] .menu-toggle:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .restaurant-brand {
          margin-left: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .restaurant-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: -0.025em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .restaurant-logo {
          height: 40px;
          max-width: 120px;
          object-fit: contain;
          border-radius: var(--radius-sm);
        }

        .search-bar {
          position: relative;
          flex: 1 1 10rem;
          width: auto;
          min-width: 0;
          max-width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        
        [dir='rtl'] .search-icon {
          left: auto;
          right: 1rem;
        }

        .search-bar input {
          width: 100%;
          padding: 0.625rem 1rem 0.625rem 2.75rem;
          background: var(--input-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          outline: none;
          font-size: 0.875rem;
        }
        
        [dir='rtl'] .search-bar input {
          padding: 0.625rem 2.75rem 0.625rem 1rem;
        }

        .search-bar input:focus {
          border-color: var(--primary);
        }

        .icon-btn {
          position: relative;
          color: var(--text-secondary);
          padding: 0.5rem;
          border-radius: var(--radius-md);
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .icon-btn:hover {
          background: rgba(0, 0, 0, 0.05);
          color: var(--primary);
        }

        [data-theme='dark'] .icon-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .lang-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .notification-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
          border: 2px solid var(--bg-card);
        }
        
        [dir='rtl'] .notification-badge {
          right: auto;
          left: 6px;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem;
          border-radius: var(--radius-lg);
          transition: background 0.2s;
          cursor: pointer;
        }

        .user-profile:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        [data-theme='dark'] .user-profile:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        [dir='rtl'] .user-info {
          align-items: flex-start;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        @media (max-width: 1100px) {
          .user-info {
            display: none;
          }

          .search-bar {
            max-width: 180px;
          }
        }

        .avatar {
          width: 36px;
          height: 36px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-content);
        }

        @media (max-width: 768px) {
          .search-bar {
            display: none;
          }
          .header {
            padding: 0 1rem;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
