import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Gauge,
  Layers,
  LayoutDashboard,
  LogOut,
  Monitor,
  Settings,
  Truck,
  TrendingUp,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useRestaurant } from "../hooks/useRestaurant";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import "./Sidebar.css";

const NAV_ENTRIES = [
  { kind: "link", label: "nav.dashboard", icon: Gauge, path: "/dashboard/overview", match: "/dashboard", permission: "view_dashboard" },
  {
    kind: "group",
    label: "nav.group_sales",
    icon: DollarSign,
    items: [
      { label: "nav.orders", path: "/orders", permission: "view_orders" },
      { label: "nav.waiting", path: "/waiting", permission: "view_orders" },
      { label: "nav.reservations", path: "/reservations", permission: "view_reservations" },
    ],
  },
  { kind: "link", label: "nav.kds", icon: Monitor, path: "/kds", permission: "view_orders" },
  {
    kind: "group",
    label: "nav.group_purchase",
    icon: Layers,
    items: [
      { label: "nav.purchase", path: "/purchases", permission: "view_inventory" },
      { label: "nav.po", path: "/purchase-orders", permission: "view_inventory" },
      { label: "nav.requisition", path: "/requisitions", permission: "view_inventory" },
      { label: "nav.receive", path: "/requisitions/receive", permission: "view_inventory" },
    ],
  },
  {
    kind: "group",
    label: "nav.group_stock",
    icon: Warehouse,
    items: [
      { label: "nav.inventory", path: "/inventory", permission: "view_inventory" },
      { label: "nav.stock_count", path: "/stock-count", permission: "view_inventory" },
      { label: "nav.purchase_return", path: "/purchase-returns", permission: "view_inventory" },
    ],
  },
  {
    kind: "group",
    label: "nav.group_finance",
    icon: TrendingUp,
    items: [
      { label: "nav.invoices", path: "/invoices", permission: "view_invoices" },
    ],
  },
  {
    kind: "group",
    label: "nav.group_suppliers",
    icon: Truck,
    items: [
      { label: "nav.suppliers", path: "/suppliers", permission: "view_inventory" },
    ],
  },
  {
    kind: "group",
    label: "nav.group_menu",
    icon: UtensilsCrossed,
    items: [
      { label: "nav.menu", path: "/menu", permission: "view_menu" },
      { label: "nav.tables", path: "/tables", permission: "view_tables" },
    ],
  },
  { kind: "link", label: "nav.reports", icon: BarChart3, path: "/reports", permission: "view_reports" },
  {
    kind: "group",
    label: "nav.group_setup",
    icon: Settings,
    items: [
      { label: "nav.departments", path: "/departments", permission: "view_departments" },
      { label: "nav.staff", path: "/staff", permission: "view_staff" },
      { label: "nav.roles", path: "/roles", permission: "view_roles" },
      { label: "nav.settings", path: "/settings/general", match: "/settings", permission: "manage_settings" },
    ],
  },
];

const PLATFORM_ENTRIES = [
  { kind: "link", label: "platform.overview", icon: LayoutDashboard, path: "/admin/overview" },
  { kind: "link", label: "platform.restaurants", icon: Building2, path: "/admin/restaurants" },
  {
    kind: "group",
    label: "platform.group_billing",
    icon: CreditCard,
    items: [
      { label: "platform.plans", path: "/admin/plans" },
      { label: "platform.subscriptions", path: "/admin/subscriptions" },
    ],
  },
];

const PLATFORM_SETTINGS = {
  kind: "link",
  label: "platform.settings",
  icon: Settings,
  path: "/admin/settings",
};

function isCurrent(item, pathname) {
  if (item.path === "/requisitions") return pathname === "/requisitions";
  const base = item.match || item.path;
  return pathname === base || pathname.startsWith(`${base}/`);
}

function visibleEntries(entries, hasPermission) {
  return entries.flatMap((entry) => {
    if (entry.kind === "link") {
      return !entry.permission || hasPermission(entry.permission) ? [entry] : [];
    }
    const items = entry.items.filter((item) => !item.permission || hasPermission(item.permission));
    return items.length ? [{ ...entry, items }] : [];
  });
}

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

