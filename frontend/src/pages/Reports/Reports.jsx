import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart2,
  TrendingUp,
  Package,
  ShoppingCart,
  CalendarCheck,
  Users,
  DollarSign,
  Star,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import PageHeader from "@components/PageHeader";
import "./Reports.css";
import api from "../../services/api";
import { useRestaurant } from "../../hooks/useRestaurant";
import { formatMoney } from "../../utils/money";

// ─── helpers ────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── sub-components ─────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className={`stat-card ${accent || ""}`}>
    <div className="stat-icon">
      <Icon size={22} />
    </div>
    <div className="stat-content">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 className="section-title">{children}</h2>
);

const EmptyState = ({ text }) => (
  <div className="no-data">
    <BarChart2 size={40} />
    <p>{text}</p>
  </div>
);

// ─── main component ──────────────────────────────────────────────────────────

const TABS = [
  { key: "sales", label: "Sales Performance", icon: TrendingUp },
  { key: "revenue", label: "Revenue Breakdown", icon: DollarSign },
  { key: "topItems", label: "Top Items", icon: Star },
  { key: "orders", label: "Order Analytics", icon: ShoppingCart },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "reservations", label: "Reservations", icon: CalendarCheck },
  { key: "staff", label: "Staff Performance", icon: Users },
];

