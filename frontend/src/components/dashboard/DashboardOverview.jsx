import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";
import dashboardService from "../../services/dashboardService";

const DashboardOverview = ({ dateRange = {} }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOverview();
  }, [dateRange]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="  rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-4  rounded mb-2"></div>
            <div className="h-8  rounded"></div>
          </div>
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

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
      <div className="section-header">
        <h2 className="section-title">{t("dashboard.overview")}</h2>
        {dateRange.from && dateRange.to && (
          <span className="date-range">
            {new Date(dateRange.from).toLocaleDateString()} -{" "}
            {new Date(dateRange.to).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-content">
              <div className="metric-info">
                <p className="metric-title">{metric.title}</p>
                <p className="metric-value">{metric.value}</p>
              </div>
              <div className="metric-icon">{metric.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .dashboard-overview {
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

        .date-range {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .metric-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .metric-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .metric-info {
          flex: 1;
        }

        .metric-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin: 0 0 0.5rem 0;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .metric-icon {
          color: var(--text-secondary);
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
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

        [dir='rtl'] .metric-content {
          direction: rtl;
        }
      `}</style>
    </div>
  );
};

export default DashboardOverview;