const NavItem = memo(function NavItem({ to, icon: Icon, label, match, pathname }) {
  return (
    <NavLink
      to={to}
      end={!match}
      className={({ isActive }) => `nav-link${match ? (isCurrent({ path: to, match }, pathname) ? " active" : "") : isActive ? " active" : ""}`}
    >
      <Icon size={18} />
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
  const navigate = useNavigate();
  const exitTo = useRef(null);

  useEffect(() => {
    if (!exitTo.current || user) return;
    const next = exitTo.current;
    exitTo.current = null;
    navigate(next);
  }, [user, navigate]);

  const { getBusinessLogo, getRestaurantName, getThemeColors } = useRestaurant();
  const { restaurantSettings } = useTheme();
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

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

  const menu = useMemo(() => {
    if (!user) return { entries: [], footer: [] };
    if (user.isPlatformOwner) {
      return { entries: PLATFORM_ENTRIES, footer: [PLATFORM_SETTINGS] };
    }
    return { entries: visibleEntries(NAV_ENTRIES, hasPermission), footer: [] };
  }, [user, hasPermission]);

  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    const current = menu.entries.find(
      (entry) => entry.kind === "group" && entry.items.some((item) => isCurrent(item, pathname)),
    );
    if (!current) return;
    setOpenGroups((groups) => (groups[current.label] && Object.keys(groups).length === 1 ? groups : { [current.label]: true }));
  }, [menu.entries, pathname]);

  const toggleGroup = useCallback((label) => {
    if (!isOpen) setIsOpen(true);
    setOpenGroups((groups) => ({ [label]: isOpen ? !groups[label] : true }));
  }, [isOpen, setIsOpen]);

  const toggle = useCallback(() => {
    setIsOpen((open) => !open);
  }, [setIsOpen]);

  const logo = getBusinessLogo();

  return (
    <aside
      className={`sidebar ${!isOpen ? "collapsed" : ""} ${i18n.dir() === "rtl" ? "rtl" : ""}`}
      style={sidebarColors}
    >
      <div className="sidebar-header">
        {isOpen && (
          <div className="sidebar-brand">
            <img
              key={logo}
              src={logo}
              alt=""
              className="sidebar-logo"
              onError={showDefaultLogo}
            />
            <span className="sidebar-brand-name">{getRestaurantName()}</span>
          </div>
        )}
        <button type="button" onClick={toggle} className="toggle-btn" aria-label="Toggle sidebar">
          <ChevronLeft size={18} className={!isOpen ? "rotate" : ""} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menu.entries.map((entry) => {
          if (entry.kind === "link") {
            return (
              <NavItem
                key={entry.path}
                to={entry.path}
                icon={entry.icon}
                label={t(entry.label)}
                match={entry.match}
                pathname={pathname}
              />
            );
          }
          const current = entry.items.some((item) => isCurrent(item, pathname));
          const expanded = Boolean(openGroups[entry.label]);
          return (
            <div className={`nav-group${expanded ? " open" : ""}`} key={entry.label}>
              <button
                type="button"
                className={`nav-link nav-parent${current ? " active" : ""}`}
                aria-expanded={expanded}
                onClick={() => toggleGroup(entry.label)}
              >
                <entry.icon size={18} />
                <span>{t(entry.label)}</span>
                <ChevronRight size={16} className="nav-chevron" />
              </button>
              {expanded && (
                <div className="nav-sub">
                  {entry.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={!item.match}
                      className={({ isActive }) => `nav-sublink${item.match ? (isCurrent(item, pathname) ? " active" : "") : isActive ? " active" : ""}`}
                    >
                      {t(item.label)}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {menu.footer.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={t(item.label)}
            match={item.match}
            pathname={pathname}
          />
        ))}
        <button
          type="button"
          onClick={() => {
            exitTo.current = user?.isPlatformOwner ? "/admin/login" : "/login";
            logout();
          }}
          className="nav-link logout-btn"
        >
          <LogOut size={18} />
          <span>{t("nav.logout")}</span>
        </button>
      </div>
    </aside>
  );
};

export default memo(Sidebar);
