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
import Alert from "@components/Alert";
import { getErrorMessage } from "../../utils/errorMessage";
import "./Reports.css";
import api from "../../services/api";
import { useRestaurant } from "../../hooks/useRestaurant";
import { formatMoney } from "../../utils/money";

// ─── helpers ────────────────────────────────────────────────────────────────

const DAY_KEYS = ["day_sun", "day_mon", "day_tue", "day_wed", "day_thu", "day_fri", "day_sat"];

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
  { key: "sales", labelKey: "reports.sales_performance", icon: TrendingUp },
  { key: "revenue", labelKey: "reports.revenue_breakdown", icon: DollarSign },
  { key: "topItems", labelKey: "reports.top_selling_items", icon: Star },
  { key: "orders", labelKey: "reports.order_analytics", icon: ShoppingCart },
  { key: "inventory", labelKey: "reports.inventory_summary", icon: Package },
  { key: "reservations", labelKey: "reports.reservations_report", icon: CalendarCheck },
  { key: "staff", labelKey: "reports.staff_performance", icon: Users },
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
        setError(getErrorMessage(err, t("reports.load_failed")));
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
    t,
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
          {TABS.map(({ key, labelKey, icon: Icon }) => (
            <button
              key={key}
              className={`tab-btn ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={16} />
              {t(labelKey)}
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

      {!loading && <Alert type="error" message={error} />}

      {/* ── SALES ── */}
      {!loading && !error && activeTab === "sales" && (
        <div className="tab-content">
          <SectionTitle>{t("reports.sales_performance")}</SectionTitle>
          {data.sales ? (
            <>
              <div className="stats-grid">
                <StatCard
                  icon={DollarSign}
                  label={t("reports.total_revenue")}
                  value={money(data.sales.totalRevenue)}
                />
                <StatCard
                  icon={ShoppingCart}
                  label={t("reports.total_orders")}
                  value={(data.sales.count || 0).toLocaleString()}
                />
                <StatCard
                  icon={TrendingUp}
                  label={t("reports.average_order_value")}
                  value={money(data.sales.averageOrderValue)}
                />
                <StatCard
                  icon={ArrowUpRight}
                  label={t("reports.total_tax")}
                  value={money(data.sales.totalTax)}
                />
                <StatCard
                  icon={ArrowDownRight}
                  label={t("reports.service_charge")}
                  value={money(data.sales.totalServiceCharge)}
                />
              </div>

              {/* Payment methods */}
              {data.sales.byPaymentMethod?.length > 0 && (
                <div className="report-card">
                  <h3>{t("reports.revenue_by_method")}</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>{t("reports.method")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.revenue")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.orders")}</th>
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
                  <h3>{t("reports.daily_trend")}</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>{t("reports.date")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.revenue")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.orders")}</th>
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
            <EmptyState text={t("reports.no_sales")} />
          )}
        </div>
      )}

      {/* ── REVENUE ── */}
      {!loading && !error && activeTab === "revenue" && (
        <div className="tab-content">
          <div className="section-header-row">
            <SectionTitle>{t("reports.revenue_breakdown")}</SectionTitle>
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
                  label={t("reports.total_revenue")}
                  value={money(data.revenue.totalRevenue)}
                />
                <StatCard
                  icon={ShoppingCart}
                  label={t("reports.total_orders")}
                  value={(data.revenue.totalOrders || 0).toLocaleString()}
                />
              </div>

              {data.revenue.trend?.length > 0 && (
                <div className="report-card">
                  <h3>{t("reports.revenue_trend")} ({data.revenue.groupBy})</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>{t("reports.period")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.revenue")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.orders")}</th>
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
                  <h3>{t("reports.by_method")}</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>{t("reports.method")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.revenue")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.orders")}</th>
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
            <EmptyState text={t("reports.no_revenue")} />
          )}
        </div>
      )}

      {/* ── TOP ITEMS ── */}
      {!loading && !error && activeTab === "topItems" && (
        <div className="tab-content">
          <SectionTitle>{t("reports.top_selling_items")}</SectionTitle>
          {data.topItems?.length > 0 ? (
            <div className="report-card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th data-direction={i18n.dir()}>#</th>
                      <th data-direction={i18n.dir()}>{t("reports.item_name")}</th>
                      <th data-direction={i18n.dir()}>{t("reports.quantity_sold")}</th>
                      <th data-direction={i18n.dir()}>{t("reports.revenue")}</th>
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
            <EmptyState text={t("reports.no_items")} />
          )}
        </div>
      )}

      {/* ── ORDER ANALYTICS ── */}
      {!loading && !error && activeTab === "orders" && (
        <div className="tab-content">
          <SectionTitle>{t("reports.order_analytics")}</SectionTitle>
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
                  <h3>{t("reports.order_types")}</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>{t("reports.type")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.count")}</th>
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
                  <h3>{t("reports.top_five")}</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>{t("reports.item")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.qty")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.revenue")}</th>
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
                  <h3>{t("reports.hourly_traffic")}</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>{t("reports.hour")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.orders")}</th>
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
            <EmptyState text={t("reports.no_orders")} />
          )}
        </div>
      )}

      {/* ── INVENTORY ── */}
      {!loading && !error && activeTab === "inventory" && (
        <div className="tab-content">
          <SectionTitle>{t("reports.inventory_summary")}</SectionTitle>
          {data.inventory ? (
            <>
              <div className="stats-grid">
                <StatCard
                  icon={Package}
                  label={t("reports.total_items")}
                  value={(data.inventory.totalItems || 0).toLocaleString()}
                />
                <StatCard
                  icon={DollarSign}
                  label={t("reports.total_stock_value")}
                  value={money(data.inventory.totalStockValue)}
                />
                <StatCard
                  icon={AlertTriangle}
                  label={t("reports.low_stock_items")}
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
                          <th data-direction={i18n.dir()}>{t("reports.item")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.sku")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.stock")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.min_alert")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.unit")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.cost_price")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.supplier")}</th>
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
            <EmptyState text={t("reports.no_inventory")} />
          )}
        </div>
      )}

      {/* ── RESERVATIONS ── */}
      {!loading && !error && activeTab === "reservations" && (
        <div className="tab-content">
          <SectionTitle>{t("reports.reservations_report")}</SectionTitle>
          {data.reservations ? (
            <>
              <div className="stats-grid">
                <StatCard
                  icon={CalendarCheck}
                  label={t("reports.reservations_total")}
                  value={(
                    data.reservations.totalReservations || 0
                  ).toLocaleString()}
                />
                <StatCard
                  icon={Users}
                  label={t("reports.total_guests")}
                  value={(
                    data.reservations.totalGuests || 0
                  ).toLocaleString()}
                />
                <StatCard
                  icon={Clock}
                  label={t("reports.upcoming")}
                  value={data.reservations.upcomingCount || 0}
                />
              </div>

              {/* Status distribution */}
              {data.reservations.statusDistribution?.length > 0 && (
                <div className="report-card">
                  <h3>{t("reports.status_breakdown")}</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>{t("reports.status")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.count")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.guests")}</th>
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
                  <h3>{t("reports.busiest_days")}</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th data-direction={i18n.dir()}>{t("reports.day")}</th>
                          <th data-direction={i18n.dir()}>{t("reports.reservations_total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.reservations.busiestDays.map((row, i) => (
                          <tr key={i}>
                            <td data-direction={i18n.dir()}>
                              {/* MongoDB $dayOfWeek: 1=Sun … 7=Sat */}
                              {DAY_KEYS[row.dayOfWeek - 1]
                                ? t(`reports.${DAY_KEYS[row.dayOfWeek - 1]}`)
                                : row.dayOfWeek}
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
            <EmptyState text={t("reports.no_reservations")} />
          )}
        </div>
      )}

      {/* ── STAFF PERFORMANCE ── */}
      {!loading && !error && activeTab === "staff" && (
        <div className="tab-content">
          <SectionTitle>{t("reports.staff_performance")}</SectionTitle>
          {data.staff?.length > 0 ? (
            <div className="report-card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th data-direction={i18n.dir()}>{t("reports.staff_member")}</th>
                      <th data-direction={i18n.dir()}>{t("reports.email")}</th>
                      <th data-direction={i18n.dir()}>{t("reports.orders_handled")}</th>
                      <th data-direction={i18n.dir()}>{t("reports.total_revenue")}</th>
                      <th data-direction={i18n.dir()}>{t("reports.average_order_value")}</th>
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
            <EmptyState text={t("reports.no_staff")} />
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
