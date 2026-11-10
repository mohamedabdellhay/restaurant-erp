
import React from "react";
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
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useRestaurant } from "../hooks/useRestaurant";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout, hasPermission } = useAuth();
  const { getRestaurantName, getThemeColors } = useRestaurant();
  const { restaurantSettings } = useTheme();
  const { t, i18n } = useTranslation();

  const savedTheme = restaurantSettings?.theme;
  const fallbackTheme = getThemeColors();
  const sidebarColors = {
    "--sidebar-primary": savedTheme?.primaryColor || fallbackTheme.primary,
    "--sidebar-secondary": savedTheme?.secondaryColor || fallbackTheme.secondary,
    "--sidebar-accent": savedTheme?.accentColor || fallbackTheme.accent,
  };

  // Define all possible menu items with their required permissions
  const allMenuItems = [
    {
      name: t("nav.dashboard"),
      icon: LayoutDashboard,
      path: "/dashboard",
      requiredPermission: "view_dashboard",
    },
    {
      name: t("nav.orders"),
      icon: ShoppingCart,
      path: "/orders",
      requiredPermission: "view_orders",
    },
    {
      name: t("nav.reservations"),
      icon: Calendar,
      path: "/reservations",
      requiredPermission: "view_reservations",
    },
    {
      name: t("nav.menu"),
      icon: SquareMenu,
      path: "/menu",
      requiredPermission: "view_menu",
    },
    {
      name: t("nav.tables"),
      icon: UtensilsCrossed,
      path: "/tables",
      requiredPermission: "view_tables",
    },
    {
      name: t("nav.departments"),
      icon: ChefHat,
      path: "/departments",
      requiredPermission: "view_departments",
    },
    {
      name: t("nav.staff"),
      icon: Users,
      path: "/staff",
      requiredPermission: "view_staff",
    },
    {
      name: t("nav.inventory"),
      icon: Package,
      path: "/inventory",
      requiredPermission: "view_inventory",
    },
    {
      name: t("nav.suppliers"),
      icon: Truck,
      path: "/suppliers",
      requiredPermission: "view_inventory",
    },
    {
      name: t("nav.invoices"),
      icon: Receipt,
      path: "/invoices",
      requiredPermission: "view_invoices",
    },
    {
      name: t("nav.reports"),
      icon: BarChart3,
      path: "/reports",
      requiredPermission: "view_reports",
    },
    {
      name: t("nav.settings"),
      icon: Settings,
      path: "/settings",
      requiredPermission: "manage_settings",
    },
    {
      name: t("nav.roles"),
      icon: Shield,
      path: "/roles",
      requiredPermission: "view_roles",
    },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter((item) => {
    if (!user) return false;
    // If no specific permission is required, show it to all logged-in users
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  const isRTL = i18n.dir() === "rtl";

  return (
    <aside
      className={`sidebar ${!isOpen ? "collapsed" : ""} ${isRTL ? "rtl" : ""}`}
      style={sidebarColors}
    >
      <div className="sidebar-header">
        {isOpen && (
          <div className="logo-text">
            {getThemeColors().logo ? (
              <img
                src={getThemeColors().logo}
                alt="Restaurant Logo"
                className="sidebar-logo"
                onError={(e) => {
                  console.error(
                    "Sidebar logo failed to load:",
                    getThemeColors().logo,
                  );
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <>
                <span className="restaurant-name">{getRestaurantName()}</span>
                <span>ERP</span>
              </>
            )}
          </div>
        )}
        <button onClick={() => setIsOpen(!isOpen)} className="toggle-btn">
          <ChevronLeft size={20} className={!isOpen ? "rotate" : ""} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <item.icon size={22} />
            {isOpen && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {hasPermission("manage_settings") && (
          <NavLink to="/settings" className="nav-link">
            <Settings size={22} />
            {isOpen && <span>{t("nav.settings")}</span>}
          </NavLink>
        )}
        <button onClick={logout} className="nav-link logout-btn">
          <LogOut size={22} />
          {isOpen && <span>{t("nav.logout")}</span>}
        </button>
      </div>

      <style>{`
        .sidebar {
          width: 260px;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--sidebar-primary) 18%, var(--bg-sidebar)) 0%,
              color-mix(in srgb, var(--sidebar-secondary) 12%, var(--bg-sidebar)) 100%
            );
          border-inline-end: 1px solid color-mix(in srgb, var(--sidebar-primary) 24%, var(--border-color));
          display: flex;
          flex-direction: column;
          transition: width var(--transition-normal);
          position: fixed;
          top: 0;
          inset-inline-start: 0;
          height: 100vh;
          height: 100dvh;
          overflow-y: auto;
          z-index: 100;
        }

        .sidebar.collapsed {
          width: 80px;
        }

        .sidebar-header {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid color-mix(in srgb, var(--sidebar-primary) 20%, var(--border-color));
          height: 70px;
        }

        .logo-text {
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sidebar-logo {
          height: 32px;
          max-width: 100px;
          object-fit: contain;
          border-radius: var(--radius-sm);
        }

        .logo-text span {
          color: var(--sidebar-primary);
        }

        .toggle-btn {
          color: var(--text-secondary);
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }

        .toggle-btn:hover {
          background: color-mix(in srgb, var(--sidebar-primary) 14%, transparent);
          color: var(--sidebar-primary);
        }

        .toggle-btn .rotate {
          transform: rotate(180deg);
        }

        .sidebar-nav {
          padding: 1.5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 0.875rem 1.5rem;
          color: var(--text-secondary);
          gap: 1rem;
          transition: all 0.2s;
          border-left: 3px solid transparent;
          position: relative;
        }

        [dir='rtl'] .nav-link {
          border-left: none;
          border-right: 3px solid transparent;
        }

        .sidebar.collapsed .nav-link {
          justify-content: center;
          padding: 0.875rem;
        }

        .nav-link:hover {
          background: color-mix(in srgb, var(--sidebar-primary) 10%, transparent);
          color: var(--sidebar-primary);
          transform: translateX(2px);
        }

        [dir='rtl'] .nav-link:hover {
          transform: translateX(-2px);
        }

        .nav-link.active {
          background: linear-gradient(90deg, color-mix(in srgb, var(--sidebar-primary) 16%, transparent), transparent);
          color: var(--sidebar-primary);
          border-left-color: var(--sidebar-primary);
          font-weight: 600;
        }

        [dir='rtl'] .nav-link.active {
          border-left-color: transparent;
          border-right-color: var(--sidebar-primary);
        }

        .nav-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--sidebar-primary);
          box-shadow: 0 0 8px color-mix(in srgb, var(--sidebar-primary) 35%, transparent);
        }

        [dir='rtl'] .nav-link.active::before {
          left: auto;
          right: 0;
        }

        .nav-link svg {
          transition: all 0.2s;
        }

        .nav-link:hover svg {
          transform: scale(1.1);
        }

        .nav-link.active svg {
          color: var(--sidebar-accent);
          filter: drop-shadow(0 0 4px color-mix(in srgb, var(--sidebar-accent) 35%, transparent));
        }

        .sidebar-footer {
          padding: 1.5rem 0;
          border-top: 1px solid color-mix(in srgb, var(--sidebar-primary) 20%, var(--border-color));
        }

        .logout-btn {
          width: 100%;
          text-align: left;
        }

        .logout-btn:hover {
          color: var(--danger);
          background: var(--danger)15;
          transform: translateX(2px);
        }

        [dir='rtl'] .logout-btn:hover {
          transform: translateX(-2px);
        }

        .logout-btn:hover svg {
          color: var(--danger);
          transform: scale(1.1);
        }

        /* Active state animation */
        .nav-link.active {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        [dir='rtl'] @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
