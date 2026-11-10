import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DollarSign,
  ShoppingCart,
  RefreshCw,
  Calendar,
  Activity,
} from "lucide-react";
import dashboardService from "../../services/dashboardService";
import { useRestaurant } from "../../hooks/useRestaurant";
import { formatMoney } from "../../utils/money";
import { getErrorMessage } from "../../utils/errorMessage";
import Alert from "../Alert";

const RealTimeMetrics = () => {
  const { t } = useTranslation();
  const { getCurrency } = useRestaurant();
  const currency = getCurrency();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchRealTimeMetrics();
    const interval = setInterval(fetchRealTimeMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRealTimeMetrics = async () => {
    try {
      const response = await dashboardService.getRealTimeMetrics();
      if (response.success) {
        setData(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.message || "Failed to fetch real-time metrics");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => formatMoney(amount, currency);

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const TableOccupancyBar = ({ tables }) => {
    if (!tables) return null;

    const occupancyRate = tables.occupancyRate || 0;
    const occupied = tables.occupied || 0;
    const total = tables.total || 0;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            {t("dashboard.table_occupancy")}
          </span>
          <span className="text-sm text-gray-500 ">
            {occupied}/{total} ({occupancyRate.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full  rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              occupancyRate > 80
                ? "bg-red-500"
                : occupancyRate > 60
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="metrics-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="metric-card metric-card-skeleton" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error" message={error} />
    );
  }

  if (!data) {
    return null;
  }

  const metrics = [
    {
      title: t("dashboard.today_revenue"),
      value: formatCurrency(data.today?.revenue || 0),
      icon: <DollarSign size={24} />,
      color: "var(--success)",
      bgColor: "var(--success-bg)",
    },
    {
      title: t("dashboard.today_orders"),
      value: formatNumber(data.today?.orders || 0),
      icon: <ShoppingCart size={24} />,
      color: "var(--primary)",
      bgColor: "var(--primary-bg)",
    },
    {
      title: t("dashboard.active_orders"),
      value: formatNumber(data.activeOrders || 0),
      icon: <RefreshCw size={24} />,
      color: "var(--warning)",
      bgColor: "var(--warning-bg)",
    },
    {
      title: t("dashboard.pending_reservations"),
      value: formatNumber(data.pendingReservations || 0),
      icon: <Calendar size={24} />,
      color: "var(--accent)",
      bgColor: "var(--accent-bg)",
    },
  ];

  return (
    <div className="realtime-metrics">
      <div className="section-header">
        <h2 className="section-title">{t("dashboard.real_time_metrics")}</h2>
        <div className="header-actions">
          <div className="live-indicator">
            <div className="live-dot"></div>
            <span className="live-text">{t("dashboard.live")}</span>
          </div>
          {lastUpdated && (
            <span className="last-updated">
              {t("dashboard.last_updated")}: {formatTime(lastUpdated)}
            </span>
          )}
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <article
            key={metric.title}
            className="metric-card"
            style={{ "--tone": metric.color }}
          >
            <div className="metric-icon">{metric.icon}</div>
            <div className="metric-info">
              <p className="metric-title">{metric.title}</p>
              <p className="metric-value">{metric.value}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="details-grid">
        <div className="detail-card">
          <h3 className="detail-title">{t("dashboard.table_status")}</h3>
          <TableOccupancyBar tables={data.tables} />
          <div className="table-stats">
            <div className="stat-item">
              <div className="stat-value">{data.tables?.available || 0}</div>
              <div className="stat-label">{t("dashboard.available")}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{data.tables?.occupied || 0}</div>
              <div className="stat-label">{t("dashboard.occupied")}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{data.tables?.total || 0}</div>
              <div className="stat-label">{t("dashboard.total")}</div>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h3 className="detail-title">{t("dashboard.today_summary")}</h3>
          <div className="summary-list">
            <div className="summary-item">
              <span className="summary-label">
                {t("dashboard.total_revenue")}
              </span>
              <span className="summary-value">
                {formatCurrency(data.today?.revenue || 0)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                {t("dashboard.total_orders")}
              </span>
              <span className="summary-value">
                {formatNumber(data.today?.orders || 0)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                {t("dashboard.paid_orders")}
              </span>
              <span className="summary-value">
                {formatNumber(data.today?.paidOrders || 0)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                {t("dashboard.unpaid_orders")}
              </span>
              <span className="summary-value">
                {formatNumber(
                  (data.today?.orders || 0) - (data.today?.paidOrders || 0),
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .realtime-metrics {
          margin-bottom: 2rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: var(--success);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .live-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .last-updated {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.85rem;
          margin-bottom: 1rem;
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          min-width: 0;
          padding: 1.1rem 1.15rem;
          border: 1px solid var(--border-color);
          border-radius: 16px;
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--tone, var(--primary)) 8%, transparent), transparent 55%),
            var(--bg-card);
        }

        .metric-card-skeleton {
          min-height: 92px;
          background: linear-gradient(90deg, var(--bg-card), var(--bg-secondary), var(--bg-card));
          background-size: 200% 100%;
          animation: metric-shimmer 1.2s ease-in-out infinite;
        }

        .metric-icon {
          display: grid;
          place-items: center;
          width: 2.75rem;
          height: 2.75rem;
          flex-shrink: 0;
          border-radius: 12px;
          background: color-mix(in srgb, var(--tone, var(--primary)) 16%, transparent);
          color: var(--tone, var(--primary));
        }

        .metric-info {
          min-width: 0;
        }

        .metric-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin: 0 0 0.25rem 0;
        }

        .metric-value {
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          margin: 0;
        }

        @keyframes metric-shimmer {
          from { background-position: 100% 0; }
          to { background-position: -100% 0; }
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .detail-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .detail-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 1rem 0;
        }

        .table-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .summary-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .summary-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .summary-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        @media (max-width: 1100px) {
          .metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .metric-card {
            padding: 1rem;
          }

          .metric-value {
            font-size: 1.25rem;
          }

          .metric-icon {
            font-size: 1.5rem;
          }
        }

        [dir='rtl'] .metric-content,
        [dir='rtl'] .summary-item {
          direction: rtl;
        }
      `}</style>
    </div>
  );
};

export default RealTimeMetrics;
