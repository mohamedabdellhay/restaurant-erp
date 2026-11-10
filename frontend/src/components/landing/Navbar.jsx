import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Moon, Sun, Globe } from "lucide-react";

const Navbar = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <>
      <style>{`
        /* Navbar Internal CSS */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 50;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          padding: 0;
        }

        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .navbar-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 80px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
        }

        .navbar-link {
          text-decoration: none;
          font-size: 1.875rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          display: flex;
          align-items: center;
        }

        .navbar-brand-gradient {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .navbar-brand-text {
          color: rgba(255, 255, 255, 0.95);
          margin-left: 0.25rem;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .navbar-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.625rem;
          border-radius: 50%;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .navbar-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f59e0b;
          transform: scale(1.05);
        }

        .navbar-language-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border-radius: 2rem;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .navbar-language-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f59e0b;
        }

        .navbar-divider {
          height: 24px;
          width: 1px;
          background: rgba(255, 255, 255, 0.2);
          margin: 0 0.5rem;
        }

        .navbar-primary-button {
          display: inline-flex;
          align-items: center;
          padding: 0.625rem 1.5rem;
          border-radius: 2rem;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.2);
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .navbar-primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px 0 rgba(245, 158, 11, 0.3);
        }

        .language-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Responsive Design */
        @media (max-width: 640px) {
          .navbar-container {
            padding: 0 1rem;
          }

          .navbar-divider {
            display: none;
          }

          .navbar-primary-button {
            display: none;
          }
        }

        /* RTL Support */
        [dir="rtl"] .navbar-brand {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .navbar-brand-text {
          margin-left: 0;
          margin-right: 0.25rem;
        }

        [dir="rtl"] .navbar-actions {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .navbar-language-button {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .language-text {
          direction: ltr;
        }
      `}</style>

      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-content">
            <div className="navbar-brand">
              <Link to="/" className="navbar-link">
                <span className="navbar-brand-gradient">Restaurant</span>
                <span className="navbar-brand-text">ERP</span>
              </Link>
            </div>

            <div className="navbar-actions">
              <button
                onClick={toggleTheme}
                className="navbar-button"
                aria-label="Toggle Theme"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              <button
                onClick={toggleLanguage}
                className="navbar-language-button"
                aria-label="Toggle Language"
              >
                <Globe size={20} />
                <span className="language-text">
                  {i18n.language.toUpperCase()}
                </span>
              </button>

              <div className="navbar-divider"></div>

              {user ? (
                <Link to="/dashboard" className="navbar-primary-button">
                  {t("common.dashboard") || "Dashboard"}
                </Link>
              ) : (
                <a href="#pricing" className="navbar-primary-button">
                  {t("landing.get_started") || "Get Started"}
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
