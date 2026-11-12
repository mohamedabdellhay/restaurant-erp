import { memo, useCallback, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Users,
  Calendar,
  LayoutDashboard,
  UtensilsCrossed,
  SquareMenu,
  ChefHat,
  ShoppingCart,
  Receipt,
  Package,
  Truck,
  ChevronLeft,
  Settings,
  LogOut,
  Shield,
  Building2,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useRestaurant } from "../hooks/useRestaurant";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import "./Sidebar.css";

const PLATFORM_ITEMS = [
  { label: "platform.overview", icon: LayoutDashboard, path: "/platform/overview" },
  { label: "platform.restaurants", icon: Building2, path: "/platform/restaurants" },
  { label: "platform.plans", icon: CreditCard, path: "/platform/plans" },
  { label: "platform.subscriptions", icon: Receipt, path: "/platform/subscriptions" },
  { label: "platform.settings", icon: Settings, path: "/platform/settings", footer: true },
];

const NAV_ITEMS = [
  { label: "nav.dashboard", icon: LayoutDashboard, path: "/dashboard", permission: "view_dashboard" },
  { label: "nav.orders", icon: ShoppingCart, path: "/orders", permission: "view_orders" },
  { label: "nav.reservations", icon: Calendar, path: "/reservations", permission: "view_reservations" },
  { label: "nav.menu", icon: SquareMenu, path: "/menu", permission: "view_menu" },
  { label: "nav.tables", icon: UtensilsCrossed, path: "/tables", permission: "view_tables" },
  { label: "nav.departments", icon: ChefHat, path: "/departments", permission: "view_departments" },
  { label: "nav.staff", icon: Users, path: "/staff", permission: "view_staff" },
  { label: "nav.inventory", icon: Package, path: "/inventory", permission: "view_inventory" },
  { label: "nav.suppliers", icon: Truck, path: "/suppliers", permission: "view_inventory" },
  { label: "nav.invoices", icon: Receipt, path: "/invoices", permission: "view_invoices" },
  { label: "nav.reports", icon: BarChart3, path: "/reports", permission: "view_reports" },
  { label: "nav.roles", icon: Shield, path: "/roles", permission: "view_roles" },
  { label: "nav.settings", icon: Settings, path: "/settings", permission: "manage_settings", footer: true },
];

function readableText(color) {
  const hex = String(color || "").trim().replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((part) => part + part).join("") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return "#f8fafc";
  const red = parseInt(full.slice(0, 2), 16);
  const green = parseInt(full.slice(2, 4), 16);
  const blue = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.62 ? "#0f172a" : "#f8fafc";
}

const NavItem = memo(function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} className="nav-link">
      <Icon size={22} />
      <span>{label}</span>
    </NavLink>
  );
});

function showDefaultLogo(event) {
  const image = event.currentTarget;
  if (image.dataset.fallback === "1") {
    image.style.display = "none";
    return;
  }
  image.dataset.fallback = "1";
  image.src = "/restaurant-logo.svg";
}

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout, hasPermission } = useAuth();
  const { getBusinessLogo, getThemeColors } = useRestaurant();
  const { restaurantSettings } = useTheme();
  const { t, i18n } = useTranslation();

  const themeColors = getThemeColors();
  const savedTheme = restaurantSettings?.theme;
  const sidebarColors = useMemo(() => {
    const primary = savedTheme?.primaryColor || themeColors.primary;
    const secondary = savedTheme?.secondaryColor || themeColors.secondary;
    const accent = savedTheme?.accentColor || themeColors.accent;
    return {
      "--sidebar-primary": primary,
      "--sidebar-secondary": secondary,
      "--sidebar-accent": accent,
      "--sidebar-bg": secondary,
      "--sidebar-fg": readableText(secondary),
    };
  }, [
    savedTheme?.primaryColor,
    savedTheme?.secondaryColor,
    savedTheme?.accentColor,
    themeColors.primary,
    themeColors.secondary,
    themeColors.accent,
  ]);

  const menuItems = useMemo(() => {
    if (!user) return [];
    if (user.isPlatformOwner) return PLATFORM_ITEMS;
    return NAV_ITEMS.filter(
      (item) => !item.permission || hasPermission(item.permission),
    );
  }, [user, hasPermission]);

  const toggle = useCallback(() => {
    setIsOpen((open) => !open);
  }, [setIsOpen]);

  const logo = getBusinessLogo();
  const mainItems = menuItems.filter((item) => !item.footer);
  const footerItems = menuItems.filter((item) => item.footer);

  return (
    <aside
      className={`sidebar ${!isOpen ? "collapsed" : ""} ${i18n.dir() === "rtl" ? "rtl" : ""}`}
      style={sidebarColors}
    >
      <div className="sidebar-header">
        {isOpen && (
          <img
            key={logo}
            src={logo}
            alt=""
            className="sidebar-logo"
            onError={showDefaultLogo}
          />
        )}
        <button type="button" onClick={toggle} className="toggle-btn" aria-label="Toggle sidebar">
          <ChevronLeft size={20} className={!isOpen ? "rotate" : ""} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {mainItems.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={t(item.label)}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        {footerItems.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={t(item.label)}
          />
        ))}
        <button type="button" onClick={logout} className="nav-link logout-btn">
          <LogOut size={22} />
          <span>{t("nav.logout")}</span>
        </button>
      </div>
    </aside>
  );
};

export default memo(Sidebar);
