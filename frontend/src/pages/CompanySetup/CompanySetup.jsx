import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import api from "@services/api";
import restaurantService from "@services/restaurantService";
import { getErrorMessage } from "@utils/errorMessage";
import { validateBusiness } from "@utils/businessValidation";
import { uploadUrl } from "../../utils/uploadUrl";
import "./CompanySetup.css";

const CURRENCIES = ["USD", "EUR", "GBP", "EGP", "SAR", "AED", "JOD", "LBP"];
const DIAL_CODES = ["20", "1", "966", "971", "44", "962", "961"];
const TIMEZONES = [
  "UTC",
  "Africa/Cairo",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Amman",
  "Asia/Beirut",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
];

const EMPTY = {
  id: "",
  name: "",
  address: "",
  dial: "",
  mobile: "",
  email: "",
  currency: "USD",
  vatNumber: "",
  crNumber: "",
  outletName: "",
  siteType: "outlet",
  timezone: "",
  language: "en",
  kotMode: "print",
  receiptFooter: "",
  taxPercent: 0,
  serviceChargePercent: 0,
  logoUrl: "",
  logoName: "",
};

function detectedZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function zoneLabel(zone) {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: zone,
      timeZoneName: "longOffset",
    }).formatToParts(new Date());
    const offset = parts.find((part) => part.type === "timeZoneName")?.value || "UTC";
    const compact = offset.replace("GMT", "UTC").replace("UTC", "");
    return `(${compact || "+00:00"}) ${zone}`;
  } catch {
    return zone;
  }
}

function splitPhone(phone, dialCode) {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");
  const saved = String(dialCode || "").replace(/\D/g, "");
  if (saved && digits.startsWith(saved)) {
    return { dial: saved, mobile: digits.slice(saved.length) };
  }
  const match = DIAL_CODES.find((code) => digits.startsWith(code) && digits.length - code.length >= 6);
  if (!match) return { dial: "", mobile: raw };
  return { dial: match, mobile: digits.slice(match.length) };
}

function joinPhone(dial, mobile) {
  const local = String(mobile || "").trim();
  if (!dial) return local;
  const digits = local.replace(/\D/g, "");
  return digits.startsWith(dial) ? digits : `${dial}${digits}`;
}

function fromRestaurant(restaurant, language) {
  const company = restaurant.settings?.company || {};
  const phone = splitPhone(restaurant.phone, company.dialCode);
  const logo = restaurant.logo || restaurant.settings?.theme?.logo || "";
  const zone = company.timezone || detectedZone();
  return {
    id: restaurant._id || restaurant.id || "",
    name: restaurant.name || "",
    address: restaurant.address || "",
    dial: phone.dial,
    mobile: phone.mobile,
    email: restaurant.email || "",
    currency: restaurant.currency || "USD",
    vatNumber: restaurant.vatNumber || "",
    crNumber: restaurant.crNumber || "",
    outletName: company.outletName || "",
    siteType: company.siteType === "warehouse" ? "warehouse" : "outlet",
    timezone: zone,
    language: company.language === "ar" || company.language === "en" ? company.language : language,
    kotMode: company.kotMode === "kds" ? "kds" : "print",
    receiptFooter: company.receiptFooter || "",
    taxPercent: Number(restaurant.settings?.taxPercent) || 0,
    serviceChargePercent: Number(restaurant.settings?.serviceChargePercent) || 0,
    logoUrl: uploadUrl(logo),
    logoName: logo ? String(logo).split("/").pop() : "",
  };
}

