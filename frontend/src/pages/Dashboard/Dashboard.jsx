import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Users,
  Package,
  ChefHat,
  TrendingUp,
  Activity,
  Calendar,
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
import { NavLink, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle, X } from "lucide-react";
import "./Dashboard.css";
import "@components/dashboard/sections.css";

const Dashboard = () => {
  const { t } = useTranslation();
  const { section } = useParams();
  const { user, hasPermission } = useAuth();
  const { getRestaurantName } = useRestaurant();
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
  const activeTab = tabs.some((tab) => tab.id === section) ? section : "";

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

  if (!activeTab) {
    return <Navigate to={`/dashboard/${tabs[0]?.id || "overview"}`} replace />;
  }

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
    <div className="dashboard">
      <div className="fa-dash-head">
        <h1>{t("nav.dashboard")}</h1>
        <p className="fa-welcome">
          {t("dashboard.welcome_banner", { name: getRestaurantName() })}
        </p>
      </div>

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
            <NavLink key={tab.id} to={`/dashboard/${tab.id}`} className="tab-btn">
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {showDateFilter && (
        <div className="dashboard-toolbar">
          <div className="fa-field fa-outlet">
            <span>{t("dashboard.select_outlet")}</span>
            <strong>{getRestaurantName()}</strong>
          </div>
          <div className="fa-toolbar-end">
            <select
              className="fa-field"
              aria-label={t("dashboard.date_range")}
              value={activePreset || "custom"}
              onChange={(event) => {
                const preset = presets.find((item) => item.id === event.target.value);
                if (preset) handleDateRangeChange(preset.range);
              }}
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">{t("dashboard.date_range")}</option>
            </select>
            <div className="fa-field fa-dates">
              <Calendar size={15} aria-hidden="true" />
              <input
                id="dashboard-from"
                type="date"
                aria-label={t("dashboard.date_range")}
                value={dateRange.from || ""}
                onChange={(e) =>
                  handleDateRangeChange({ ...dateRange, from: e.target.value })
                }
              />
              <span>{t("dashboard.to")}</span>
              <input
                type="date"
                aria-label={t("dashboard.to")}
                value={dateRange.to || ""}
                onChange={(e) =>
                  handleDateRangeChange({ ...dateRange, to: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">{renderTabContent()}</div>
    </div>
  );
};

export default Dashboard;
