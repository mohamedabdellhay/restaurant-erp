import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Users,
  Calendar,
  Package,
  ChefHat,
  Settings,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import { useRestaurant } from "@hooks/useRestaurant";
import DashboardOverview from "@components/dashboard/DashboardOverview";
import RevenueAnalytics from "@components/dashboard/RevenueAnalytics";
import TopSellingItems from "@components/dashboard/TopSellingItems";
import StaffPerformance from "@components/dashboard/StaffPerformance";
import CustomerAnalytics from "@components/dashboard/CustomerAnalytics";
import RealTimeMetrics from "@components/dashboard/RealTimeMetrics";
import InventoryAlerts from "@components/dashboard/InventoryAlerts";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, X } from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, hasPermission } = useAuth();
  const { getThemeColors } = useRestaurant();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({});
  const [paymentStatus, setPaymentStatus] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentParams = searchParams.get("payment");

    if (paymentParams === "success") {
      setPaymentStatus({
        type: "success",
        title: t("payment.success_title") || "Payment Successful",
        message: t("payment.success_desc") || "Your payment was processed successfully."
      });
      // Clean up URL
      searchParams.delete("payment");
      navigate({ search: searchParams.toString() }, { replace: true });
    } else if (paymentParams === "failed") {
      setPaymentStatus({
        type: "error",
        title: t("payment.failed_title") || "Payment Failed",
        message: t("payment.failed_desc") || "Something went wrong with your transaction."
      });
      // Clean up URL
      searchParams.delete("payment");
      navigate({ search: searchParams.toString() }, { replace: true });
    }

    // Auto-hide after 8 seconds
    if (paymentParams) {
      const timer = setTimeout(() => {
        setPaymentStatus(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [location.search, navigate, t]);

  // Get theme colors
  const themeColors = getThemeColors();

  const allTabs = [
    {
      id: "overview",
      label: t("dashboard.overview"),
      icon: <BarChart3 size={18} />,
      requiredPermission: "view_dashboard",
    },
    {
      id: "realtime",
      label: t("dashboard.real_time"),
      icon: <Activity size={18} />,
      requiredPermission: "view_dashboard",
    },
    {
      id: "revenue",
      label: t("dashboard.revenue"),
      icon: <TrendingUp size={18} />,
      requiredPermission: "view_reports",
    },
    {
      id: "items",
      label: t("dashboard.top_items"),
      icon: <Package size={18} />,
      requiredPermission: "view_reports",
    },
    {
      id: "staff",
      label: t("dashboard.staff"),
      icon: <ChefHat size={18} />,
      requiredPermission: "view_staff",
    },
    {
      id: "customers",
      label: t("dashboard.customers"),
      icon: <Users size={18} />,
      requiredPermission: "view_staff", // Using view_staff as proxy for customers if view_customers doesn't exist
    },
    {
      id: "inventory",
      label: t("dashboard.inventory_alerts"),
      icon: <Package size={18} />,
      requiredPermission: "view_inventory",
    },
  ];

  // Filter tabs based on user permissions
  const tabs = allTabs.filter((tab) => {
    if (!user) return false;
    return hasPermission(tab.requiredPermission);
  });

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview dateRange={dateRange} />;
      case "realtime":
        return <RealTimeMetrics />;
      case "revenue":
        return <RevenueAnalytics dateRange={dateRange} />;
      case "items":
        return <TopSellingItems dateRange={dateRange} />;
      case "staff":
        return <StaffPerformance dateRange={dateRange} />;
      case "customers":
        return <CustomerAnalytics dateRange={dateRange} />;
      case "inventory":
        return <InventoryAlerts />;
      default:
        return <DashboardOverview dateRange={dateRange} />;
    }
  };

  return (
    <div
      className="dashboard-page"
      style={{
        "--primary": themeColors.primary,
        "--primary-focus": themeColors.primaryFocus,
        "--primary-content": themeColors.primaryContent,
      }}
    >
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="page-title">{t("dashboard.title")}</h1>
        <p className="page-subtitle">{t("dashboard.subtitle")}</p>
      </div>

      {/* Payment Status Notification Banner */}
      {paymentStatus && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 ${paymentStatus.type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
          }`}>
          <div className="flex gap-3 items-center">
            {paymentStatus.type === "success" ? (
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={24} />
            ) : (
              <XCircle className="text-red-500 flex-shrink-0" size={24} />
            )}
            <div>
              <h3 className="font-bold">{paymentStatus.title}</h3>
              <p className="text-sm opacity-90">{paymentStatus.message}</p>
            </div>
          </div>
          <button
            onClick={() => setPaymentStatus(null)}
            className="p-1 rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="dashboard-filter">
        <div className="filter-content">
          <div className="filter-group">
            <label className="filter-label">{t("dashboard.date_range")}:</label>
            <input
              type="date"
              value={dateRange.from || ""}
              onChange={(e) =>
                handleDateRangeChange({ ...dateRange, from: e.target.value })
              }
              className="date-input"
            />
            <span className="filter-separator">{t("dashboard.to")}</span>
            <input
              type="date"
              value={dateRange.to || ""}
              onChange={(e) =>
                handleDateRangeChange({ ...dateRange, to: e.target.value })
              }
              className="date-input"
            />
          </div>
          <div className="filter-actions">
            <button
              onClick={() => handleDateRangeChange({})}
              className="btn btn-secondary"
            >
              {t("dashboard.clear_dates")}
            </button>
            <button
              onClick={() =>
                handleDateRangeChange({
                  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                  to: new Date().toISOString().split("T")[0],
                })
              }
              className="btn btn-outline"
            >
              {t("dashboard.last_7_days")}
            </button>
            <button
              onClick={() =>
                handleDateRangeChange({
                  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                  to: new Date().toISOString().split("T")[0],
                })
              }
              className="btn btn-outline"
            >
              {t("dashboard.last_30_days")}
            </button>
            <button
              onClick={() =>
                handleDateRangeChange({
                  from: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1,
                  )
                    .toISOString()
                    .split("T")[0],
                  to: new Date().toISOString().split("T")[0],
                })
              }
              className="btn btn-outline"
            >
              {t("dashboard.this_month")}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <nav className="tabs-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">{renderTabContent()}</div>
    </div>
  );
};

export default Dashboard;
