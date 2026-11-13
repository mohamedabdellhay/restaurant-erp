import prisma from "../../db/client.js";
import { toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";

const CURRENCIES = ["USD", "EUR", "GBP", "EGP", "SAR", "AED", "JOD", "LBP"];
const SUBSCRIPTION_STATUSES = ["pending", "active", "cancelled", "expired"];

const settingFields = [
  "name",
  "supportEmail",
  "supportPhone",
  "defaultCurrency",
  "allowRegistration",
  "maintenanceMode",
];

class AdminService {
  currencies() {
    return CURRENCIES;
  }

  async getSettings() {
    return prisma.platformSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });
  }

  async updateSettings(input) {
    const data = {};
    for (const field of settingFields) {
      if (input[field] !== undefined) data[field] = input[field];
    }
    if (data.name != null) data.name = String(data.name).trim();
    if (data.supportEmail != null) data.supportEmail = String(data.supportEmail).trim();
    if (data.supportPhone != null) data.supportPhone = String(data.supportPhone).trim();
    if (data.defaultCurrency != null) {
      data.defaultCurrency = String(data.defaultCurrency).toUpperCase();
    }
    await this.getSettings();
    return prisma.platformSetting.update({ where: { id: "default" }, data });
  }

  async overview() {
    const [restaurants, activeSubscriptions, pendingSubscriptions, plans, staff, settings] =
      await Promise.all([
        prisma.restaurant.count(),
        prisma.subscription.count({ where: { status: "active" } }),
        prisma.subscription.count({ where: { status: "pending" } }),
        prisma.plan.count(),
        prisma.staff.count({ where: { isPlatformOwner: false } }),
        this.getSettings(),
      ]);

    return {
      restaurants,
      activeSubscriptions,
      pendingSubscriptions,
      plans,
      staff,
      settings,
    };
  }

  async listRestaurants() {
    const rows = await prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { staff: true, orders: true } },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { plan: { select: { name: true } } },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email || "",
      phone: row.phone,
      address: row.address,
      currency: row.currency,
      vatNumber: row.vatNumber || "",
      crNumber: row.crNumber || "",
      createdAt: row.createdAt,
      staffCount: row._count.staff,
      orderCount: row._count.orders,
      planName: row.subscriptions[0]?.plan?.name || "",
      subscriptionStatus: row.subscriptions[0]?.status || "",
    }));
  }

  async updateRestaurant(id, input) {
    const restaurantId = requireUuid(id);
    if (!restaurantId) return null;
    const existing = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!existing) return null;

    const data = {};
    for (const field of ["name", "email", "phone", "address", "currency"]) {
      if (input[field] !== undefined) data[field] = input[field];
    }
    if (data.name != null) data.name = String(data.name).trim();
    if (data.email != null) data.email = String(data.email).trim() || null;
    if (data.phone != null) data.phone = String(data.phone).trim();
    if (data.address != null) data.address = String(data.address).trim();
    if (data.currency != null) data.currency = String(data.currency).toUpperCase();

    await prisma.restaurant.update({ where: { id: restaurantId }, data });
    const rows = await this.listRestaurants();
    return rows.find((row) => row.id === restaurantId) || null;
  }

  async listPlans() {
    const rows = await prisma.plan.findMany({ orderBy: { price: "asc" } });
    return toDocs(rows);
  }

  planPayload(input = {}, { partial = false } = {}) {
    const data = {};
    const include = (value) => !partial || value !== undefined;

    if (include(input.name)) data.name = String(input.name ?? "").trim();
    if (include(input.price)) {
      const price = Number(input.price);
      if (Number.isFinite(price)) data.price = price;
    }
    if (include(input.currency)) {
      data.currency = String(input.currency || "EGP").toUpperCase();
    }
    if (include(input.description)) {
      data.description = String(input.description ?? "").trim() || null;
    }
    if (include(input.features)) {
      data.features = Array.isArray(input.features)
        ? input.features.map((item) => String(item).trim()).filter(Boolean)
        : [];
    }
    if (include(input.isActive)) data.isActive = Boolean(input.isActive);

    if (include(input.limits)) {
      const limits = {};
      if (!partial || input.limits?.users !== undefined) {
        const users = Number(input.limits?.users ?? 5);
        if (Number.isFinite(users)) limits.users = users;
      }
      if (!partial || input.limits?.branches !== undefined) {
        const branches = Number(input.limits?.branches ?? 1);
        if (Number.isFinite(branches)) limits.branches = branches;
      }
      if (Object.keys(limits).length) data.limits = limits;
    }

    return data;
  }

  async createPlan(input) {
    const plan = await prisma.plan.create({ data: this.planPayload(input) });
    return toDocs([plan])[0];
  }

  async updatePlan(id, input) {
    const planId = requireUuid(id);
    if (!planId) return null;
    const existing = await prisma.plan.findUnique({ where: { id: planId } });
    if (!existing) return null;
    const data = this.planPayload(input, { partial: true });
    if (data.limits) {
      const current =
        existing.limits && typeof existing.limits === "object" ? existing.limits : {};
      data.limits = { ...current, ...data.limits };
    }
    const plan = await prisma.plan.update({
      where: { id: planId },
      data,
    });
    return toDocs([plan])[0];
  }

  async listSubscriptions() {
    const rows = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: { select: { id: true, name: true } },
        plan: { select: { id: true, name: true, price: true, currency: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
      autoRenew: row.autoRenew,
      restaurantId: row.restaurant?.id || row.restaurantId,
      restaurantName: row.restaurant?.name || "",
      planId: row.plan?.id || row.planId,
      planName: row.plan?.name || "",
      price: row.plan?.price ?? 0,
      currency: row.plan?.currency || "EGP",
    }));
  }

  async updateSubscription(id, status) {
    const subscriptionId = requireUuid(id);
    if (!subscriptionId || !SUBSCRIPTION_STATUSES.includes(status)) return null;
    const existing = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!existing) return null;
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status },
    });
    const rows = await this.listSubscriptions();
    return rows.find((row) => row.id === subscriptionId) || null;
  }
}

export default new AdminService();
