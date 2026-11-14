import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Flame, Utensils } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRestaurant } from "@hooks/useRestaurant";
import orderService from "@services/orderService";
import api from "@services/api";
import { uploadUrl } from "../../utils/uploadUrl";
import "./WaitingDisplay.css";

function ticketCode(order) {
  if (order.orderNumber) return String(order.orderNumber);
  const hex = String(order._id || "").replace(/-/g, "");
  const value = Number.parseInt(hex.slice(0, 6), 16);
  if (!Number.isFinite(value)) return "---";
  return String(100 + (value % 900));
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

const WaitingDisplay = () => {
  const { t } = useTranslation();
  const { getBusinessLogo, getRestaurantName } = useRestaurant();
  const [orders, setOrders] = useState([]);
  const [ads, setAds] = useState([]);
  const [index, setIndex] = useState(0);

  const load = useCallback(async () => {
    try {
      const result = await orderService.getAll();
      setOrders(result?.data || []);
    } catch {
      setOrders([]);
    }
    try {
      const result = await api.get("/restaurant/settings");
      const board = result.data?.data?.settings?.adsBoard;
      const visible = Array.isArray(board) ? board.filter((item) => item.visible && item.url) : [];
      setAds(visible);
    } catch {
      setAds([]);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 8000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!ads.length) return;
    setIndex((current) => current % ads.length);
  }, [ads]);

  const preparing = orders.filter((order) => order.status === "in_kitchen");
  const ready = orders.filter((order) => order.status === "served");
  const safeIndex = ads.length ? index % ads.length : 0;
  const currentAd = ads[safeIndex] || null;

  useEffect(() => {
    if (ads.length < 2 || currentAd?.kind === "video") return undefined;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % ads.length), 6000);
    return () => window.clearTimeout(timer);
  }, [ads.length, currentAd?.kind, safeIndex]);

  useEffect(() => {
    if (ads.length < 2 || currentAd?.kind !== "video") return undefined;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % ads.length), 20000);
    return () => window.clearTimeout(timer);
  }, [ads.length, currentAd?.kind, safeIndex]);

  return (
    <div className="waiting-screen">
      <Link className="waiting-brand" to="/orders">
        <img src={getBusinessLogo()} alt="" onError={showDefaultLogo} />
        <span>{getRestaurantName()}</span>
      </Link>

      <div className="waiting-board">
        <section className="waiting-card">
          <h1>{t("nav.waiting_title")}</h1>
          <div className="waiting-columns">
            <div className="waiting-column preparing">
              <header>
                <Flame size={18} />
                {t("nav.waiting_preparing")}
              </header>
              <div className="waiting-tickets">
                {preparing.map((order) => (
                  <span key={order._id}>{ticketCode(order)}</span>
                ))}
              </div>
            </div>
            <div className="waiting-column ready">
              <header>
                <Bell size={18} />
                {t("nav.waiting_ready")}
              </header>
              <div className="waiting-tickets">
                {ready.map((order) => (
                  <span key={order._id}>{ticketCode(order)}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="waiting-card ads">
          <h1>{t("nav.waiting_ads")}</h1>
          {currentAd ? (
            <div className="waiting-slider">
              <div className="waiting-slide" key={currentAd.id || currentAd.url}>
                {currentAd.kind === "video" ? (
                  <video
                    src={uploadUrl(currentAd.url)}
                    autoPlay
                    muted
                    playsInline
                    loop={ads.length < 2}
                    onEnded={() => {
                      if (ads.length < 2) return;
                      setIndex((current) => (current + 1) % ads.length);
                    }}
                  />
                ) : (
                  <img src={uploadUrl(currentAd.url)} alt={currentAd.name || ""} />
                )}
              </div>
              {ads.length > 1 && (
                <div className="waiting-dots">
                  {ads.map((ad, dot) => (
                    <button
                      key={ad.id || ad.url}
                      type="button"
                      className={dot === safeIndex ? "on" : ""}
                      aria-label={ad.name || String(dot + 1)}
                      onClick={() => setIndex(dot)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="waiting-poster">
              <div className="poster-logo">
                <Utensils size={28} />
              </div>
              <p className="poster-special">{t("nav.waiting_special")}</p>
              <p className="poster-menu">{t("nav.waiting_menu")}</p>
              <p className="poster-weekend">{t("nav.waiting_weekend")}</p>
              <div className="poster-plate" aria-hidden="true">
                <span className="plate-green" />
                <span className="plate-leaf" />
                <span className="plate-salmon" />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default WaitingDisplay;
