import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bike, Check, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRestaurant } from "@hooks/useRestaurant";
import orderService from "@services/orderService";
import "./Kds.css";

const TEN_MINUTES = 10 * 60 * 1000;

function ticketCode(order) {
  if (order.orderNumber) return String(order.orderNumber);
  const hex = String(order._id || "").replace(/-/g, "");
  const value = Number.parseInt(hex.slice(0, 6), 16);
  if (!Number.isFinite(value)) return "---";
  return String(100 + (value % 900));
}

function tableLabel(order) {
  const number = String(order.table?.number ?? "");
  if (!number) return `#${ticketCode(order)}`;
  return /^\d+$/.test(number) ? `T${number}` : number;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function clockElapsed(from, now) {
  const seconds = Math.max(0, Math.floor((now - new Date(from).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds % 60)}`;
}

function shortElapsed(from, now) {
  const seconds = Math.max(0, Math.floor((now - new Date(from).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${pad(seconds % 60)}`;
}

function showDefaultLogo(event) {
  const image = event.currentTarget;
  if (image.dataset.fallback === "1") {
    image.style.display = "none";
    return;
  }
  image.dataset.fallback = "1";
  image.src = "/restaurant-logo.svg";
}

const Kds = () => {
  const { t } = useTranslation();
  const { getBusinessLogo, getRestaurantName } = useRestaurant();
  const [orders, setOrders] = useState([]);
  const [readyIds, setReadyIds] = useState(() => new Set());
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const result = await orderService.getAll();
      setOrders(result?.data || []);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = window.setInterval(load, 8000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(refresh);
      window.clearInterval(clock);
    };
  }, [load]);

  const kitchen = useMemo(
    () =>
      orders
        .filter((order) => order.status === "in_kitchen")
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [orders],
  );

  const recentLines = useMemo(
    () =>
      kitchen.flatMap((order) =>
        (order.items || [])
          .filter((item) => now - new Date(item.createdAt || order.createdAt).getTime() <= TEN_MINUTES)
          .map((item) => ({ order, item })),
      ),
    [kitchen, now],
  );

  const channelOf = (type) => {
    if (type === "delivery") return { label: t("nav.orders_delivery"), icon: Bike, tone: "orange" };
    if (type === "takeaway") return { label: t("nav.orders_parcel"), icon: ShoppingBag, tone: "orange" };
    return { label: t("nav.orders_dineIn"), icon: UtensilsCrossed, tone: "blue" };
  };

  const toggleReady = async (order, itemId) => {
    const items = order.items || [];
    const next = new Set(readyIds);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    const finished = items.length > 0 && items.every((item) => next.has(item._id));
    if (!finished) {
      setReadyIds(next);
      return;
    }
    try {
      await orderService.updateStatus(order._id, { status: "served" });
      setReadyIds((current) => {
        const cleared = new Set(current);
        items.forEach((item) => cleared.delete(item._id));
        return cleared;
      });
      load();
    } catch {
      setReadyIds(next);
    }
  };

  return (
    <div className="kds-screen">
      <header className="kds-top">
        <div className="kds-brand">
          <Link to="/orders" aria-label={t("nav.orders")}>
            <ArrowLeft size={18} />
          </Link>
          <img src={getBusinessLogo()} alt="" onError={showDefaultLogo} />
          <span>{getRestaurantName()}</span>
        </div>
        <div className="kds-clock">
          <strong>
            {new Date(now).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </strong>
          <span>
            {new Date(now).toLocaleDateString([], {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </header>

      <div className="kds-body">
        <aside className="kds-common">
          <h1>{t("nav.kds_common")}</h1>
          <div className="kds-common-head">
            <span>{t("nav.kds_items")}</span>
            <span>{t("nav.kds_qty")}</span>
            <span>{t("nav.kds_time")}</span>
          </div>
          <ul>
            {recentLines.map(({ order, item }) => (
              <li key={item._id}>
                <label>
                  <input
                    type="checkbox"
                    checked={readyIds.has(item._id)}
                    onChange={() => toggleReady(order, item._id)}
                  />
                  <span>{item.menuItem?.name || t("nav.kds_item")}</span>
                </label>
                <strong>{pad(item.qty || 1)}</strong>
                <time>
                  {new Date(item.createdAt || order.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ul>
        </aside>

        <section className="kds-grid">
          {kitchen.length === 0 && <p className="kds-empty">{t("nav.kds_empty")}</p>}
          {kitchen.map((order) => {
            const channel = channelOf(order.type);
            const ChannelIcon = channel.icon;
            const items = order.items || [];
            const done = items.filter((item) => readyIds.has(item._id)).length;
            const percent = items.length ? Math.round((done / items.length) * 100) : 0;
            return (
              <article key={order._id} className={`kds-ticket ${channel.tone}`}>
                <header>
                  <strong>{tableLabel(order)}</strong>
                  <span className="kds-timer">{clockElapsed(order.createdAt, now)}</span>
                  <div>
                    <span>#{ticketCode(order)}</span>
                    <span>
                      <ChannelIcon size={14} />
                      {channel.label}
                    </span>
                  </div>
                </header>
                <div className="kds-progress">
                  <div>
                    <span>
                      {t("nav.kds_ready_count", { done, total: items.length })}
                    </span>
                    <span>{t("nav.kds_percent", { percent })}</span>
                  </div>
                  <b>
                    <i style={{ width: `${percent}%` }} />
                  </b>
                </div>
                <ul>
                  {items.map((item) => {
                    const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
                    const ready = readyIds.has(item._id);
                    return (
                      <li key={item._id} className={ready ? "is-ready" : ""}>
                        <div>
                          <strong>
                            {item.qty || 1} x {item.menuItem?.name || t("nav.kds_item")}
                          </strong>
                          {modifiers.map((modifier, index) => (
                            <em key={`${item._id}-mod-${index}`}>{modifier.name}</em>
                          ))}
                          {item.notes && <small>{item.notes}</small>}
                        </div>
                        <time>{shortElapsed(item.createdAt || order.createdAt, now)}</time>
                        <button
                          type="button"
                          aria-pressed={ready}
                          onClick={() => toggleReady(order, item._id)}
                        >
                          {ready && <Check size={14} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default Kds;
