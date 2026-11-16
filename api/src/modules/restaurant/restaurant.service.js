import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";
import RoleService from "../role/role.service.js";
import DepartmentService from "../department/department.service.js";
import AppError from "../../utils/errors/AppError.js";
import { BUSINESS_MESSAGES, normalizeBusinessFields, validateBusiness } from "./businessValidation.js";

const COMPANY_CURRENCIES = new Set(["USD", "EUR", "GBP", "EGP", "SAR", "AED", "JOD", "LBP"]);

const RESTAURANT_FIELDS = [
  "name",
  "address",
  "phone",
  "email",
  "website",
  "logo",
  "currency",
  "settings",
  "openingHours",
  "socialMedia",
  "vatNumber",
  "crNumber",
];

class RestaurantService {
  stripBaseUrl(url) {
    if (!url) return url;

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    let cleanUrl = url;
    while (cleanUrl.startsWith(baseUrl)) {
      cleanUrl = cleanUrl.substring(baseUrl.length);
    }

    const httpsBaseUrl = baseUrl.replace("http://", "https://");
    while (cleanUrl.startsWith(httpsBaseUrl)) {
      cleanUrl = cleanUrl.substring(httpsBaseUrl.length);
    }

    if (cleanUrl && !cleanUrl.startsWith("/") && !cleanUrl.startsWith("http")) {
      cleanUrl = "/" + cleanUrl;
    }

    return cleanUrl;
  }

  cleanLogoUrls(data) {
    const cleanedData = { ...data };
    if (cleanedData.logo) {
      cleanedData.logo = this.stripBaseUrl(cleanedData.logo);
    }
    if (cleanedData.settings?.theme?.logo) {
      cleanedData.settings = {
        ...cleanedData.settings,
        theme: {
          ...cleanedData.settings.theme,
          logo: this.stripBaseUrl(cleanedData.settings.theme.logo),
        },
      };
    }
    return cleanedData;
  }

  pick(data) {
    const cleaned = this.cleanLogoUrls(normalizeBusinessFields(data));
    const payload = {};
    for (const field of RESTAURANT_FIELDS) {
      if (cleaned[field] !== undefined) payload[field] = cleaned[field];
    }
    return payload;
  }

  async getAll() {
    const rows = await prisma.restaurant.findMany({ orderBy: { createdAt: "desc" } });
    return toDocs(rows);
  }

  async getCurrent() {
    const row = await prisma.restaurant.findFirst({ orderBy: { createdAt: "desc" } });
    return toDoc(row);
  }

  async getById(id) {
    const restaurantId = requireUuid(id);
    if (!restaurantId) return null;
    return toDoc(await prisma.restaurant.findUnique({ where: { id: restaurantId } }));
  }

  async create(data) {
    const restaurant = await prisma.restaurant.create({ data: this.pick(data) });
    await RoleService.seedDefaultRoles(restaurant.id);
    await DepartmentService.seedDefaultDepartments(restaurant.id);
    return toDoc(restaurant);
  }

  async update(id, data) {
    const restaurantId = requireUuid(id);
    if (!restaurantId) return null;
    const existing = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!existing) return null;
    const row = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: this.pick(data),
    });
    return toDoc(row);
  }

  async updateTheme(id, theme) {
    const restaurantId = requireUuid(id);
    if (!restaurantId || !theme || typeof theme !== "object") return null;
    const existing = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!existing) return null;

    const current =
      existing.settings && typeof existing.settings === "object" ? existing.settings : {};
    const nextTheme = { ...(current.theme || {}) };
    for (const key of ["primaryColor", "secondaryColor", "accentColor", "mode", "logo"]) {
      if (theme[key] !== undefined && theme[key] !== null) {
        nextTheme[key] = key === "logo" ? this.stripBaseUrl(theme[key]) : theme[key];
      }
    }

    const row = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { settings: { ...current, theme: nextTheme } },
    });
    return toDoc(row);
  }

  async updateAds(id, ads) {
    const restaurantId = requireUuid(id);
    if (!restaurantId) return null;
    const existing = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!existing) return null;

    const current =
      existing.settings && typeof existing.settings === "object" ? existing.settings : {};
    const next = (Array.isArray(ads) ? ads : []).slice(0, 12).map((item) => {
      const url = this.stripBaseUrl(String(item?.url || ""));
      return {
        id: String(item?.id || "").slice(0, 64),
        name: String(item?.name || "").slice(0, 120),
        url: url.slice(0, 300),
        kind: item?.kind === "video" ? "video" : "image",
        visible: Boolean(item?.visible),
      };
    }).filter((item) => item.id && item.url.startsWith("/uploads/ads/"));

    const row = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { settings: { ...current, adsBoard: next } },
    });
    return toDoc(row);
  }

  async updateCompany(id, body = {}) {
    const restaurantId = requireUuid(id);
    if (!restaurantId) return null;
    const existing = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!existing) return null;

    const requested = String(body.currency || existing.currency || "USD").toUpperCase();
    const currency = COMPANY_CURRENCIES.has(requested) ? requested : existing.currency;
    const merged = normalizeBusinessFields({
      name: body.name,
      address: body.address,
      phone: body.phone,
      email: existing.email,
      currency,
      vatNumber: body.vatNumber,
      crNumber: body.crNumber,
    });
    const check = validateBusiness(merged, { requireIdentity: true });
    if (!check.valid) {
      throw new AppError(check.issues.map((issue) => BUSINESS_MESSAGES[issue.code]).join(". "), 400);
    }

    const current = existing.settings && typeof existing.settings === "object" ? existing.settings : {};
    const incoming = body.company && typeof body.company === "object" ? body.company : {};
    const percent = (value, fallback) => {
      const number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return Math.min(100, Math.max(0, Math.round(number * 10) / 10));
    };
    const zone = String(incoming.timezone || "").trim();
    const company = {
      outletName: String(incoming.outletName || "").trim().slice(0, 80),
      siteType: incoming.siteType === "warehouse" ? "warehouse" : "outlet",
      timezone: /^[A-Za-z0-9_+./-]{1,64}$/.test(zone) ? zone : "",
      language: incoming.language === "ar" ? "ar" : "en",
      kotMode: incoming.kotMode === "kds" ? "kds" : "print",
      receiptFooter: String(incoming.receiptFooter || "").trim().slice(0, 160),
      dialCode: String(incoming.dialCode || "").replace(/\D/g, "").slice(0, 4),
    };

    const row = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name: merged.name,
        address: merged.address,
        phone: merged.phone,
        currency: merged.currency,
        vatNumber: merged.vatNumber,
        crNumber: merged.crNumber,
        settings: {
          ...current,
          taxPercent: percent(body.taxPercent, Number(current.taxPercent) || 0),
          serviceChargePercent: percent(body.serviceChargePercent, Number(current.serviceChargePercent) || 0),
          company,
        },
      },
    });
    return toDoc(row);
  }
}

export default new RestaurantService();
