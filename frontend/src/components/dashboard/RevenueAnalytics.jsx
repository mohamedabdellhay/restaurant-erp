import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, DollarSign, CreditCard, ShoppingCart } from "lucide-react";
import dashboardService from "../../services/dashboardService";

const RevenueAnalytics = ({ dateRange = {} }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [groupBy, setGroupBy] = useState("day");

  useEffect(() => {
    fetchRevenueAnalytics();
  }, [dateRange, groupBy]);

  const fetchRevenueAnalytics = async () => {
    try {
      setLoading(true);
      const params = { groupBy };
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const response = await dashboardService.getRevenueAnalytics(params);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to fetch revenue analytics");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const SimpleBarChart = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="chart-empty">
          <TrendingUp size={24} className="chart-empty-icon" />
          <span className="chart-empty-text">{t("dashboard.no_data")}</span>
        </div>
      );
    }

    const maxValue = Math.max(...data.map((item) => item.value || 0));

    return (
      <div className="chart-container">
        <div className="chart-bars">
          {data.map((item, index) => {
            const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <div
                key={index}
                className="chart-bar"
                style={{ height: `${height}%` }}
              >
                <div className="chart-bar-tooltip">
                  {formatCurrency(item.value)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-labels">
          {data.map((item, index) => (
            <div key={index} className="chart-label">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PieChart = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="chart-empty">
          <TrendingUp size={24} className="chart-empty-icon" />
          <span className="chart-empty-text">{t("dashboard.no_data")}</span>
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    const colors = [
      "var(--primary)",
      "var(--success)",
      "var(--warning)",
      "var(--danger)",
      "var(--accent)",
      "var(--info)",
    ];

    let currentAngle = 0;
    const segments = data.map((item, index) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const largeArcFlag = angle > 180 ? 1 : 0;
      const radius = 80;
      const startX = 100 + radius * Math.cos((startAngle * Math.PI) / 180);
      const startY = 100 + radius * Math.sin((startAngle * Math.PI) / 180);
      const endX = 100 + radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = 100 + radius * Math.sin((endAngle * Math.PI) / 180);

      return {
        path: `M 100 100 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`,
        color: colors[index % colors.length],
        label: item.label,
        value: item.value,
        percentage: percentage.toFixed(1),
      };
    });

    return (
      <div className="pie-chart-container">
        <svg width="200" height="200" className="pie-chart">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill={segment.color}
              className="pie-segment"
            />
          ))}
        </svg>
        <div className="pie-legend">
          {segments.map((segment, index) => (
            <div key={index} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: segment.color }}
              />
              <span className="legend-label">{segment.label}</span>
              <span className="legend-value">
                {formatCurrency(segment.value)} ({segment.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="revenue-analytics">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-grid">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="revenue-analytics">
        <div className="error-card">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="revenue-analytics">
      <div className="section-header">
        <h2 className="section-title">{t("dashboard.revenue_analytics")}</h2>
        <div className="header-controls">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="select-input"
          >
            <option value="day">{t("dashboard.group_by_day")}</option>
            <option value="week">{t("dashboard.group_by_week")}</option>
            <option value="month">{t("dashboard.group_by_month")}</option>
          </select>
          {dateRange.from && dateRange.to && (
            <span className="date-range">
              {new Date(dateRange.from).toLocaleDateString()} -{" "}
              {new Date(dateRange.to).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="analytics-grid">
        <div className="chart-card">
          <h3 className="chart-title">
            <TrendingUp size={18} className="chart-icon" />
            {t("dashboard.revenue_trends")}
          </h3>
          <SimpleBarChart data={data.trends} />
        </div>

        <div className="chart-card">
          <h3 className="chart-title">
            <CreditCard size={18} className="chart-icon" />
            {t("dashboard.payment_methods")}
          </h3>
          <PieChart data={data.paymentMethods} />
        </div>

        <div className="chart-card">
          <h3 className="chart-title">
            <ShoppingCart size={18} className="chart-icon" />
            {t("dashboard.order_types")}
          </h3>
          <PieChart data={data.orderTypes} />
        </div>

        <div className="summary-card">
          <h3 className="chart-title">
            <DollarSign size={18} className="chart-icon" />
            {t("dashboard.revenue_summary")}
          </h3>
          <div className="summary-list">
            {data.paymentMethods?.map((method, index) => (
              <div key={index} className="summary-item">
                <span className="summary-label">{method.label}</span>
                <span className="summary-value">
                  {formatCurrency(method.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .revenue-analytics {
          padding: 0;
          background: var(--bg-base);
        }

        .loading-skeleton {
          padding: 2rem;
        }

        .skeleton-header {
          width: 200px;
          height: 32px;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .skeleton-card {
          height: 200px;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .error-card {
          background: var(--error-bg);
          border: 1px solid var(--error);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .error-message {
          color: var(--error);
          margin: 0;
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

        .header-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .select-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--input-bg);
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
        }

        .select-input:focus {
          border-color: var(--primary);
        }

        .date-range {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .chart-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .chart-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 1rem 0;
        }

        .chart-icon {
          color: var(--primary);
        }

        .chart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--text-muted);
        }

        .chart-empty-icon {
          margin-bottom: 0.5rem;
          opacity: 0.5;
        }

        .chart-empty-text {
          font-size: 0.875rem;
        }

        .chart-container {
          height: 200px;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 1rem;
          position: relative;
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 100%;
          gap: 2px;
        }

        .chart-bar {
          flex: 1;
          background: var(--primary);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          position: relative;
          cursor: pointer;
          transition: background 0.2s;
        }

        .chart-bar:hover {
          background: var(--primary-dark);
        }

        .chart-bar-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: var(--bg-primary);
          color: var(--primary-content);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .chart-bar:hover .chart-bar-tooltip {
          opacity: 1;
        }

        .chart-labels {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-muted);
          padding: 0 1rem;
        }

        .chart-label {
          flex: 1;
          text-align: center;
        }

        .pie-chart-container {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .pie-chart {
          flex-shrink: 0;
        }

        .pie-segment {
          transition: opacity 0.2s;
          cursor: pointer;
        }

        .pie-segment:hover {
          opacity: 0.8;
        }

        .pie-legend {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: var(--radius-sm);
          margin-right: 0.5rem;
        }

        .legend-label {
          color: var(--text-secondary);
          flex: 1;
        }

        .legend-value {
          color: var(--text-primary);
          font-weight: 600;
        }

        .summary-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .summary-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
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

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (max-width: 768px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .pie-chart-container {
            flex-direction: column;
          }

          .chart-container {
            height: 150px;
          }
        }

        [dir='rtl'] .legend-color {
          margin-right: 0;
          margin-left: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default RevenueAnalytics;
