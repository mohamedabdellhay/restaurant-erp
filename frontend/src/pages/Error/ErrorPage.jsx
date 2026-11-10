import React from "react";
import { useTranslation } from "react-i18next";
import { Home, RefreshCw, AlertTriangle, Bug } from "lucide-react";

// Simple navigation utility that works outside Router context
const navigateTo = (path) => {
  if (typeof window !== "undefined") {
    window.location.href = path;
  }
};

// Default theme colors for error pages (fallback when useRestaurant is not available)
const defaultThemeColors = {
  primary: "#f59e0b",
  secondary: "#6366f1",
  accent: "#10b981",
};

const ErrorPage = ({
  error,
  errorInfo,
  title,
  message,
  showRetry = true,
  showHome = true,
  onNavigate,
}) => {
  const { t } = useTranslation();

  // Use default theme colors since we're outside AuthProvider context
  const themeColors = defaultThemeColors;
  const primaryColor = themeColors.primary || "#f59e0b";

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate("/dashboard");
    } else {
      navigateTo("/dashboard");
    }
  };

  const getErrorIcon = () => {
    if (
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Loading chunk")
    ) {
      return <RefreshCw size={60} />;
    }
    return <AlertTriangle size={60} />;
  };

  const getErrorTitle = () => {
    if (title) return title;

    if (
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Loading chunk")
    ) {
      return t("error.chunk_load_error");
    }

    if (error?.name === "TypeError") {
      return t("error.type_error");
    }

    if (error?.name === "ReferenceError") {
      return t("error.reference_error");
    }

    return t("error.something_went_wrong");
  };

  const getErrorMessage = () => {
    if (message) return message;

    if (
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Loading chunk")
    ) {
      return t("error.chunk_load_description");
    }

    return t("error.general_error_description");
  };

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">{getErrorIcon()}</div>

          <h1>{getErrorTitle()}</h1>
          <p>{getErrorMessage()}</p>

          {error && (
            <div className="error-details">
              <details>
                <summary>{t("error.technical_details")}</summary>
                <div className="error-stack">
                  <p>
                    <strong>{t("error.error_name")}:</strong> {error.name}
                  </p>
                  <p>
                    <strong>{t("error.error_message")}:</strong> {error.message}
                  </p>
                  {error.stack && (
                    <p>
                      <strong>{t("error.error_stack")}:</strong>
                    </p>
                  )}
                  {error.stack && (
                    <pre className="stack-trace">{error.stack}</pre>
                  )}
                </div>
              </details>
            </div>
          )}

          <div className="action-buttons">
            {showRetry && (
              <button
                onClick={handleRetry}
                className="btn-primary"
                style={{ backgroundColor: primaryColor }}
              >
                <RefreshCw size={20} />
                {t("error.retry")}
              </button>
            )}

            {showHome && (
              <button
                onClick={handleGoHome}
                className="btn-secondary"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <Home size={20} />
                {t("error.go_home")}
              </button>
            )}
          </div>

          <div className="help-section">
            <h3>{t("error.what_to_do")}</h3>
            <ul>
              <li>{t("error.refresh_page")}</li>
              <li>{t("error.check_connection")}</li>
              <li>{t("error.clear_cache")}</li>
              <li>{t("error.try_again")}</li>
              <li>{t("error.contact_support")}</li>
            </ul>
          </div>

          {import.meta.env.DEV && (
            <div className="debug-info">
              <h4>
                <Bug size={16} />
                {t("error.debug_info")}
              </h4>
              <pre>{JSON.stringify(error, null, 2)}</pre>
              {errorInfo && <pre>{JSON.stringify(errorInfo, null, 2)}</pre>}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .error-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            135deg,
            var(--bg-primary) 0%,
            var(--bg-secondary) 100%
          );
          padding: 2rem;
        }

        .error-container {
          max-width: 600px;
          width: 100%;
        }

        .error-content {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 3rem 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--border-color);
          text-align: center;
        }

        .error-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          background: var(--bg-secondary);
          border-radius: 50%;
          margin: 0 auto 2rem;
          color: var(--error);
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }

        .error-content h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .error-content p {
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

        .error-details summary {
          cursor: pointer;
          font-weight: 600;
          color: var(--text-primary);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          transition: background-color 0.2s ease;
        }

        .error-details summary:hover {
          background: var(--bg-primary);
        }

        .error-stack {
          margin-top: 1rem;
          font-size: 0.9rem;
        }

        .error-stack p {
          margin: 0.5rem 0;
          word-break: break-all;
        }

        .stack-trace {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 1rem;
          font-size: 0.8rem;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
          color: var(--error);
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

        .debug-info {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          margin-top: 2rem;
          text-align: left;
        }

        .debug-info h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .debug-info pre {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 1rem;
          font-size: 0.8rem;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .error-page {
            padding: 1rem;
          }

          .error-content {
            padding: 2rem 1.5rem;
          }

          .error-icon {
            width: 80px;
            height: 80px;
          }

          .error-content h1 {
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

        [data-direction="rtl"] .debug-info h4 {
          flex-direction: row-reverse;
        }
      `}</style>
    </div>
  );
};

export default ErrorPage;
