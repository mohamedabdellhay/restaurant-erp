import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Package,
  AlertTriangle,
  RefreshCw,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import dashboardService from "../../services/dashboardService";
import "./InventoryAlerts.css";

const InventoryAlerts = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInventoryAlerts();
  }, []);

  const fetchInventoryAlerts = async () => {
    try {
      const response = await dashboardService.getInventoryAlerts();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to fetch inventory alerts");
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

  const getStockLevelColor = (stock, minStock) => {
    if (stock <= 0) return "status-out-of-stock";
    if (stock <= minStock * 0.5) return "status-critical";
    if (stock <= minStock) return "status-low";
    return "status-normal";
  };

  const getStockLevelText = (stock, minStock) => {
    if (stock <= 0) return t("dashboard.out_of_stock");
    if (stock <= minStock * 0.5) return t("dashboard.critical_low");
    if (stock <= minStock) return t("dashboard.low_stock");
    return t("dashboard.in_stock");
  };

  const getStockStatus = (stockPercentage) => {
    if (stockPercentage <= 0) return "out-of-stock";
    if (stockPercentage <= 50) return "critical";
    if (stockPercentage <= 100) return "low";
    return "normal";
  };

  if (loading) {
    return (
      <div className="inventory-alerts">
        <div className="skeleton skeleton-header"></div>
        <div className="summary-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-line short"></div>
              <div className="skeleton skeleton-line medium"></div>
            </div>
          ))}
        </div>
        <div className="alerts-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-item">
              <div className="skeleton skeleton-line long"></div>
              <div className="skeleton skeleton-line medium"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const summaryCards = [
    {
      title: t("dashboard.total_items"),
      value: formatNumber(data.totalItems || 0),
      icon: <Package size={24} />,
      color: "var(--primary)",
      bgColor: "var(--primary-bg)",
    },
    {
      title: t("dashboard.total_inventory_value"),
      value: formatCurrency(data.totalInventoryValue || 0),
      icon: <DollarSign size={24} />,
      color: "var(--success)",
      bgColor: "var(--success-bg)",
    },
    {
      title: t("dashboard.low_stock_items"),
      value: formatNumber(data.lowStockCount || 0),
      icon: <AlertTriangle size={24} />,
      color: "var(--warning)",
      bgColor: "var(--warning-bg)",
    },
  ];

  return (
    <div className="inventory-alerts">
      <div className="section-header">
        <h2 className="section-title">{t("dashboard.inventory_alerts")}</h2>
        <button onClick={fetchInventoryAlerts} className="refresh-btn">
          <RefreshCw size={18} className="refresh-icon" />
          {t("dashboard.refresh")}
        </button>
      </div>
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-header">
            <Package size={24} className="summary-icon" />
            <h3 className="summary-title">{t("dashboard.total_items")}</h3>
          </div>
          <div className="summary-value">{formatNumber(data.totalItems)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-header">
            <DollarSign size={24} className="summary-icon" />
            <h3 className="summary-title">
              {t("dashboard.total_inventory_value")}
            </h3>
          </div>
          <div className="summary-value">
            {formatCurrency(data.totalInventoryValue)}
          </div>
        </div>
      </div>
      <div className="alerts-section">
        <h3 className="section-title">{t("dashboard.low_stock_items")}</h3>

        {data.lowStockItems?.length === 0 ? (
          <div className="empty-state">
            <Package size={48} className="empty-icon" />
            <h3 className="empty-title">{t("dashboard.all_items_in_stock")}</h3>
            <p className="empty-description">
              {t("dashboard.all_items_in_stock_description")}
            </p>
          </div>
        ) : (
          <div className="alerts-list">
            {data.lowStockItems?.map((item, index) => {
              const stockPercentage = (item.currentStock / item.minStock) * 100;
              const stockStatus = getStockStatus(stockPercentage);

              return (
                <div
                  key={item._id || index}
                  className={`alert-item ${stockStatus}`}
                >
                  <div className="item-content">
                    <div className="item-info">
                      <h3 className="item-name">{item.name}</h3>
                      <div className="item-details">
                        <span className="item-category">{item.category}</span>
                        <span className="item-separator">•</span>
                        <span className="item-quantity">
                          {item.currentStock} / {item.minStock}
                        </span>
                      </div>
                    </div>
                    <div className="item-metrics">
                      <div className="metric-item">
                        <div className="metric-value">
                          {formatCurrency(item.value)}
                        </div>
                        <div className="metric-label">Value</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">
                          {formatNumber(item.currentStock)}
                        </div>
                        <div className="metric-label">Current Stock</div>
                      </div>
                    </div>
                  </div>
                  <div className="alert-actions">
                    {stockStatus === "critical" && (
                      <div className="alert-badge critical">
                        <AlertTriangle size={16} className="alert-icon" />
                        <span>{t("dashboard.critical_low")}</span>
                      </div>
                    )}
                    <button className="reorder-btn">
                      <ShoppingCart size={16} className="btn-icon" />
                      {t("dashboard.reorder")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {data.lowStockCount > 0 && (
        <div className="alert-banner">
          <AlertTriangle size={24} className="alert-icon" />
          <div className="alert-content">
            <h4 className="alert-title">
              {t("dashboard.low_stock_warning", { count: data.lowStockCount })}
            </h4>
            <p className="alert-description">
              {t("dashboard.low_stock_warning", { count: data.lowStockCount })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAlerts;