const CompanySetup = () => {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const draft = form || EMPTY;
  const issues = validateBusiness({
    name: draft.name,
    address: draft.address,
    phone: joinPhone(draft.dial, draft.mobile),
    email: draft.email,
    currency: draft.currency,
    vatNumber: draft.vatNumber,
    crNumber: draft.crNumber,
  });
  const issue = (field) => issues.issues.find((item) => item.field === field);

  const load = async () => {
    const result = await api.get("/restaurant/settings");
    const next = fromRestaurant(result.data?.data || {}, i18n.language);
    setForm(next);
    setSaved(next);
  };

  useEffect(() => {
    load().catch((error) => setMessage({ type: "error", text: getErrorMessage(error, t("nav.company_save_failed")) }));
  }, [t]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const patch = (field, value) => setForm((current) => ({ ...(current || EMPTY), [field]: value }));

  const chooseLogo = async (file) => {
    if (!file || !draft.id) return;
    const type = String(file.type || "").toLowerCase();
    const named = /\.(jpe?g|png|gif)$/i.test(file.name);
    if (!["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(type) && !named) {
      setMessage({ type: "error", text: t("nav.company_logo_type") });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: t("nav.company_logo_large") });
      return;
    }
    try {
      const response = await restaurantService.uploadLogo(draft.id, file);
      const logo = response.data?.logo || response.logo || "";
      const path = String(logo).replace(/^https?:\/\/[^/]+/, "");
      if (path.startsWith("/")) {
        await api.put(`/restaurant/${draft.id}/theme`, { logo: path });
      }
      setForm((current) => ({
        ...(current || EMPTY),
        logoUrl: uploadUrl(path || logo),
        logoName: file.name,
      }));
      setMessage({ type: "success", text: t("nav.company_logo_saved") });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, t("nav.company_save_failed")) });
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!draft.id || saving) return;
    if (!issues.valid) {
      setMessage({
        type: "error",
        text: issues.issues.map((item) => t(`settings.business_errors.${item.code}`)).join(" "),
      });
      return;
    }
    setSaving(true);
    try {
      const result = await api.put(`/restaurant/${draft.id}/company`, {
        name: draft.name,
        address: draft.address,
        phone: joinPhone(draft.dial, draft.mobile),
        currency: draft.currency,
        vatNumber: draft.vatNumber,
        crNumber: draft.crNumber,
        taxPercent: Number(draft.taxPercent),
        serviceChargePercent: Number(draft.serviceChargePercent),
        company: {
          outletName: draft.outletName,
          siteType: draft.siteType,
          timezone: draft.timezone,
          language: draft.language,
          kotMode: draft.kotMode,
          receiptFooter: draft.receiptFooter,
          dialCode: draft.dial,
        },
      });
      const restaurant = result.data?.data || {};
      const next = fromRestaurant(restaurant, draft.language);
      setForm(next);
      setSaved(next);
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser?.restaurant) {
        storedUser.restaurant = {
          ...storedUser.restaurant,
          name: restaurant.name,
          address: restaurant.address,
          phone: restaurant.phone,
          currency: restaurant.currency,
          vatNumber: restaurant.vatNumber,
          crNumber: restaurant.crNumber,
          settings: restaurant.settings,
        };
        storedUser.restaurantSettings = restaurant.settings;
        localStorage.setItem("user", JSON.stringify(storedUser));
      }
      localStorage.setItem("restaurant", JSON.stringify(restaurant));
      localStorage.setItem("restaurantSettings", JSON.stringify(restaurant.settings || {}));
      window.dispatchEvent(new CustomEvent("restaurantSettingsUpdate", {
        detail: { restaurantSettings: restaurant.settings || {} },
      }));
      if (draft.language && draft.language !== i18n.language) {
        await i18n.changeLanguage(draft.language);
      }
      setMessage({ type: "success", text: t("nav.company_saved") });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, t("nav.company_save_failed")) });
    } finally {
      setSaving(false);
    }
  };

  const zones = draft.timezone && !TIMEZONES.includes(draft.timezone)
    ? [draft.timezone, ...TIMEZONES]
    : TIMEZONES;

  return (
    <div className="company-setup">
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.company_title")}</h1>
      <form onSubmit={save}>
        <section className="company-card">
          <h2>{t("nav.company_restaurant")}</h2>
          <div className="company-grid">
            <label htmlFor="company-name">{t("nav.company_name")} *</label>
            <input id="company-name" value={draft.name} onChange={(event) => patch("name", event.target.value)} />
            <label>{t("nav.company_logo")}</label>
            <div className="company-logo">
              <button type="button" onClick={() => fileRef.current?.click()}>
                <Download size={16} />
                {t("nav.company_choose")}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,.jpg,.jpeg,.png,.gif"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  chooseLogo(file);
                }}
              />
              <p>{t("nav.company_logo_note")}</p>
              {draft.logoName && <span>{draft.logoName}</span>}
            </div>

            <label htmlFor="company-address">{t("nav.company_address")} *</label>
            <input id="company-address" value={draft.address} onChange={(event) => patch("address", event.target.value)} />
            <label htmlFor="company-mobile">{t("nav.company_mobile")} *</label>
            <div className="company-phone">
              <select aria-label={t("nav.company_dial")} value={draft.dial} onChange={(event) => patch("dial", event.target.value)}>
                <option value="">{t("nav.company_dial_local")}</option>
                {draft.dial && !DIAL_CODES.includes(draft.dial) && (
                  <option value={draft.dial}>{`+${draft.dial}`}</option>
                )}
                {DIAL_CODES.map((code) => (
                  <option key={code} value={code}>{`+${code}`}</option>
                ))}
              </select>
              <input id="company-mobile" value={draft.mobile} onChange={(event) => patch("mobile", event.target.value)} />
            </div>

            <label htmlFor="company-tin">{t("nav.company_tin")} *</label>
            <input id="company-tin" value={draft.vatNumber} onChange={(event) => patch("vatNumber", event.target.value)} />
            <label htmlFor="company-bin">{t("nav.company_bin")} *</label>
            <input id="company-bin" value={draft.crNumber} onChange={(event) => patch("crNumber", event.target.value)} />

            <label htmlFor="company-outlet">{t("nav.company_outlet")} *</label>
            <input id="company-outlet" value={draft.outletName} onChange={(event) => patch("outletName", event.target.value)} />
            <label>{t("nav.company_type")} *</label>
            <div className="company-radios">
              <label>
                <input type="radio" name="siteType" checked={draft.siteType === "outlet"} onChange={() => patch("siteType", "outlet")} />
                {t("nav.company_outlet_type")}
              </label>
              <label>
                <input type="radio" name="siteType" checked={draft.siteType === "warehouse"} onChange={() => patch("siteType", "warehouse")} />
                {t("nav.company_warehouse")}
              </label>
            </div>

            <label htmlFor="company-footer">{t("nav.company_footer")} *</label>
            <input id="company-footer" value={draft.receiptFooter} onChange={(event) => patch("receiptFooter", event.target.value)} />
          </div>
          {form && issue("name") && <p className="company-error">{t(`settings.business_errors.${issue("name").code}`)}</p>}
          {form && issue("address") && <p className="company-error">{t(`settings.business_errors.${issue("address").code}`)}</p>}
          {form && issue("phone") && <p className="company-error">{t(`settings.business_errors.${issue("phone").code}`)}</p>}
          {form && issue("vatNumber") && <p className="company-error">{t(`settings.business_errors.${issue("vatNumber").code}`)}</p>}
          {form && issue("crNumber") && <p className="company-error">{t(`settings.business_errors.${issue("crNumber").code}`)}</p>}
        </section>

        <section className="company-card">
          <h2>{t("nav.company_system")}</h2>
          <div className="company-stack">
            <label htmlFor="company-zone">{t("nav.company_timezone")} *</label>
            <select id="company-zone" value={draft.timezone} onChange={(event) => patch("timezone", event.target.value)}>
              {zones.map((zone) => (
                <option key={zone} value={zone}>{zoneLabel(zone)}</option>
              ))}
            </select>
            <label htmlFor="company-currency">{t("nav.company_currency")} *</label>
            <select id="company-currency" value={draft.currency} onChange={(event) => patch("currency", event.target.value)}>
              {!CURRENCIES.includes(draft.currency) && <option value={draft.currency}>{draft.currency}</option>}
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            <label htmlFor="company-language">{t("nav.company_language")} *</label>
            <select id="company-language" value={draft.language} onChange={(event) => patch("language", event.target.value)}>
              <option value="en">{t("nav.company_language_en")}</option>
              <option value="ar">{t("nav.company_language_ar")}</option>
            </select>
          </div>
        </section>

        <section className="company-card">
          <h2>{t("nav.company_kot")}</h2>
          <div className="company-kot">
            <span>{t("nav.company_kot_question")}</span>
            <label>
              <input type="radio" name="kotMode" checked={draft.kotMode === "print"} onChange={() => patch("kotMode", "print")} />
              {t("nav.company_kot_print")}
            </label>
            <label>
              <input type="radio" name="kotMode" checked={draft.kotMode === "kds"} onChange={() => patch("kotMode", "kds")} />
              {t("nav.company_kds")}
            </label>
          </div>
        </section>

        <section className="company-card">
          <h2>{t("nav.company_vat")}</h2>
          <div className="company-grid">
            <label htmlFor="company-vat">{t("nav.company_vat_percent")}</label>
            <input
              id="company-vat"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={draft.taxPercent}
              onChange={(event) => patch("taxPercent", event.target.value)}
            />
            <label htmlFor="company-service">{t("nav.company_service")}</label>
            <input
              id="company-service"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={draft.serviceChargePercent}
              onChange={(event) => patch("serviceChargePercent", event.target.value)}
            />
          </div>
        </section>

        <div className="company-actions">
          <button type="button" className="company-cancel" onClick={() => saved && setForm(saved)}>
            {t("nav.company_cancel")}
          </button>
          <button type="submit" className="company-save" disabled={saving}>
            {t("nav.company_save")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanySetup;
