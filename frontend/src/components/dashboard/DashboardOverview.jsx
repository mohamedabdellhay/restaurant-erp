import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, ClipboardList, Coins, TrendingUp, Users } from "lucide-react";
import dashboardService from "../../services/dashboardService";
import { useRestaurant } from "../../hooks/useRestaurant";
import { formatMoney } from "../../utils/money";
import { getErrorMessage } from "../../utils/errorMessage";
import Alert from "../Alert";

const CATEGORY_COLORS = ["#f59e0b", "#3b82f6", "#eab308", "#a855f7", "#22c55e", "#ef4444"];
const CHANNEL_COLORS = ["#f59e0b", "#facc15", "#22c55e", "#3b82f6", "#a855f7"];

function readableLabel(value) {
  return String(value || "Unknown")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function shareLabel(part, total, money) {
  const pct = total > 0 ? (part / total) * 100 : 0;
  return `${pct.toFixed(1)}%, ${money}`;
}

function Donut({ slices }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total <= 0) return null;

  return (
    <svg className="fa-donut" viewBox="0 0 180 180" role="img">
      <g transform="rotate(-90 90 90)">
        {slices.map((slice) => {
          const length = (slice.value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const node = (
            <circle
              key={slice.label}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="28"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return node;
        })}
      </g>
    </svg>
  );
}

function Pie({ slices }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total <= 0) return null;
  if (slices.length === 1) {
    return (
      <svg className="fa-pie" viewBox="0 0 200 200" role="img">
        <circle cx="100" cy="100" r="78" fill={slices[0].color} />
      </svg>
    );
  }

  let angle = -Math.PI / 2;
  const paths = slices.map((slice) => {
    const sweep = (slice.value / total) * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const x1 = 100 + Math.cos(start) * 78;
    const y1 = 100 + Math.sin(start) * 78;
    const x2 = 100 + Math.cos(end) * 78;
    const y2 = 100 + Math.sin(end) * 78;
    const large = sweep > Math.PI ? 1 : 0;
    return (
      <path
        key={slice.label}
        d={`M 100 100 L ${x1} ${y1} A 78 78 0 ${large} 1 ${x2} ${y2} Z`}
        fill={slice.color}
      />
    );
  });

  return (
    <svg className="fa-pie" viewBox="0 0 200 200" role="img">
      {paths}
    </svg>
  );
}

function ChartLegend({ slices, total, formatCurrency }) {
  return (
    <ul className="fa-legend">
      {slices.map((slice) => (
        <li key={slice.label}>
          <i style={{ background: slice.color }} />
          <span>{slice.label}</span>
          <strong>{shareLabel(slice.value, total, formatCurrency(slice.value))}</strong>
        </li>
      ))}
    </ul>
  );
}

const DashboardOverview = ({ dateRange = {} }) => {
  const { t } = useTranslation();
  const { getCurrency } = useRestaurant();
  const currency = getCurrency();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [items, setItems] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [staff, setStaff] = useState([]);
  const [today, setToday] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = {};
        if (dateRange.from) params.from = dateRange.from;
        if (dateRange.to) params.to = dateRange.to;

        const [overviewRes, itemsRes, revenueRes, staffRes, realtimeRes] = await Promise.all([
          dashboardService.getOverview(params),
          dashboardService.getTopItems({ ...params, limit: 10 }),
          dashboardService.getRevenueAnalytics(params),
          dashboardService.getStaffPerformance(params),
          dashboardService.getRealTimeMetrics(),
        ]);

        if (!active) return;
        if (!overviewRes.success) {
          setError(overviewRes.message || "Failed to fetch overview");
          return;
        }

        setOverview(overviewRes.data);
        setItems(itemsRes.success ? itemsRes.data || [] : []);
        setRevenue(revenueRes.success ? revenueRes.data : null);
        setStaff(staffRes.success ? staffRes.data || [] : []);
        setToday(realtimeRes.success ? realtimeRes.data : null);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [dateRange]);

  const formatCurrency = (amount) => formatMoney(amount, currency);
  const formatNumber = (num) => new Intl.NumberFormat().format(num || 0);

  if (loading) {
    return (
      <div className="fa-overview">
        <div className="fa-kpis">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="fa-kpi fa-kpi-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!overview) return null;

  const categories = (revenue?.categories || [])
    .filter((row) => row.value > 0)
    .map((row, index) => ({
      label: row.label,
      value: row.value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  const channels = (revenue?.orderTypes || [])
    .filter((row) => row.value > 0)
    .map((row, index) => ({
      label: readableLabel(row.label),
      value: row.value,
      color: CHANNEL_COLORS[index % CHANNEL_COLORS.length],
    }));
  const categoryTotal = categories.reduce((sum, row) => sum + row.value, 0);
  const channelTotal = channels.reduce((sum, row) => sum + row.value, 0);
  const maxItem = items.reduce((max, item) => Math.max(max, item.totalRevenue || 0), 0);

  const metrics = [
    {
      title: t("dashboard.sales"),
      value: formatCurrency(overview.totalRevenue),
      icon: <Coins size={16} color="#e0a106" />,
    },
    {
      title: t("dashboard.today_revenue"),
      value: formatCurrency(today?.today?.revenue || 0),
      icon: <TrendingUp size={16} color="#22c55e" />,
    },
    {
      title: t("dashboard.order_count"),
      value: formatNumber(overview.totalOrders),
      icon: <ClipboardList size={16} color="#f97316" />,
    },
    {
      title: t("dashboard.customer_count"),
      value: formatNumber(overview.totalCustomers),
      icon: <Users size={16} color="#8b5cf6" />,
    },
    {
      title: t("dashboard.sales_per_order"),
      value: formatCurrency(overview.averageOrderValue),
      icon: <Calculator size={16} color="#6b7280" />,
    },
  ];

  return (
    <div className="fa-overview">
      <div className="fa-kpis">
        {metrics.map((metric) => (
          <article key={metric.title} className="fa-kpi">
            <p className="fa-kpi-label">
              {metric.icon}
              <span>{metric.title}</span>
            </p>
            <p className="fa-kpi-value">{metric.value}</p>
          </article>
        ))}
      </div>

      <div className="fa-grid">
        <section className="fa-card">
          <h2>{t("dashboard.staff_performance")}</h2>
          {staff.length === 0 ? (
            <p className="fa-empty">{t("dashboard.no_staff_data")}</p>
          ) : (
            <div className="fa-table-wrap">
              <table className="fa-table">
                <thead>
                  <tr>
                    <th>{t("dashboard.name")}</th>
                    <th>{t("dashboard.sales")}</th>
                    <th>{t("dashboard.orders")}</th>
                    <th>{t("dashboard.avg_order")}</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.slice(0, 8).map((member) => (
                    <tr key={member._id}>
                      <td>{member.name}</td>
                      <td>{formatCurrency(member.totalRevenue)}</td>
                      <td>{formatNumber(member.totalOrders)}</td>
                      <td>{formatCurrency(member.averageOrderValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="fa-card">
          <h2>{t("dashboard.category_sales")}</h2>
          {categories.length === 0 ? (
            <p className="fa-empty">{t("dashboard.no_data")}</p>
          ) : (
            <div className="fa-chart-block">
              <Donut slices={categories} />
              <ChartLegend slices={categories} total={categoryTotal} formatCurrency={formatCurrency} />
            </div>
          )}
        </section>

        <section className="fa-card">
          <h2>{t("dashboard.top_10")}</h2>
          {items.length === 0 ? (
            <p className="fa-empty">{t("dashboard.no_items")}</p>
          ) : (
            <div className="fa-bars">
              {items.map((item) => (
                <div key={item._id} className="fa-bar-row">
                  <span className="fa-bar-name">{item.name}</span>
                  <span className="fa-bar-track">
                    <span style={{ width: `${maxItem ? (item.totalRevenue / maxItem) * 100 : 0}%` }} />
                  </span>
                  <span className="fa-bar-value">{formatNumber(Math.round(item.totalRevenue))}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="fa-card">
          <h2>{t("dashboard.channel_sales")}</h2>
          {channels.length === 0 ? (
            <p className="fa-empty">{t("dashboard.no_data")}</p>
          ) : (
            <div className="fa-chart-block">
              <Pie slices={channels} />
              <ChartLegend slices={channels} total={channelTotal} formatCurrency={formatCurrency} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardOverview;
