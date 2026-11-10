import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Crown,
  User,
  ChefHat,
  Wallet,
  CreditCard,
} from "lucide-react";
import dashboardService from "../../services/dashboardService";

const StaffPerformance = ({ dateRange = {} }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("totalRevenue");

  useEffect(() => {
    fetchStaffPerformance();
  }, [dateRange, sortBy]);

  const fetchStaffPerformance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const response = await dashboardService.getStaffPerformance(params);
      if (response.success) {
        setStaff(response.data);
      } else {
        setError(response.message || "Failed to fetch staff performance");
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

  const sortedStaff = [...staff].sort((a, b) => {
    switch (sortBy) {
      case "totalRevenue":
        return b.totalRevenue - a.totalRevenue;
      case "totalOrders":
        return b.totalOrders - a.totalOrders;
      case "averageOrderValue":
        return b.averageOrderValue - a.averageOrderValue;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return <Crown size={20} />;
      case "manager":
        return <User size={20} />;
      case "waiter":
      case "server":
        return <Users size={20} />;
      case "chef":
      case "cook":
        return <ChefHat size={20} />;
      case "cashier":
        return <CreditCard size={20} />;
      default:
        return <User size={20} />;
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "waiter":
      case "server":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "chef":
      case "cook":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "cashier":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className=" rounded-lg shadow-sm p-6">
        <div className="h-8  rounded w-48 mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4  rounded-lg animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10  rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4  rounded w-32 mb-2"></div>
                  <div className="h-3  rounded w-24"></div>
                </div>
              </div>
              <div className="flex gap-8">
                <div className="text-right">
                  <div className="h-4  rounded w-16 mb-2"></div>
                  <div className="h-3   rounded w-12"></div>
                </div>
                <div className="text-right">
                  <div className="h-4   rounded w-16 mb-2"></div>
                  <div className="h-3   rounded w-12"></div>
                </div>
                <div className="text-right">
                  <div className="h-4   rounded w-16 mb-2"></div>
                  <div className="h-3   rounded w-12"></div>
                </div>
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
    <div className="staff-performance">
      <div className="section-header">
        <h2 className="section-title">{t("dashboard.staff_performance")}</h2>
        <div className="header-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select-input"
          >
            <option value="totalRevenue">
              {t("dashboard.sort_by_revenue")}
            </option>
            <option value="totalOrders">{t("dashboard.sort_by_orders")}</option>
            <option value="averageOrderValue">
              {t("dashboard.sort_by_avg_order")}
            </option>
            <option value="name">{t("dashboard.sort_by_name")}</option>
          </select>
          {dateRange.from && dateRange.to && (
            <span className="date-range">
              {new Date(dateRange.from).toLocaleDateString()} -{" "}
              {new Date(dateRange.to).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {staff.length === 0 ? (
        <div className="empty-state">
          <Users size={48} className="empty-icon" />
          <h3 className="empty-title">{t("dashboard.no_staff_data")}</h3>
          <p className="empty-description">
            {t("dashboard.no_staff_data_description")}
          </p>
        </div>
      ) : (
        <>
          <div className="staff-list">
            {sortedStaff.map((member, index) => (
              <div key={member._id || index} className="staff-card">
                <div className="staff-content">
                  <div className="staff-role">{getRoleIcon(member.role)}</div>
                  <div className="staff-info">
                    <h3 className="staff-name">{member.name}</h3>
                    <div className="staff-details">
                      <span
                        className={`role-badge ${getRoleColor(member.role)}`}
                      >
                        {member.role}
                      </span>
                      <span className="staff-email">{member.email}</span>
                    </div>
                  </div>
                </div>
                <div className="staff-metrics">
                  <div className="metric-item">
                    <div className="metric-value">
                      {formatNumber(member.totalOrders)}
                    </div>
                    <div className="metric-label">{t("dashboard.orders")}</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-value">
                      {formatCurrency(member.totalRevenue)}
                    </div>
                    <div className="metric-label">{t("dashboard.revenue")}</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-value">
                      {formatCurrency(member.averageOrderValue)}
                    </div>
                    <div className="metric-label">
                      {t("dashboard.avg_order")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="summary-section">
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-value">
                  {formatNumber(staff.length)}
                </div>
                <div className="summary-label">Total Staff</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">
                  {formatNumber(
                    staff.reduce((sum, member) => sum + member.totalOrders, 0),
                  )}
                </div>
                <div className="summary-label">{t("dashboard.orders")}</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">
                  {formatCurrency(
                    staff.reduce((sum, member) => sum + member.totalRevenue, 0),
                  )}
                </div>
                <div className="summary-label">{t("dashboard.revenue")}</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">
                  {formatCurrency(
                    staff.reduce(
                      (sum, member) => sum + member.totalRevenue,
                      0,
                    ) /
                      staff.reduce(
                        (sum, member) => sum + member.totalOrders,
                        0,
                      ),
                  )}
                </div>
                <div className="summary-label">{t("dashboard.avg_order")}</div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .staff-performance {
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

        .staff-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .staff-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          transition: background 0.2s;
        }

        .staff-card:hover {
          background: var(--bg-secondary);
        }

        .staff-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .staff-role {
          color: var(--primary);
        }

        .staff-info {
          flex: 1;
        }

        .staff-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }

        .staff-details {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .staff-email {
          color: var(--text-secondary);
        }

        .staff-metrics {
          display: flex;
          gap: 2rem;
        }

        .metric-item {
          text-align: center;
        }

        .metric-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .metric-label {
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
          .staff-card {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .staff-content {
            gap: 0.75rem;
          }

          .staff-metrics {
            flex-direction: column;
            gap: 1rem;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        [dir='rtl'] .staff-details,
        [dir='rtl'] .staff-metrics {
          direction: rtl;
        }
      `}</style>
    </div>
  );
};

export default StaffPerformance;
