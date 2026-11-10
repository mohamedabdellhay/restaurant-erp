import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, ArrowLeft, Search } from "lucide-react";

// Default theme colors for error pages (fallback when useRestaurant is not available)
const defaultThemeColors = {
  primary: "#f59e0b",
  secondary: "#6366f1",
  accent: "#10b981",
};

const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Use default theme colors since we might be outside AuthProvider context
  const themeColors = defaultThemeColors;
  const primaryColor = themeColors.primary || "#f59e0b";

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/dashboard");
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="error-code">
            <span>4</span>
            <div className="error-icon">
              <Search size={60} />
            </div>
            <span>4</span>
          </div>

          <h1>{t("error.page_not_found")}</h1>
          <p>{t("error.page_not_found_description")}</p>

          <div className="error-details">
            <p>
              <strong>{t("error.requested_url")}:</strong> {location.pathname}
            </p>
          </div>

          <div className="action-buttons">
            <button
              onClick={handleGoBack}
              className="btn-secondary"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <ArrowLeft size={20} />
              {t("error.go_back")}
            </button>

            <button
              onClick={handleGoHome}
              className="btn-primary"
              style={{ backgroundColor: primaryColor }}
            >
              <Home size={20} />
              {t("error.go_home")}
            </button>
          </div>

          <div className="help-section">
            <h3>{t("error.need_help")}</h3>
            <ul>
              <li>{t("error.check_url")}</li>
              <li>{t("error.search_content")}</li>
              <li>{t("error.contact_admin")}</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .not-found-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-base);
          padding: 2rem;
        }

        .not-found-container {
          max-width: 600px;
          width: 100%;
          text-align: center;
        }

        .not-found-content {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 3rem 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--border-color);
        }

        .error-code {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          font-family: "Courier New", monospace;
        }

        .error-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: var(--bg-secondary);
          border-radius: 50%;
          margin: 0 1rem;
          color: var(--primary);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .not-found-content h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .not-found-content p {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .error-details {
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 1rem;
          margin-bottom: 2rem;
          text-align: left;
        }

        .error-details p {
          margin: 0;
          font-size: 0.9rem;
          font-family: "Courier New", monospace;
          word-break: break-all;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .action-buttons button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          border: 2px solid transparent;
        }

        .btn-primary {
          color: white;
        }

        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: transparent;
        }

        .btn-secondary:hover {
          background: var(--bg-secondary);
        }

        .help-section {
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          text-align: left;
        }

        .help-section h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .help-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .help-section li {
          padding: 0.5rem 0;
          color: var(--text-secondary);
          position: relative;
          padding-left: 1.5rem;
        }

        .help-section li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: var(--primary);
          font-weight: bold;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .not-found-page {
            padding: 1rem;
          }

          .not-found-content {
            padding: 2rem 1.5rem;
          }

          .error-code {
            font-size: 6rem;
          }

          .error-icon {
            width: 60px;
            height: 60px;
            margin: 0 0.5rem;
          }

          .not-found-content h1 {
            font-size: 1.5rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-buttons button {
            width: 100%;
            justify-content: center;
          }
        }

        /* RTL Support */
        [data-direction="rtl"] .help-section li {
          padding-left: 0;
          padding-right: 1.5rem;
        }

        [data-direction="rtl"] .help-section li::before {
          left: auto;
          right: 0;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
