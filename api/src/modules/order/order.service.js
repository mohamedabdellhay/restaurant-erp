import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";
import RestaurantService from "../restaurant/restaurant.service.js";
import PaymentFactory from "../payment/payment.factory.js";
import AppError from "../../utils/errors/AppError.js";
import {
  applyStockDelta,
  assertStock,
  consumesStock,
  recipeNeeds,
} from "../inventory/stockConsumption.js";

const ORDER_STATUSES = new Set([
  "pending",
  "in_kitchen",
  "served",
  "out_for_delivery",
  "delivered",
  "paid",
  "cancelled",
]);

const orderInclude = {
  table: { select: { id: true, number: true } },
  customer: { select: { id: true, name: true, phone: true, email: true, address: true } },
  createdBy: { select: { id: true, name: true } },
  items: {
    include: {
      menuItem: { select: { id: true, name: true, price: true } },
    },
  },
};

function appOrigin() {
  const raw = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
  return String(raw).split(",")[0].trim().replace(/\/$/, "");
}

function linesOf(items) {
  return (items || []).map((item) => ({
    menuItemId: item.menuItemId,
    qty: item.qty,
  }));
}

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
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError("Add at least one menu item.", 400);
    }

    let subtotal = 0;
    const priced = [];
    for (const item of items) {
      const menuItemId = requireUuid(item.menuItem || item.menuItemId);
      if (!menuItemId) throw new AppError("Each order line needs a menu item.", 400);

      const menuItem = await prisma.menuItem.findFirst({
        where: { id: menuItemId, restaurantId: requireUuid(restaurantId) },
      });
      if (!menuItem) throw new AppError("A menu item on this order is not on this menu.", 400);
      if (!menuItem.isActive) throw new AppError(`${menuItem.name} is not on the menu.`, 400);

      const qty = Number(item.qty ?? item.quantity);
      if (!Number.isFinite(qty) || qty < 1) {
        throw new AppError(`Quantity for ${menuItem.name} must be at least 1.`, 400);
      }

      let modifiersTotal = 0;
      for (const mod of item.modifiers || []) {
        modifiersTotal += Number(mod.price) || 0;
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

  async _deliveryAddress(tx, { type, customerId, deliveryAddress, restaurantId }) {
    if (type !== "delivery") return null;
    if (!customerId) throw new AppError("A delivery order needs a customer.", 400);
    const customer = await tx.customer.findFirst({
      where: { id: customerId, restaurantId },
    });
    if (!customer) throw new AppError("Customer not found.", 404);
    const address = String(deliveryAddress || customer.address || "").trim();
    if (!address) {
      throw new AppError("Add a delivery address before sending this order.", 400);
    }
    return address;
  }

  async _syncTables(tx, tableIds) {
    const ids = [...new Set(tableIds.filter(Boolean))];
    for (const tableId of ids) {
      const table = await tx.table.findUnique({ where: { id: tableId } });
      if (!table) continue;
      const open = await tx.order.count({
        where: {
          tableId,
          status: { notIn: ["paid", "cancelled"] },
        },
      });
      if (open > 0 && (table.status === "available" || table.status === "occupied")) {
        if (table.status !== "occupied") {
          await tx.table.update({ where: { id: tableId }, data: { status: "occupied" } });
        }
      } else if (open === 0 && table.status === "occupied") {
        await tx.table.update({ where: { id: tableId }, data: { status: "available" } });
      }
    }
  }

  _nextStatus(data, existingStatus) {
    let status = data.status !== undefined ? data.status : existingStatus;
    if (data.paymentStatus === "paid" && status !== "cancelled") status = "paid";
    if (!ORDER_STATUSES.has(status)) throw new AppError("Invalid order status.", 400);
    return status;
  }

  async createOrder(data, staffId) {
    const restaurantId = requireUuid(data.restaurant) || (await RestaurantService.getCurrent())?.id;
    if (!restaurantId) throw new AppError("Restaurant is required.", 400);
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new AppError("Restaurant not found.", 404);

    const type = data.type || "dineIn";
    const status = this._nextStatus(data, "pending");
    const { subtotal, priced } = await this._priceItems(data.items, restaurantId);
    const totals = await this._totals(subtotal, restaurant);
    const customerId = requireUuid(data.customer);
    const tableId = type === "dineIn" ? requireUuid(data.table) : null;
    if (type === "dineIn" && !tableId) {
      throw new AppError("Choose a table for a dine-in order.", 400);
    }

    const row = await prisma.$transaction(async (tx) => {
      const deliveryAddress = await this._deliveryAddress(tx, {
        type,
        customerId,
        deliveryAddress: data.deliveryAddress,
        restaurantId,
      });
      const needs = await recipeNeeds(tx, priced);
      if (status !== "cancelled") await assertStock(tx, needs);

      const created = await tx.order.create({
        data: {
          type,
          tableId,
          customerId,
          deliveryAddress,
          notes: data.notes || "",
          status,
          paymentStatus: data.paymentStatus || "pending",
          paymentMethod: data.paymentMethod || "",
          subtotal,
          ...totals,
          stockDeducted: false,
          createdById: requireUuid(staffId),
          restaurantId,
          items: { create: priced },
        },
        include: orderInclude,
      });

      if (consumesStock(status)) {
        await applyStockDelta(tx, new Map(), needs, {
          userId: requireUuid(staffId),
          orderId: created.id,
        });
        created.stockDeducted = true;
        await tx.order.update({
          where: { id: created.id },
          data: { stockDeducted: true },
        });
      }

      await this._syncTables(tx, [tableId]);
      return created;
    });
    return toDoc(row);
  }

  async updateOrder(id, restaurantId, data, staffId) {
    const existing = await prisma.order.findFirst({
      where: { id: requireUuid(id), restaurantId: requireUuid(restaurantId) },
      include: { items: true },
    });
    if (!existing) return null;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: requireUuid(restaurantId) },
    });
    const type = data.type !== undefined ? data.type || null : existing.type;
    const status = this._nextStatus(data, existing.status);
    const customerId = data.customer !== undefined ? requireUuid(data.customer) : existing.customerId;
    const tableId = type === "dineIn"
      ? (data.table !== undefined ? requireUuid(data.table) : existing.tableId)
      : null;
    if (type === "dineIn" && !tableId) {
      throw new AppError("Choose a table for a dine-in order.", 400);
    }

    let priced = existing.items.map((item) => ({
      menuItemId: item.menuItemId,
      qty: item.qty,
      price: item.price,
      modifiers: item.modifiers,
      notes: item.notes || "",
    }));
    let subtotal = null;
    let totals = null;
    if (data.items) {
      const pricedResult = await this._priceItems(data.items, restaurantId);
      priced = pricedResult.priced;
      subtotal = pricedResult.subtotal;
      totals = await this._totals(subtotal, restaurant);
    }

    const row = await prisma.$transaction(async (tx) => {
      const deliveryAddress = await this._deliveryAddress(tx, {
        type,
        customerId,
        deliveryAddress: data.deliveryAddress !== undefined ? data.deliveryAddress : existing.deliveryAddress,
        restaurantId: requireUuid(restaurantId),
      });

      const previousNeeds = existing.stockDeducted
        ? await recipeNeeds(tx, linesOf(existing.items))
        : new Map();
      const nextNeeds = consumesStock(status) ? await recipeNeeds(tx, priced) : new Map();
      if (!consumesStock(status) && status !== "cancelled") {
        await assertStock(tx, await recipeNeeds(tx, priced));
      }
      await applyStockDelta(tx, previousNeeds, nextNeeds, {
        userId: requireUuid(staffId),
        orderId: existing.id,
      });

      if (data.items) {
        await tx.orderItem.deleteMany({ where: { orderId: existing.id } });
        if (priced.length) {
          await tx.orderItem.createMany({
            data: priced.map((item) => ({ ...item, orderId: existing.id })),
          });
        }
      }

      const payload = {
        type,
        status,
        tableId,
        customerId,
        deliveryAddress,
        stockDeducted: consumesStock(status),
      };
      if (data.notes !== undefined) payload.notes = data.notes || "";
      if (data.paymentStatus !== undefined) payload.paymentStatus = data.paymentStatus;
      if (status === "paid") payload.paymentStatus = "paid";
      if (data.paymentMethod !== undefined) payload.paymentMethod = data.paymentMethod || "";
      if (data.payment !== undefined) payload.payment = data.payment;
      if (totals) Object.assign(payload, { subtotal, ...totals });

      if (payload.paymentStatus || payload.paymentMethod) {
        await tx.invoice.updateMany({
          where: { orderId: existing.id },
          data: {
            ...(payload.paymentStatus ? { paymentStatus: payload.paymentStatus } : {}),
            ...(payload.paymentMethod ? { paymentMethod: payload.paymentMethod } : {}),
          },
        });
      }

      const updated = await tx.order.update({
        where: { id: existing.id },
        data: payload,
        include: orderInclude,
      });
      await this._syncTables(tx, [existing.tableId, tableId]);
      return updated;
    });
    return toDoc(row);
  }

  async deleteOrder(id, restaurantId, staffId) {
    const existing = await prisma.order.findFirst({
      where: { id: requireUuid(id), restaurantId: requireUuid(restaurantId) },
      include: { items: true },
    });
    if (!existing) return null;

    const row = await prisma.$transaction(async (tx) => {
      if (existing.stockDeducted) {
        const needs = await recipeNeeds(tx, linesOf(existing.items));
        await applyStockDelta(tx, needs, new Map(), {
          userId: requireUuid(staffId),
          orderId: existing.id,
        });
      }
      const deleted = await tx.order.delete({ where: { id: existing.id } });
      await this._syncTables(tx, [existing.tableId]);
      return deleted;
    });
    return toDoc(row);
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

  async getPaymentUrl(orderId, restaurantId) {
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
    if (!String(config.merchantId || "").trim() || !String(config.apiKey || "").trim()) {
      throw new AppError(
        "Online payments are not set up. Add Kashier keys in Settings, or take cash.",
        400,
      );
    }

    const currency = restaurant?.currency || "USD";
    const provider = PaymentFactory.getProvider("kashier");
    const transactionId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    await prisma.transaction.create({
      data: {
        transactionId,
        provider: "kashier",
        restaurantId: requireUuid(restaurantId),
        amount: order.total,
        currency,
        referenceType: "Order",
        referenceId: order.id,
      },
    });

    return provider.getCheckoutUrl(
      transactionId,
      order.total,
      currency,
      {
        name: order.customer?.name || "Customer",
        email: order.customer?.email || "customer@example.com",
        reference: order.customer?.id || order.customer?.email || order.id,
      },
      `${appOrigin()}/payment/success?kind=order`,
      { ...config, restaurantId },
    );
  }
}

export default new OrderService();
