import prisma from "../db/client.js";
import { toDoc, toDocs } from "../db/present.js";
import { requireUuid } from "../db/ids.js";
import RestaurantService from "./RestaurantService.js";
import PaymentFactory from "./payment/PaymentFactory.js";
import AppError from "../utils/errors/AppError.js";

const orderInclude = {
  table: { select: { id: true, number: true } },
  customer: { select: { id: true, name: true, phone: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  items: {
    include: {
      menuItem: { select: { id: true, name: true, price: true } },
    },
  },
};

class OrderService {
  async getAllOrders(restaurantId, filter = {}) {
    const where = { restaurantId: requireUuid(restaurantId) };
    if (filter.status) where.status = filter.status;
    if (filter.paymentStatus) where.paymentStatus = filter.paymentStatus;
    if (filter.type) where.type = filter.type;
    const rows = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    return toDocs(rows);
  }

  async getOrderById(id, restaurantId) {
    const orderId = requireUuid(id);
    if (!orderId) return null;
    return toDoc(
      await prisma.order.findFirst({
        where: { id: orderId, restaurantId: requireUuid(restaurantId) },
        include: orderInclude,
      }),
    );
  }

  async _priceItems(items, restaurantId) {
    let subtotal = 0;
    const priced = [];
    for (const item of items || []) {
      const menuItemId = requireUuid(item.menuItem || item.menuItemId);
      if (!menuItemId) continue;
      const menuItem = await prisma.menuItem.findFirst({
        where: { id: menuItemId, restaurantId: requireUuid(restaurantId) },
      });
      if (!menuItem) continue;

      const qty = item.qty || 1;
      let modifiersTotal = 0;
      for (const mod of item.modifiers || []) {
        modifiersTotal += mod.price || 0;
      }
      subtotal += (menuItem.price + modifiersTotal) * qty;
      priced.push({
        menuItemId,
        qty,
        price: menuItem.price,
        modifiers: item.modifiers || [],
        notes: item.notes || "",
      });
    }
    return { subtotal, priced };
  }

  async _totals(subtotal, restaurant) {
    const taxPercent = restaurant?.settings?.taxPercent || 0;
    const serviceChargePercent = restaurant?.settings?.serviceChargePercent || 0;
    const tax = (subtotal * taxPercent) / 100;
    const serviceCharge = (subtotal * serviceChargePercent) / 100;
    return { tax, serviceCharge, total: subtotal + tax + serviceCharge };
  }

  async createOrder(data, staffId) {
    const restaurantId = requireUuid(data.restaurant) || (await RestaurantService.getCurrent())?.id;
    const restaurant = restaurantId
      ? await prisma.restaurant.findUnique({ where: { id: restaurantId } })
      : null;
    const { subtotal, priced } = await this._priceItems(data.items, restaurantId);
    const totals = await this._totals(subtotal, restaurant);

    const row = await prisma.order.create({
      data: {
        type: data.type || null,
        tableId: requireUuid(data.table),
        customerId: requireUuid(data.customer),
        notes: data.notes || "",
        status: data.status || "pending",
        paymentStatus: data.paymentStatus || "pending",
        paymentMethod: data.paymentMethod || "",
        subtotal,
        ...totals,
        createdById: requireUuid(staffId),
        restaurantId,
        items: { create: priced },
      },
      include: orderInclude,
    });
    return toDoc(row);
  }

  async updateOrder(id, restaurantId, data) {
    const existing = await prisma.order.findFirst({
      where: { id: requireUuid(id), restaurantId: requireUuid(restaurantId) },
    });
    if (!existing) return null;

    const payload = {};
    if (data.type !== undefined) payload.type = data.type || null;
    if (data.table !== undefined) payload.tableId = requireUuid(data.table);
    if (data.customer !== undefined) payload.customerId = requireUuid(data.customer);
    if (data.notes !== undefined) payload.notes = data.notes || "";
    if (data.status !== undefined) payload.status = data.status;
    if (data.paymentStatus !== undefined) payload.paymentStatus = data.paymentStatus;
    if (data.paymentMethod !== undefined) payload.paymentMethod = data.paymentMethod || "";
    if (data.payment !== undefined) payload.payment = data.payment;

    const row = await prisma.$transaction(async (tx) => {
      if (data.items) {
        const restaurant = await tx.restaurant.findUnique({
          where: { id: requireUuid(restaurantId) },
        });
        const { subtotal, priced } = await this._priceItems(data.items, restaurantId);
        const totals = await this._totals(subtotal, restaurant);
        Object.assign(payload, { subtotal, ...totals });
        await tx.orderItem.deleteMany({ where: { orderId: existing.id } });
        if (priced.length) {
          await tx.orderItem.createMany({
            data: priced.map((item) => ({ ...item, orderId: existing.id })),
          });
        }
      }
      return tx.order.update({
        where: { id: existing.id },
        data: payload,
        include: orderInclude,
      });
    });
    return toDoc(row);
  }

  async deleteOrder(id, restaurantId) {
    const existing = await prisma.order.findFirst({
      where: { id: requireUuid(id), restaurantId: requireUuid(restaurantId) },
    });
    if (!existing) return null;
    return toDoc(await prisma.order.delete({ where: { id: existing.id } }));
  }

  async searchOrders(query, restaurantId) {
    const customers = await prisma.customer.findMany({
      where: {
        restaurantId: requireUuid(restaurantId),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (!customers.length) return [];
    const rows = await prisma.order.findMany({
      where: {
        restaurantId: requireUuid(restaurantId),
        customerId: { in: customers.map((customer) => customer.id) },
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    return toDocs(rows);
  }

  async getPaymentUrl(orderId, restaurantId, host) {
    const order = await prisma.order.findFirst({
      where: { id: requireUuid(orderId), restaurantId: requireUuid(restaurantId) },
      include: { customer: true },
    });
    if (!order) throw new AppError("Order not found", 404);
    if (order.paymentStatus === "paid") throw new AppError("Order is already paid", 400);

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: requireUuid(restaurantId) },
    });
    const config = restaurant?.settings?.paymentGateways?.kashier || {};
    const provider = PaymentFactory.getProvider("kashier");
    const transactionId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    await prisma.transaction.create({
      data: {
        transactionId,
        provider: "kashier",
        restaurantId: requireUuid(restaurantId),
        amount: order.total,
        currency: "EGP",
        referenceType: "Order",
        referenceId: order.id,
      },
    });

    return provider.getCheckoutUrl(
      transactionId,
      order.total,
      "EGP",
      {
        name: order.customer?.name || "Customer",
        email: order.customer?.email || "customer@example.com",
        reference: order.customer?.id || order.customer?.email || order.id,
      },
      "https://www.linkedin.com/in/mohamedabdellhay/",
      { ...config, restaurantId },
    );
  }
}

export default new OrderService();
