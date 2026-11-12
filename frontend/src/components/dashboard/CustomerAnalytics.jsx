import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Users, TrendingUp, Star } from "lucide-react";
import dashboardService from "../../services/dashboardService";
import { useRestaurant } from "../../hooks/useRestaurant";
import { formatMoney } from "../../utils/money";
import { getErrorMessage } from "../../utils/errorMessage";
import Alert from "../Alert";

const CustomerAnalytics = ({ dateRange = {} }) => {
  const { t } = useTranslation();
  const { getCurrency } = useRestaurant();
  const currency = getCurrency();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomerAnalytics();
  }, [dateRange]);

  const fetchCustomerAnalytics = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const response = await dashboardService.getCustomerAnalytics(params);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to fetch customer analytics");
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

  const CustomerSegmentChart = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="chart-empty">
          <Users size={24} className="chart-empty-icon" />
          <span className="chart-empty-text">{t("dashboard.no_data")}</span>
        </div>
      );
    }

    const total = data.newCustomers + data.returningCustomers;
    const newPercentage = total > 0 ? (data.newCustomers / total) * 100 : 0;
    const returningPercentage =
      total > 0 ? (data.returningCustomers / total) * 100 : 0;

    return (
      <div className="segment-chart">
        <div className="segment-container">
          {total > 0 ? (
            <>
              {data.newCustomers > 0 && (
                <div
                  className="segment new-segment"
                  style={{ flexGrow: data.newCustomers }}
                />
              )}
              {data.returningCustomers > 0 && (
                <div
                  className="segment returning-segment"
                  style={{ flexGrow: data.returningCustomers }}
                />
              )}
            </>
          ) : (
            <div className="segment segment-empty" />
          )}
        </div>
        <div className="segment-legend">
          <div className="legend-item">
            <div className="legend-color new-legend"></div>
            <span>{t("dashboard.new_customers")}</span>
            <span className="legend-value">
              {formatNumber(data.newCustomers)} · {newPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="legend-item">
            <div className="legend-color returning-legend"></div>
            <span>{t("dashboard.returning_customers")}</span>
            <span className="legend-value">
              {formatNumber(data.returningCustomers)} · {returningPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8   rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="  rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-32   rounded"></div>
          </div>
          <div className="  rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-32   rounded"></div>
          </div>
          <div className="  rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-32   rounded"></div>
          </div>
        </div>
        <div className="  rounded-lg shadow-sm p-6 animate-pulse">
          <div className="h-48   rounded"></div>
        </div>
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

  return (
    <div className="customer-analytics">
      <div className="section-header">
        <h2 className="section-title">{t("dashboard.customer_analytics")}</h2>
        {dateRange.from && dateRange.to && (
          <span className="date-range">
            {new Date(dateRange.from).toLocaleDateString()} -{" "}
            {new Date(dateRange.to).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="analytics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <Users size={24} className="metric-icon" />
            <h3 className="metric-title">{t("dashboard.total_customers")}</h3>
          </div>
          <div className="metric-value">
            {formatNumber(data.totalCustomers)}
          </div>
          <p className="metric-description">
            {t("dashboard.total_customers_description")}
          </p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <TrendingUp size={24} className="metric-icon" />
            <h3 className="metric-title">
              {t("dashboard.avg_orders_per_customer")}
            </h3>
          </div>
          <div className="metric-value">
            {data.averageOrdersPerCustomer?.toFixed(1) || "0.0"}
          </div>
          <p className="metric-description">
            {t("dashboard.avg_orders_description")}
          </p>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <TrendingUp size={18} className="chart-icon" />
            <h3 className="chart-title">{t("dashboard.new_vs_returning")}</h3>
          </div>
          <CustomerSegmentChart data={data} />
        </div>
      </div>

      <div className="customers-section">
        <h3 className="section-title">{t("dashboard.top_customers")}</h3>

        {data.topCustomers?.length === 0 ? (
          <div className="empty-state">
            <Star size={48} className="empty-icon" />
            <h3 className="empty-title">{t("dashboard.no_top_customers")}</h3>
            <p className="empty-description">
              {t("dashboard.no_top_customers_description")}
            </p>
          </div>
        ) : (
          <div className="customers-list">
            {data.topCustomers?.map((customer, index) => (
              <div key={customer._id || index} className="customer-card">
                <div className="customer-content">
                  <div className="customer-rank">{index + 1}</div>
                  <div className="customer-info">
                    <h3 className="customer-name">{customer.name}</h3>
                    <div className="customer-details">
                      <span>{customer.email}</span>
                      {customer.phone && <span>• {customer.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="customer-metrics">
                  <div className="metric-item">
                    <div className="metric-value">
                      {formatNumber(customer.totalOrders)}
                    </div>
                    <div className="metric-label">{t("dashboard.orders")}</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-value">
                      {formatCurrency(customer.totalSpent)}
                    </div>
                    <div className="metric-label">
                      {t("dashboard.total_spent")}
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-value">
                      {formatCurrency(customer.averageOrderValue)}
                    </div>
                    <div className="metric-label">
                      {t("dashboard.avg_order")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .customer-analytics {
          padding: 0;
          background: var(--bg-base);
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

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .metric-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .metric-icon {
          color: var(--primary);
        }

        .metric-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .metric-description {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .chart-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .chart-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .segment-chart {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .segment-container {
          display: flex;
          gap: 4px;
          height: 12px;
          background: var(--bg-secondary);
          border-radius: 999px;
          overflow: hidden;
        }

        .segment {
          min-width: 0;
          height: 100%;
        }

        .segment-empty {
          flex: 1;
          background: color-mix(in srgb, var(--text-muted) 25%, transparent);
        }

        .new-segment {
          background: var(--primary);
        }

        .returning-segment {
          background: var(--success);
        }

        .segment-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1.25rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: var(--radius-sm);
        }

        .new-legend {
          background: var(--primary);
        }

        .returning-legend {
          background: var(--success);
        }

        .legend-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .customers-section {
          margin-top: 2rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 0;
        }

        .empty-icon {
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
        }

        .empty-description {
          color: var(--text-secondary);
          margin: 0;
        }

        .customers-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .customer-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          transition: background 0.2s;
        }

        .customer-card:hover {
          background: var(--bg-secondary);
        }

        .customer-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .customer-rank {
          width: 32px;
          height: 32px;
          background: var(--warning);
          color: var(--warning-content);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .customer-info {
          flex: 1;
        }

        .customer-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }

        .customer-details {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .customer-metrics {
          display: flex;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .customer-card {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .customer-content {
            gap: 0.75rem;
          }

          .customer-metrics {
            flex-direction: column;
            gap: 1rem;
          }
        }

        [dir='rtl'] .customer-details,
        [dir='rtl'] .customer-metrics {
          direction: rtl;
        }
      `}</style>
    </div>
  );
};

export default CustomerAnalytics;
