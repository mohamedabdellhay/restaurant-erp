import { useEffect, useState } from "react";
import { NavLink, Navigate, useParams } from "react-router-dom";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  Receipt,
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "@components/PageHeader";
import Alert from "@components/Alert";
import platformService from "@services/platformService";
import { getErrorMessage } from "@utils/errorMessage";
import "./Platform.css";

const SECTIONS = [
  { id: "overview", label: "platform.overview", icon: LayoutDashboard },
  { id: "settings", label: "platform.settings", icon: Settings },
  { id: "restaurants", label: "platform.restaurants", icon: Building2 },
  { id: "plans", label: "platform.plans", icon: CreditCard },
  { id: "subscriptions", label: "platform.subscriptions", icon: Receipt },
];

const CURRENCIES = ["USD", "EUR", "GBP", "EGP", "SAR", "AED", "JOD", "LBP"];
const STATUSES = ["pending", "active", "cancelled", "expired"];

const emptyPlan = {
  id: "",
  name: "",
  price: "",
  currency: "EGP",
  description: "",
  features: "",
  users: 5,
  branches: 1,
  isActive: true,
};

const Platform = () => {
  const { section } = useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [overview, setOverview] = useState(null);
  const [settings, setSettings] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantForm, setRestaurantForm] = useState(null);
  const [plans, setPlans] = useState([]);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setMessage({ type: "", text: "" });
      try {
        if (section === "overview") {
          const response = await platformService.getOverview();
          if (!ignore) setOverview(response.data);
        } else if (section === "settings") {
          const response = await platformService.getSettings();
          if (!ignore) setSettings(response.data);
        } else if (section === "restaurants") {
          const response = await platformService.getRestaurants();
          if (!ignore) setRestaurants(response.data || []);
        } else if (section === "plans") {
          const response = await platformService.getPlans();
          if (!ignore) setPlans(response.data || []);
        } else if (section === "subscriptions") {
          const response = await platformService.getSubscriptions();
          if (!ignore) setSubscriptions(response.data || []);
        }
      } catch (error) {
        if (!ignore) setMessage({ type: "error", text: getErrorMessage(error) });
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [section]);

  if (!SECTIONS.some((item) => item.id === section)) {
    return <Navigate to="/admin/overview" replace />;
  }

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await platformService.updateSettings({
        ...settings,
        allowRegistration: Boolean(settings.allowRegistration),
        maintenanceMode: Boolean(settings.maintenanceMode),
      });
      setSettings(response.data);
      setMessage({ type: "success", text: t("platform.settings_saved") });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const saveRestaurant = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await platformService.updateRestaurant(restaurantForm.id, {
        name: restaurantForm.name,
        email: restaurantForm.email,
        phone: restaurantForm.phone,
        address: restaurantForm.address,
        currency: restaurantForm.currency,
      });
      setRestaurants((current) =>
        current.map((item) => (item.id === response.data.id ? response.data : item)),
      );
      setRestaurantForm(null);
      setMessage({ type: "success", text: t("platform.restaurant_saved") });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    const payload = {
      name: planForm.name,
      price: Number(planForm.price),
      currency: planForm.currency,
      description: planForm.description,
      features: planForm.features.split("\n").map((item) => item.trim()).filter(Boolean),
      isActive: Boolean(planForm.isActive),
      limits: { users: Number(planForm.users), branches: Number(planForm.branches) },
    };
    try {
      const response = planForm.id
        ? await platformService.updatePlan(planForm.id, payload)
        : await platformService.createPlan(payload);
      setPlans((current) => {
        const next = current.filter((item) => item.id !== response.data.id);
        return [...next, response.data].sort((a, b) => a.price - b.price);
      });
      setPlanForm(emptyPlan);
      setMessage({ type: "success", text: t("platform.plan_saved") });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const changeSubscription = async (id, status) => {
    setMessage({ type: "", text: "" });
    try {
      const response = await platformService.updateSubscription(id, status);
      setSubscriptions((current) =>
        current.map((item) => (item.id === id ? response.data : item)),
      );
      setMessage({ type: "success", text: t("platform.subscription_saved") });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    }
  };

  const editPlan = (plan) => {
    setPlanForm({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      description: plan.description || "",
      features: (plan.features || []).join("\n"),
      users: plan.limits?.users || 1,
      branches: plan.limits?.branches || 1,
      isActive: plan.isActive,
    });
  };

  return (
    <div className="platform-admin">
      <PageHeader
        icon={Settings}
        eyebrow={t("platform.eyebrow")}
        title={t("platform.title")}
        subtitle={t("platform.subtitle")}
      />
      <nav className="platform-nav" aria-label={t("platform.title")}>
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.id} to={`/admin/${item.id}`}>
              <Icon size={16} />
              {t(item.label)}
            </NavLink>
          );
        })}
      </nav>
      <Alert type={message.type} message={message.text} />
      {loading ? <p className="platform-empty">{t("common.loading")}</p> : null}

      {!loading && section === "overview" && overview && (
        <div className="platform-metrics">
          <div className="platform-metric">
            <span>{t("platform.restaurants")}</span>
            <strong>{overview.restaurants}</strong>
          </div>
          <div className="platform-metric">
            <span>{t("platform.active_subscriptions")}</span>
            <strong>{overview.activeSubscriptions}</strong>
          </div>
          <div className="platform-metric">
            <span>{t("platform.pending_subscriptions")}</span>
            <strong>{overview.pendingSubscriptions}</strong>
          </div>
          <div className="platform-metric">
            <span>{t("platform.plans")}</span>
            <strong>{overview.plans}</strong>
          </div>
        </div>
      )}

      {!loading && section === "settings" && settings && (
        <form className="platform-card" onSubmit={saveSettings}>
          <h2>{t("platform.settings")}</h2>
          <div className="platform-form">
            <label>
              {t("platform.platform_name")}
              <input
                value={settings.name || ""}
                onChange={(event) => setSettings({ ...settings, name: event.target.value })}
                required
              />
            </label>
            <label>
              {t("platform.support_email")}
              <input
                type="email"
                value={settings.supportEmail || ""}
                onChange={(event) =>
                  setSettings({ ...settings, supportEmail: event.target.value })
                }
              />
            </label>
            <label>
              {t("platform.support_phone")}
              <input
                value={settings.supportPhone || ""}
                onChange={(event) =>
                  setSettings({ ...settings, supportPhone: event.target.value })
                }
              />
            </label>
            <label>
              {t("platform.default_currency")}
              <select
                value={settings.defaultCurrency}
                onChange={(event) =>
                  setSettings({ ...settings, defaultCurrency: event.target.value })
                }
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
            <div className="platform-checks platform-span">
              <label className="platform-check">
                <input
                  type="checkbox"
                  checked={Boolean(settings.allowRegistration)}
                  onChange={(event) =>
                    setSettings({ ...settings, allowRegistration: event.target.checked })
                  }
                />
                {t("platform.allow_registration")}
              </label>
              <label className="platform-check">
                <input
                  type="checkbox"
                  checked={Boolean(settings.maintenanceMode)}
                  onChange={(event) =>
                    setSettings({ ...settings, maintenanceMode: event.target.checked })
                  }
                />
                {t("platform.maintenance_mode")}
              </label>
            </div>
          </div>
          <div className="platform-actions">
            <button type="submit" disabled={saving}>
              {saving ? t("common.processing") : t("common.save")}
            </button>
          </div>
        </form>
      )}

      {!loading && section === "restaurants" && (
        <div className="platform-card">
          <h2>{t("platform.restaurants")}</h2>
          <div className="platform-table-wrap">
            <table className="platform-table">
              <thead>
                <tr>
                  <th>{t("platform.name")}</th>
                  <th>{t("platform.plan")}</th>
                  <th>{t("platform.status")}</th>
                  <th>{t("platform.staff")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id}>
                    <td>
                      <strong>{restaurant.name}</strong>
                      <div>{restaurant.email}</div>
                    </td>
                    <td>{restaurant.planName || "—"}</td>
                    <td>{restaurant.subscriptionStatus || "—"}</td>
                    <td>{restaurant.staffCount}</td>
                    <td>
                      <button
                        type="button"
                        className="platform-inline secondary"
                        onClick={() => setRestaurantForm(restaurant)}
                      >
                        {t("common.edit")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {restaurants.length === 0 && (
              <p className="platform-empty">{t("platform.no_restaurants")}</p>
            )}
          </div>
          {restaurantForm && (
            <form className="platform-form" onSubmit={saveRestaurant}>
              <h3 className="platform-span">{t("platform.edit_restaurant")}</h3>
              <label>
                {t("platform.name")}
                <input
                  value={restaurantForm.name}
                  onChange={(event) =>
                    setRestaurantForm({ ...restaurantForm, name: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                {t("platform.email")}
                <input
                  type="email"
                  value={restaurantForm.email}
                  onChange={(event) =>
                    setRestaurantForm({ ...restaurantForm, email: event.target.value })
                  }
                />
              </label>
              <label>
                {t("platform.phone")}
                <input
                  value={restaurantForm.phone}
                  onChange={(event) =>
                    setRestaurantForm({ ...restaurantForm, phone: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                {t("platform.currency")}
                <select
                  value={restaurantForm.currency}
                  onChange={(event) =>
                    setRestaurantForm({ ...restaurantForm, currency: event.target.value })
                  }
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>
              <label className="platform-span">
                {t("platform.address")}
                <input
                  value={restaurantForm.address}
                  onChange={(event) =>
                    setRestaurantForm({ ...restaurantForm, address: event.target.value })
                  }
                  required
                />
              </label>
              <div className="platform-actions platform-span">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setRestaurantForm(null)}
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? t("common.processing") : t("common.save")}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!loading && section === "plans" && (
        <div className="platform-card">
          <h2>{t("platform.plans")}</h2>
          <div className="platform-table-wrap">
            <table className="platform-table">
              <thead>
                <tr>
                  <th>{t("platform.name")}</th>
                  <th>{t("platform.price")}</th>
                  <th>{t("platform.limits")}</th>
                  <th>{t("platform.status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <strong>{plan.name}</strong>
                    </td>
                    <td>
                      {plan.price} {plan.currency}
                    </td>
                    <td>
                      {plan.limits?.users || 0} / {plan.limits?.branches || 0}
                    </td>
                    <td>{plan.isActive ? t("platform.active") : t("platform.inactive")}</td>
                    <td>
                      <button
                        type="button"
                        className="platform-inline secondary"
                        onClick={() => editPlan(plan)}
                      >
                        {t("common.edit")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form className="platform-form" onSubmit={savePlan}>
            <h3 className="platform-span">
              {planForm.id ? t("platform.edit_plan") : t("platform.new_plan")}
            </h3>
            <label>
              {t("platform.name")}
              <input
                value={planForm.name}
                onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              {t("platform.price")}
              <input
                type="number"
                min="0"
                step="0.01"
                value={planForm.price}
                onChange={(event) => setPlanForm({ ...planForm, price: event.target.value })}
                required
              />
            </label>
            <label>
              {t("platform.currency")}
              <select
                value={planForm.currency}
                onChange={(event) => setPlanForm({ ...planForm, currency: event.target.value })}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("platform.user_limit")}
              <input
                type="number"
                min="1"
                value={planForm.users}
                onChange={(event) => setPlanForm({ ...planForm, users: event.target.value })}
                required
              />
            </label>
            <label>
              {t("platform.branch_limit")}
              <input
                type="number"
                min="1"
                value={planForm.branches}
                onChange={(event) =>
                  setPlanForm({ ...planForm, branches: event.target.value })
                }
                required
              />
            </label>
            <label className="platform-check">
              <input
                type="checkbox"
                checked={Boolean(planForm.isActive)}
                onChange={(event) =>
                  setPlanForm({ ...planForm, isActive: event.target.checked })
                }
              />
              {t("platform.active")}
            </label>
            <label className="platform-span">
              {t("platform.description")}
              <input
                value={planForm.description}
                onChange={(event) =>
                  setPlanForm({ ...planForm, description: event.target.value })
                }
              />
            </label>
            <label className="platform-span">
              {t("platform.features")}
              <textarea
                value={planForm.features}
                onChange={(event) => setPlanForm({ ...planForm, features: event.target.value })}
              />
            </label>
            <div className="platform-actions platform-span">
              {planForm.id && (
                <button type="button" className="secondary" onClick={() => setPlanForm(emptyPlan)}>
                  {t("common.cancel")}
                </button>
              )}
              <button type="submit" disabled={saving}>
                {saving ? t("common.processing") : t("common.save")}
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && section === "subscriptions" && (
        <div className="platform-card">
          <h2>{t("platform.subscriptions")}</h2>
          <div className="platform-table-wrap">
            <table className="platform-table">
              <thead>
                <tr>
                  <th>{t("platform.restaurant")}</th>
                  <th>{t("platform.plan")}</th>
                  <th>{t("platform.ends")}</th>
                  <th>{t("platform.status")}</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td>
                      <strong>{subscription.restaurantName}</strong>
                    </td>
                    <td>
                      {subscription.planName} · {subscription.price} {subscription.currency}
                    </td>
                    <td>{new Date(subscription.endDate).toLocaleDateString()}</td>
                    <td>
                      <select
                        value={subscription.status}
                        onChange={(event) =>
                          changeSubscription(subscription.id, event.target.value)
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {t(`platform.status_${status}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {subscriptions.length === 0 && (
              <p className="platform-empty">{t("platform.no_subscriptions")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Platform;
