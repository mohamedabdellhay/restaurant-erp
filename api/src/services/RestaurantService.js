import prisma from "../db/client.js";
import { toDoc, toDocs } from "../db/present.js";
import { requireUuid } from "../db/ids.js";
import RoleService from "./RoleService.js";
import DepartmentService from "./DepartmentService.js";

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
    const cleaned = this.cleanLogoUrls(data);
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
}

export default new RestaurantService();
