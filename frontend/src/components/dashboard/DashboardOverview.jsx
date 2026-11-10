import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";
import dashboardService from "../../services/dashboardService";
import { useRestaurant } from "../../hooks/useRestaurant";
import { formatMoney } from "../../utils/money";

const DashboardOverview = ({ dateRange = {} }) => {
  const { t } = useTranslation();
  const { getCurrency } = useRestaurant();
  const currency = getCurrency();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [today, setToday] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOverview();
  }, [dateRange]);

  useEffect(() => {
    let active = true;
    dashboardService
      .getRealTimeMetrics()
      .then((response) => {
        if (active && response.success) setToday(response.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const response = await dashboardService.getOverview(params);
      if (response.success) {
        setOverview(response.data);
      } else {
        setError(response.message || "Failed to fetch overview");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
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
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  const formatCurrency = (amount) => formatMoney(amount, currency);

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const metrics = [
    {
      title: t("dashboard.total_revenue"),
      value: formatCurrency(overview.totalRevenue),
      icon: <DollarSign size={24} />,
      color: "var(--success)",
      bgColor: "var(--success-bg)",
    },
    {
      title: t("dashboard.total_orders"),
      value: formatNumber(overview.totalOrders),
      icon: <ShoppingCart size={24} />,
      color: "var(--primary)",
      bgColor: "var(--primary-bg)",
    },
    {
      title: t("dashboard.total_customers"),
      value: formatNumber(overview.totalCustomers),
      icon: <Users size={24} />,
      color: "var(--accent)",
      bgColor: "var(--accent-bg)",
    },
    {
      title: t("dashboard.average_order_value"),
      value: formatCurrency(overview.averageOrderValue),
      icon: <TrendingUp size={24} />,
      color: "var(--warning)",
      bgColor: "var(--warning-bg)",
    },
  ];

  return (
    <div className="dashboard-overview">
      {dateRange.from && dateRange.to && (
        <p className="date-range">
          {new Date(dateRange.from).toLocaleDateString()} –{" "}
          {new Date(dateRange.to).toLocaleDateString()}
        </p>
      )}

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

      {today && (
        <section className="today-panel">
          <div className="today-copy">
            <h2>{t("dashboard.today_summary")}</h2>
            <dl>
              <div>
                <dt>{t("dashboard.today_revenue")}</dt>
                <dd>{formatCurrency(today.today?.revenue || 0)}</dd>
              </div>
              <div>
                <dt>{t("dashboard.today_orders")}</dt>
                <dd>{formatNumber(today.today?.orders || 0)}</dd>
              </div>
              <div>
                <dt>{t("dashboard.active_orders")}</dt>
                <dd>{formatNumber(today.activeOrders || 0)}</dd>
              </div>
              <div>
                <dt>{t("dashboard.paid_orders")}</dt>
                <dd>{formatNumber(today.today?.paidOrders || 0)}</dd>
              </div>
            </dl>
          </div>
          <div className="today-tables">
            <h2>{t("dashboard.table_status")}</h2>
            <div
              className="occupancy-track"
              role="meter"
              aria-valuenow={Math.round(today.tables?.occupancyRate || 0)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("dashboard.table_occupancy")}
            >
              <span
                style={{
                  width: `${Math.min(today.tables?.occupancyRate || 0, 100)}%`,
                }}
              />
            </div>
            <p>
              {formatNumber(today.tables?.occupied || 0)} {t("dashboard.occupied")}
              {" · "}
              {formatNumber(today.tables?.available || 0)} {t("dashboard.available")}
              {" · "}
              {formatNumber(today.tables?.total || 0)} {t("dashboard.total")}
            </p>
          </div>
        </section>
      )}

      <style>{`
        .dashboard-overview {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .date-range {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.85rem;
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

        @keyframes metric-shimmer {
          from { background-position: 100% 0; }
          to { background-position: -100% 0; }
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
          margin: 0 0 0.25rem;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .metric-value {
          margin: 0;
          color: var(--text-primary);
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }

        .today-panel {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 0.85rem;
        }

        .today-copy,
        .today-tables {
          padding: 1.1rem 1.15rem;
          border: 1px solid var(--border-color);
          border-radius: 16px;
          background: var(--bg-card);
        }

        .today-copy h2,
        .today-tables h2 {
          margin: 0 0 0.9rem;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .today-copy dl {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.85rem 1rem;
          margin: 0;
        }

        .today-copy dt {
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .today-copy dd {
          margin: 0.15rem 0 0;
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .occupancy-track {
          height: 0.55rem;
          overflow: hidden;
          border-radius: 999px;
          background: var(--bg-secondary);
        }

        .occupancy-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--primary);
        }

        .today-tables p {
          margin: 0.75rem 0 0;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          font-weight: 600;
        }

        @media (max-width: 1100px) {
          .metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .metrics-grid,
          .today-panel,
          .today-copy dl {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardOverview;