const Reports = () => {
  const { t, i18n } = useTranslation();
  const { getCurrency } = useRestaurant();
  const money = (amount) => formatMoney(amount, getCurrency());

  const initialRange = useMemo(() => {
    const now = new Date();
    const ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      from: ago.toISOString().split("T")[0],
      to: now.toISOString().split("T")[0],
    };
  }, []);

  const [dateRange, setDateRange] = useState(initialRange);
  const [activeTab, setActiveTab] = useState("sales");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({});           // keyed by tab
  const [revenueGroupBy, setRevenueGroupBy] = useState("day");

  // ── fetchers ─────────────────────────────────────────────────────────────

  const fetchSales = useCallback(async () => {
    const r = await api.get("/reports/sales", {
      params: { from: dateRange.from, to: dateRange.to },
    });
    if (r.data.success) setData((p) => ({ ...p, sales: r.data.data }));
  }, [dateRange]);

  const fetchRevenue = useCallback(async () => {
    const r = await api.get("/reports/revenue", {
      params: {
        from: dateRange.from,
        to: dateRange.to,
        groupBy: revenueGroupBy,
      },
    });
    if (r.data.success) setData((p) => ({ ...p, revenue: r.data.data }));
  }, [dateRange, revenueGroupBy]);

  const fetchTopItems = useCallback(async () => {
    const r = await api.get("/reports/top-items", {
      params: { from: dateRange.from, to: dateRange.to, limit: 10 },
    });
    if (r.data.success) setData((p) => ({ ...p, topItems: r.data.data }));
  }, [dateRange]);

  const fetchOrders = useCallback(async () => {
    const r = await api.get("/reports/orders", {
      params: { from: dateRange.from, to: dateRange.to },
    });
    if (r.data.success) setData((p) => ({ ...p, orders: r.data.data }));
  }, [dateRange]);

  const fetchInventory = useCallback(async () => {
    const r = await api.get("/reports/inventory");
    if (r.data.success) setData((p) => ({ ...p, inventory: r.data.data }));
  }, []);

  const fetchReservations = useCallback(async () => {
    const r = await api.get("/reports/reservations", {
      params: { from: dateRange.from, to: dateRange.to },
    });
    if (r.data.success) setData((p) => ({ ...p, reservations: r.data.data }));
  }, [dateRange]);

  const fetchStaff = useCallback(async () => {
    const r = await api.get("/reports/staff-performance", {
      params: { from: dateRange.from, to: dateRange.to },
    });
    if (r.data.success) setData((p) => ({ ...p, staff: r.data.data }));
  }, [dateRange]);

  // ── load on tab / date change ─────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const map = {
          sales: fetchSales,
          revenue: fetchRevenue,
          topItems: fetchTopItems,
          orders: fetchOrders,
          inventory: fetchInventory,
          reservations: fetchReservations,
          staff: fetchStaff,
        };
        await map[activeTab]?.();
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load this report.",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [
    activeTab,
    dateRange,
    revenueGroupBy,
    fetchSales,
    fetchRevenue,
    fetchTopItems,
    fetchOrders,
    fetchInventory,
    fetchReservations,
    fetchStaff,
  ]);

  // ── quick date helpers ───────────────────────────────────────────────────

  const setQuick = (days) => {
    const to = new Date().toISOString().split("T")[0];
    const from =
      days === 0
        ? to
        : new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
    setDateRange({ from, to });
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div data-direction={i18n.dir()}>
      {/* Header */}
      <PageHeader
        icon={BarChart2}
        title={t("reports.title") || "Reports & Analytics"}
        subtitle={
          t("reports.subtitle") || "Comprehensive insights for your restaurant"
        }
      />

      {/* Date range */}
      <div className="reports-controls">
        <div className="date-row">
          <div className="date-group">
            <label>{t("reports.from_date") || "From"}</label>
            <input
              type="date"
              className="date-input"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange((p) => ({ ...p, from: e.target.value }))
              }
            />
          </div>
          <div className="date-group">
            <label>{t("reports.to_date") || "To"}</label>
            <input
              type="date"
              className="date-input"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange((p) => ({ ...p, to: e.target.value }))
              }
            />
          </div>
          <div className="quick-btns">
            <button className="filter-btn" onClick={() => setQuick(0)}>
              {t("reports.today") || "Today"}
            </button>
            <button className="filter-btn" onClick={() => setQuick(7)}>
              {t("reports.last_7_days") || "Last 7 Days"}
            </button>
            <button className="filter-btn" onClick={() => setQuick(30)}>
              {t("reports.last_30_days") || "Last 30 Days"}
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="tab-bar">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`tab-btn ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner" />
          <p>{t("common.loading") || "Loading..."}</p>
        </div>
      )}

      {!loading && error && <EmptyState text={error} />}

      {/* ── SALES ── */}
      {!loading && !error && activeTab === "sales" && (
        <div className="tab-content">
          <SectionTitle>Sales Performance</SectionTitle>
          {data.sales ? (
            <>
              <div className="stats-grid">
                <StatCard
                  icon={DollarSign}
                  label="Total Revenue"
                  value={money(data.sales.totalRevenue)}
                />
                <StatCard
                  icon={ShoppingCart}
                  label="Total Orders"
                  value={(data.sales.count || 0).toLocaleString()}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Avg Order Value"
                  value={money(data.sales.averageOrderValue)}
                />
                <StatCard
                  icon={ArrowUpRight}
                  label="Total Tax"
                  value={money(data.sales.totalTax)}
                />
                <StatCard
                  icon={ArrowDownRight}
                  label="Service Charge"
                  value={money(data.sales.totalServiceCharge)}
                />
              </div>

              {/* Payment methods */}
              {data.sales.byPaymentMethod?.length > 0 && (
                <div className="report-card">
                  <h3>Revenue by Payment Method</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>Method</th>
                          <th data-direction={i18n.dir()}>Revenue</th>
                          <th data-direction={i18n.dir()}>Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.sales.byPaymentMethod.map((row, i) => (
                          <tr key={i}>
                            <td data-direction={i18n.dir()}>
                              <span className="method-badge">
                                {row.paymentMethod}
                              </span>
                            </td>
                            <td data-direction={i18n.dir()}>
                              {money(row.revenue)}
                            </td>
                            <td data-direction={i18n.dir()}>{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Daily trend */}
              {data.sales.dailyTrend?.length > 0 && (
                <div className="report-card">
                  <h3>Daily Revenue Trend</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>Date</th>
                          <th data-direction={i18n.dir()}>Revenue</th>
                          <th data-direction={i18n.dir()}>Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.sales.dailyTrend.map((row, i) => (
                          <tr key={i}>
                            <td data-direction={i18n.dir()}>{row.date}</td>
                            <td data-direction={i18n.dir()}>
                              {money(row.revenue)}
                            </td>
                            <td data-direction={i18n.dir()}>{row.orders}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState text="No sales data for the selected period." />
          )}
        </div>
      )}

      {/* ── REVENUE ── */}
      {!loading && !error && activeTab === "revenue" && (
        <div className="tab-content">
          <div className="section-header-row">
            <SectionTitle>Revenue Breakdown</SectionTitle>
            <div className="groupby-btns">
              {["day", "week", "month"].map((g) => (
                <button
                  key={g}
                  className={`filter-btn ${revenueGroupBy === g ? "active" : ""}`}
                  onClick={() => setRevenueGroupBy(g)}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {data.revenue ? (
            <>
              <div className="stats-grid">
                <StatCard
                  icon={DollarSign}
                  label="Total Revenue"
                  value={money(data.revenue.totalRevenue)}
                />
                <StatCard
                  icon={ShoppingCart}
                  label="Total Orders"
                  value={(data.revenue.totalOrders || 0).toLocaleString()}
                />
              </div>

              {data.revenue.trend?.length > 0 && (
                <div className="report-card">
                  <h3>Revenue Trend ({data.revenue.groupBy})</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>Period</th>
                          <th data-direction={i18n.dir()}>Revenue</th>
                          <th data-direction={i18n.dir()}>Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.revenue.trend.map((row, i) => (
                          <tr key={i}>
                            <td data-direction={i18n.dir()}>{row.period}</td>
                            <td data-direction={i18n.dir()}>
                              {money(row.revenue)}
                            </td>
                            <td data-direction={i18n.dir()}>{row.orders}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {data.revenue.byPaymentMethod?.length > 0 && (
                <div className="report-card">
                  <h3>By Payment Method</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>Method</th>
                          <th data-direction={i18n.dir()}>Revenue</th>
                          <th data-direction={i18n.dir()}>Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.revenue.byPaymentMethod.map((row, i) => (
                          <tr key={i}>
                            <td data-direction={i18n.dir()}>
                              <span className="method-badge">
                                {row.paymentMethod}
                              </span>
                            </td>
                            <td data-direction={i18n.dir()}>
                              {money(row.revenue)}
                            </td>
                            <td data-direction={i18n.dir()}>{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState text="No revenue data for the selected period." />
          )}
        </div>
      )}

      {/* ── TOP ITEMS ── */}
      {!loading && !error && activeTab === "topItems" && (
        <div className="tab-content">
          <SectionTitle>Top Selling Items</SectionTitle>
          {data.topItems?.length > 0 ? (
            <div className="report-card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th data-direction={i18n.dir()}>#</th>
                      <th data-direction={i18n.dir()}>Item Name</th>
                      <th data-direction={i18n.dir()}>Qty Sold</th>
                      <th data-direction={i18n.dir()}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topItems.map((item, i) => (
                      <tr key={i}>
                        <td data-direction={i18n.dir()}>
                          <span className="rank-badge">{i + 1}</span>
                        </td>
                        <td data-direction={i18n.dir()}>
                          <strong>{item.name}</strong>
                        </td>
                        <td data-direction={i18n.dir()}>
                          {item.totalQty?.toLocaleString()}
                        </td>
                        <td data-direction={i18n.dir()}>
                          {money(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState text="No items data for the selected period." />
          )}
        </div>
      )}

      {/* ── ORDER ANALYTICS ── */}
      {!loading && !error && activeTab === "orders" && (
        <div className="tab-content">
          <SectionTitle>Order Analytics</SectionTitle>
          {data.orders ? (
            <>
              {/* Status distribution */}
              {data.orders.statusDistribution?.length > 0 && (
                <>
                  <div className="stats-grid">
                    {data.orders.statusDistribution.map((s, i) => (
                      <StatCard
                        key={i}
                        icon={ShoppingCart}
                        label={s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        value={s.count.toLocaleString()}
                        accent={
                          s.status === "paid"
                            ? "accent-success"
                            : s.status === "cancelled"
                            ? "accent-danger"
                            : ""
                        }
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Type distribution */}
              {data.orders.typeDistribution?.length > 0 && (
                <div className="report-card">
                  <h3>Order Types</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>Type</th>
                          <th data-direction={i18n.dir()}>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.orders.typeDistribution.map((row, i) => (
                          <tr key={i}>
                            <td data-direction={i18n.dir()}>
                              <span className="method-badge">{row.type}</span>
                            </td>
                            <td data-direction={i18n.dir()}>{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top items */}
              {data.orders.topItems?.length > 0 && (
                <div className="report-card">
                  <h3>Top 5 Menu Items</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>Item</th>
                          <th data-direction={i18n.dir()}>Qty</th>
                          <th data-direction={i18n.dir()}>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.orders.topItems.map((item, i) => (
                          <tr key={i}>
                            <td data-direction={i18n.dir()}>
                              <strong>{item.name}</strong>
                            </td>
                            <td data-direction={i18n.dir()}>
                              {item.totalQty}
                            </td>
                            <td data-direction={i18n.dir()}>
                              {money(item.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Hourly trends */}
              {data.orders.hourlyTrends?.length > 0 && (
                <div className="report-card">
                  <h3>Hourly Traffic</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>Hour</th>
                          <th data-direction={i18n.dir()}>Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.orders.hourlyTrends.map((row, i) => (
                          <tr key={i}>
                            <td data-direction={i18n.dir()}>
                              {row.hour}:00
                            </td>
                            <td data-direction={i18n.dir()}>{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState text="No order data for the selected period." />
          )}
        </div>
      )}

      {/* ── INVENTORY ── */}
      {!loading && !error && activeTab === "inventory" && (
        <div className="tab-content">
          <SectionTitle>Inventory Summary</SectionTitle>
          {data.inventory ? (
            <>
              <div className="stats-grid">
                <StatCard
                  icon={Package}
                  label="Total Items"
                  value={(data.inventory.totalItems || 0).toLocaleString()}
                />
                <StatCard
                  icon={DollarSign}
                  label="Total Stock Value"
                  value={money(data.inventory.totalStockValue)}
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Low Stock Items"
                  value={data.inventory.lowStockCount || 0}
                  accent={data.inventory.lowStockCount > 0 ? "accent-warning" : ""}
                />
              </div>

              {data.inventory.lowStockItems?.length > 0 && (
                <div className="report-card">
                  <h3 className="warning-title">
                    <AlertTriangle size={18} />
                    Low Stock Alert
                  </h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>Item</th>
                          <th data-direction={i18n.dir()}>SKU</th>
                          <th data-direction={i18n.dir()}>Stock</th>
                          <th data-direction={i18n.dir()}>Min Alert</th>
                          <th data-direction={i18n.dir()}>Unit</th>
                          <th data-direction={i18n.dir()}>Cost Price</th>
                          <th data-direction={i18n.dir()}>Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.inventory.lowStockItems.map((item, i) => (
                          <tr key={i}>
                            <td data-direction={i18n.dir()}>
                              <strong>{item.name}</strong>
                            </td>
                            <td data-direction={i18n.dir()}>{item.sku}</td>
                            <td data-direction={i18n.dir()}>
                              <span className="stock-badge low">
                                {item.stock}
                              </span>
                            </td>
                            <td data-direction={i18n.dir()}>
                              {item.minStockAlert}
                            </td>
                            <td data-direction={i18n.dir()}>{item.unit}</td>
                            <td data-direction={i18n.dir()}>
                              {money(item.costPrice)}
                            </td>
                            <td data-direction={i18n.dir()}>
                              {item.supplier?.name || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState text="No inventory data available." />
          )}
        </div>
      )}

      {/* ── RESERVATIONS ── */}
      {!loading && !error && activeTab === "reservations" && (
        <div className="tab-content">
          <SectionTitle>Reservations Report</SectionTitle>
          {data.reservations ? (
            <>
              <div className="stats-grid">
                <StatCard
                  icon={CalendarCheck}
                  label="Total Reservations"
                  value={(
                    data.reservations.totalReservations || 0
                  ).toLocaleString()}
                />
                <StatCard
                  icon={Users}
                  label="Total Guests"
                  value={(
                    data.reservations.totalGuests || 0
                  ).toLocaleString()}
                />
                <StatCard
                  icon={Clock}
                  label="Upcoming"
                  value={data.reservations.upcomingCount || 0}
                />
              </div>

              {/* Status distribution */}
              {data.reservations.statusDistribution?.length > 0 && (
                <div className="report-card">
                  <h3>Status Breakdown</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>Status</th>
                          <th data-direction={i18n.dir()}>Count</th>
                          <th data-direction={i18n.dir()}>Guests</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.reservations.statusDistribution.map((row, i) => (
                          <tr key={i}>
                            <td data-direction={i18n.dir()}>
                              <span
                                className={`status-badge ${row.status}`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td data-direction={i18n.dir()}>{row.count}</td>
                            <td data-direction={i18n.dir()}>
                              {row.totalGuests}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Busiest days */}
              {data.reservations.busiestDays?.length > 0 && (
                <div className="report-card">
                  <h3>Busiest Days of Week</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>Day</th>
                          <th data-direction={i18n.dir()}>Reservations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.reservations.busiestDays.map((row, i) => (
                          <tr key={i}>
                            <td data-direction={i18n.dir()}>
                              {/* MongoDB $dayOfWeek: 1=Sun … 7=Sat */}
                              {DAY_NAMES[row.dayOfWeek - 1] ?? row.dayOfWeek}
                            </td>
                            <td data-direction={i18n.dir()}>{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState text="No reservation data for the selected period." />
          )}
        </div>
      )}

      {/* ── STAFF PERFORMANCE ── */}
      {!loading && !error && activeTab === "staff" && (
        <div className="tab-content">
          <SectionTitle>Staff Performance</SectionTitle>
          {data.staff?.length > 0 ? (
            <div className="report-card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th data-direction={i18n.dir()}>Staff Member</th>
                      <th data-direction={i18n.dir()}>Email</th>
                      <th data-direction={i18n.dir()}>Orders Handled</th>
                      <th data-direction={i18n.dir()}>Total Revenue</th>
                      <th data-direction={i18n.dir()}>Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.staff.map((member, i) => (
                      <tr key={i}>
                        <td data-direction={i18n.dir()}>
                          <div className="staff-name">
                            <div className="avatar">
                              {member.staffName?.charAt(0).toUpperCase()}
                            </div>
                            <span>{member.staffName}</span>
                          </div>
                        </td>
                        <td data-direction={i18n.dir()}>
                          {member.staffEmail}
                        </td>
                        <td data-direction={i18n.dir()}>
                          {member.ordersHandled?.toLocaleString()}
                        </td>
                        <td data-direction={i18n.dir()}>
                          {money(member.totalRevenue)}
                        </td>
                        <td data-direction={i18n.dir()}>
                          {money(member.avgOrderValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState text="No staff performance data for the selected period." />
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
