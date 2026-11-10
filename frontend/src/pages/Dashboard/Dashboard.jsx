import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Users,
  Package,
  ChefHat,
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
import PageHeader from "@components/PageHeader";
import "./Dashboard.css";

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, hasPermission } = useAuth();
  const { getThemeColors, getRestaurantName } = useRestaurant();
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

  const localISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const todayISO = localISO(today);
  const monthStart = localISO(new Date(today.getFullYear(), today.getMonth(), 1));
  const presets = [
    { id: "all", label: t("dashboard.all_time"), range: {} },
    {
      id: "7",
      label: t("dashboard.last_7_days"),
      range: {
        from: localISO(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
        to: todayISO,
      },
    },
    {
      id: "30",
      label: t("dashboard.last_30_days"),
      range: {
        from: localISO(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)),
        to: todayISO,
      },
    },
    {
      id: "month",
      label: t("dashboard.this_month"),
      range: { from: monthStart, to: todayISO },
    },
  ];
  const activePreset =
    presets.find(
      (preset) =>
        (preset.range.from || "") === (dateRange.from || "") &&
        (preset.range.to || "") === (dateRange.to || ""),
    )?.id || "";
  const showDateFilter = activeTab !== "realtime" && activeTab !== "inventory";
  const todayLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
      style={{
        "--primary": themeColors.primary,
        "--primary-focus": themeColors.primaryFocus,
        "--primary-content": themeColors.primaryContent,
      }}
    >
      <PageHeader
        icon={BarChart3}
        eyebrow={getRestaurantName()}
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
      >
        <time className="today-chip" dateTime={todayISO}>
          {todayLabel}
        </time>
      </PageHeader>

      {paymentStatus && (
        <div className={`payment-banner ${paymentStatus.type}`}>
          <div className="payment-banner-copy">
            {paymentStatus.type === "success" ? (
              <CheckCircle2 size={22} />
            ) : (
              <XCircle size={22} />
            )}
            <div>
              <h3>{paymentStatus.title}</h3>
              <p>{paymentStatus.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaymentStatus(null)}
            aria-label={t("common.close") || "Close"}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="dashboard-tabs">
        <nav className="tabs-nav" aria-label={t("dashboard.title")}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {showDateFilter && (
        <div className="dashboard-toolbar">
          <div className="preset-group" role="group" aria-label={t("dashboard.date_range")}>
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-btn ${activePreset === preset.id ? "active" : ""}`}
                onClick={() => handleDateRangeChange(preset.range)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor="dashboard-from">
              {t("dashboard.date_range")}
            </label>
            <input
              id="dashboard-from"
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
              aria-label={t("dashboard.to")}
              value={dateRange.to || ""}
              onChange={(e) =>
                handleDateRangeChange({ ...dateRange, to: e.target.value })
              }
              className="date-input"
            />
          </div>
        </div>
      )}

      <div className="dashboard-content">{renderTabContent()}</div>
    </div>
  );
};

export default Dashboard;
