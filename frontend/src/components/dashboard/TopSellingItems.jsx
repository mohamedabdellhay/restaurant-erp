import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Package, ShoppingCart, DollarSign } from "lucide-react";
import dashboardService from "../../services/dashboardService";

const TopSellingItems = ({ dateRange = {} }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchTopItems();
  }, [dateRange, limit]);

  const fetchTopItems = async () => {
    try {
      setLoading(true);
      const params = { limit };
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const response = await dashboardService.getTopItems(params);
      if (response.success) {
        setItems(response.data);
      } else {
        setError(response.message || "Failed to fetch top items");
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

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div className=" rounded-lg shadow-sm p-6">
        <div className="h-8  rounded w-48 mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(limit)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse"
            >
              <div className="flex-1">
                <div className="h-4  rounded w-32 mb-2"></div>
                <div className="h-3  rounded w-24"></div>
              </div>
              <div className="text-right">
                <div className="h-4  rounded w-20 mb-2"></div>
                <div className="h-3  rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="top-selling-items">
      <div className="section-header">
        <h2 className="section-title">{t("dashboard.top_selling_items")}</h2>
        <div className="header-controls">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="select-input"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
          {dateRange.from && dateRange.to && (
            <span className="date-range">
              {new Date(dateRange.from).toLocaleDateString()} -{" "}
              {new Date(dateRange.to).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Package size={48} className="empty-icon" />
          <h3 className="empty-title">{t("dashboard.no_items")}</h3>
          <p className="empty-description">
            {t("dashboard.no_items_description")}
          </p>
        </div>
      ) : (
        <div className="items-list">
          {items.map((item, index) => (
            <div key={item._id || index} className="item-card">
              <div className="item-content">
                <div className="item-rank">{index + 1}</div>
                <div className="item-info">
                  <h3 className="item-name">{item.name}</h3>
                  <div className="item-stats">
                    <span>{formatNumber(item.totalQuantity)} sold</span>
                    <span>•</span>
                    <span>{formatNumber(item.orderCount)} orders</span>
                    <span>•</span>
                    <span>Avg: {formatCurrency(item.averagePrice)}</span>
                  </div>
                </div>
                <div className="item-revenue">
                  <div className="revenue-amount">
                    {formatCurrency(item.totalRevenue)}
                  </div>
                  <div className="revenue-label">{t("dashboard.revenue")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="summary-section">
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-value">{formatNumber(items.length)}</div>
              <div className="summary-label">
                {t("dashboard.total_quantity")}
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-value">
                {formatNumber(
                  items.reduce((sum, item) => sum + item.orderCount, 0),
                )}
              </div>
              <div className="summary-label">{t("dashboard.orders")}</div>
            </div>
            <div className="summary-item">
              <div className="summary-value">
                {formatCurrency(
                  items.reduce((sum, item) => sum + item.totalRevenue, 0),
                )}
              </div>
              <div className="summary-label">{t("dashboard.revenue")}</div>
            </div>
            <div className="summary-item">
              <div className="summary-value">
                {formatCurrency(
                  items.reduce((sum, item) => sum + item.totalRevenue, 0) /
                    items.reduce((sum, item) => sum + item.orderCount, 0),
                )}
              </div>
              <div className="summary-label">
                {t("dashboard.avg_order_value")}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .top-selling-items {
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

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .item-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          transition: background 0.2s;
        }

        .item-card:hover {
          background: var(--bg-secondary);
        }

        .item-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .item-rank {
          width: 32px;
          height: 32px;
          background: var(--primary);
          color: var(--primary-content);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }

        .item-stats {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .item-revenue {
          text-align: right;
        }

        .revenue-amount {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .revenue-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .summary-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .summary-item {
          text-align: center;
          padding: 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
        }

        .summary-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .summary-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .item-card {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .item-content {
            gap: 0.75rem;
          }

          .item-revenue {
            text-align: left;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        [dir='rtl'] .item-stats,
        [dir='rtl'] .item-revenue {
          direction: rtl;
        }
      `}</style>
    </div>
  );
};

export default TopSellingItems;
