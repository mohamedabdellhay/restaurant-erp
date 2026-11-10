import { Prisma } from "@prisma/client";
import prisma from "../db/client.js";
import { toDocs } from "../db/present.js";
import { requireUuid } from "../db/ids.js";

function num(value) {
  return value == null ? 0 : Number(value);
}

function createdRange(from, to) {
  if (!from && !to) return undefined;
  const createdAt = {};
  if (from) createdAt.gte = new Date(from);
  if (to) createdAt.lte = new Date(to);
  return createdAt;
}

function dateClause(from, to, column = '"createdAt"') {
  const parts = [];
  if (from) parts.push(Prisma.sql`${Prisma.raw(column)} >= ${new Date(from)}`);
  if (to) parts.push(Prisma.sql`${Prisma.raw(column)} <= ${new Date(to)}`);
  if (!parts.length) return Prisma.empty;
  return Prisma.sql`AND ${Prisma.join(parts, " AND ")}`;
}

function trendSelect(groupBy) {
  if (groupBy === "hour") {
    return Prisma.sql`
      EXTRACT(YEAR FROM "createdAt")::int AS year,
      EXTRACT(MONTH FROM "createdAt")::int AS month,
      EXTRACT(DAY FROM "createdAt")::int AS day,
      EXTRACT(HOUR FROM "createdAt")::int AS hour
    `;
  }
  if (groupBy === "week") {
    return Prisma.sql`
      EXTRACT(YEAR FROM "createdAt")::int AS year,
      EXTRACT(WEEK FROM "createdAt")::int AS week
    `;
  }
  if (groupBy === "month") {
    return Prisma.sql`
      EXTRACT(YEAR FROM "createdAt")::int AS year,
      EXTRACT(MONTH FROM "createdAt")::int AS month
    `;
  }
  return Prisma.sql`
    EXTRACT(YEAR FROM "createdAt")::int AS year,
    EXTRACT(MONTH FROM "createdAt")::int AS month,
    EXTRACT(DAY FROM "createdAt")::int AS day
  `;
}

class DashboardService {
  async getOverview(restaurantId, from, to) {
    const id = requireUuid(restaurantId);
    const createdAt = createdRange(from, to);
    const [revenue, orders, customers] = await Promise.all([
      prisma.order.aggregate({
        where: { restaurantId: id, status: "paid", ...(createdAt && { createdAt }) },
        _sum: { total: true },
        _avg: { total: true },
      }),
      prisma.order.count({
        where: { restaurantId: id, ...(createdAt && { createdAt }) },
      }),
      prisma.customer.count({ where: { restaurantId: id } }),
    ]);

    return {
      totalRevenue: revenue._sum.total || 0,
      averageOrderValue: revenue._avg.total || 0,
      totalOrders: orders,
      totalCustomers: customers,
      period: { from, to },
    };
  }

  async getRevenueAnalytics(restaurantId, from, to, groupBy = "day") {
    const id = requireUuid(restaurantId);
    const range = dateClause(from, to);
    const bucket = trendSelect(groupBy);
    const groupBySql =
      groupBy === "hour"
        ? Prisma.sql`GROUP BY 1, 2, 3, 4 ORDER BY 1, 2, 3, 4`
        : groupBy === "week" || groupBy === "month"
          ? Prisma.sql`GROUP BY 1, 2 ORDER BY 1, 2`
          : Prisma.sql`GROUP BY 1, 2, 3 ORDER BY 1, 2, 3`;
    const [trendRows, paymentMethods, orderTypes] = await Promise.all([
      prisma.$queryRaw`
        SELECT ${bucket},
               COALESCE(SUM(total), 0)::float8 AS revenue,
               COUNT(*)::int AS orders,
               COALESCE(AVG(total), 0)::float8 AS "averageOrderValue"
        FROM orders
        WHERE "restaurantId" = ${id} AND status = 'paid' ${range}
        ${groupBySql}
      `,
      prisma.$queryRaw`
        SELECT payment->>'method' AS method,
               COALESCE(SUM(total), 0)::float8 AS revenue,
               COUNT(*)::int AS count
        FROM orders
        WHERE "restaurantId" = ${id} AND status = 'paid' ${range}
        GROUP BY 1
      `,
      prisma.$queryRaw`
        SELECT type,
               COALESCE(SUM(total), 0)::float8 AS revenue,
               COUNT(*)::int AS count
        FROM orders
        WHERE "restaurantId" = ${id} AND status = 'paid' ${range}
        GROUP BY type
      `,
    ]);

    return {
      trends: trendRows.map((row) => {
        const _id = { year: num(row.year) };
        if (row.month != null) _id.month = num(row.month);
        if (row.day != null) _id.day = num(row.day);
        if (row.week != null) _id.week = num(row.week);
        if (row.hour != null) _id.hour = num(row.hour);
        return {
          _id,
          revenue: num(row.revenue),
          orders: num(row.orders),
          averageOrderValue: num(row.averageOrderValue),
        };
      }),
      paymentMethods: paymentMethods.map((row) => ({
        _id: row.method,
        revenue: num(row.revenue),
        count: num(row.count),
      })),
      orderTypes: orderTypes.map((row) => ({
        _id: row.type,
        revenue: num(row.revenue),
        count: num(row.count),
      })),
      period: { from, to },
    };
  }

  async getTopSellingItems(restaurantId, from, to, limit = 10) {
    const id = requireUuid(restaurantId);
    const range = dateClause(from, to, 'o."createdAt"');
    const take = Number(limit) || 10;
    const rows = await prisma.$queryRaw`
      SELECT mi.id AS id, mi.name, mi.image,
             SUM(oi.qty)::int AS "totalQuantity",
             SUM(oi.qty * oi.price)::float8 AS "totalRevenue",
             COUNT(*)::int AS "orderCount"
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN menu_items mi ON mi.id = oi."menuItemId"
      WHERE o."restaurantId" = ${id} ${range}
      GROUP BY mi.id
      ORDER BY "totalRevenue" DESC
      LIMIT ${take}
    `;
    return rows.map((row) => ({
      _id: row.id,
      name: row.name,
      image: row.image,
      totalQuantity: num(row.totalQuantity),
      totalRevenue: num(row.totalRevenue),
      orderCount: num(row.orderCount),
      averagePrice: row.totalQuantity ? num(row.totalRevenue) / num(row.totalQuantity) : 0,
    }));
  }

  async getStaffPerformance(restaurantId, from, to) {
    const id = requireUuid(restaurantId);
    const range = dateClause(from, to, 'o."createdAt"');
    const rows = await prisma.$queryRaw`
      SELECT s.id, s.name, s.email, s."roleId" AS role,
             COUNT(*)::int AS "totalOrders",
             COALESCE(SUM(o.total), 0)::float8 AS "totalRevenue",
             COALESCE(AVG(o.total), 0)::float8 AS "averageOrderValue"
      FROM orders o
      JOIN staff s ON s.id = o."createdById"
      WHERE o."restaurantId" = ${id} ${range}
      GROUP BY s.id
      ORDER BY "totalRevenue" DESC
    `;
    return rows.map((row) => ({
      _id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      totalOrders: num(row.totalOrders),
      totalRevenue: num(row.totalRevenue),
      averageOrderValue: num(row.averageOrderValue),
    }));
  }

  async getCustomerAnalytics(restaurantId, from, to) {
    const id = requireUuid(restaurantId);
    const createdAt = createdRange(from, to);
    const range = dateClause(from, to, 'o."createdAt"');
    const plainRange = dateClause(from, to);
    const [totalCustomers, newCustomers, topCustomers, frequency] = await Promise.all([
      prisma.customer.count({ where: { restaurantId: id } }),
      prisma.customer.count({
        where: { restaurantId: id, ...(createdAt && { createdAt }) },
      }),
      prisma.$queryRaw`
        SELECT c.id, c.name, c.phone, c.email,
               COUNT(*)::int AS "totalOrders",
               COALESCE(SUM(o.total), 0)::float8 AS "totalSpent",
               COALESCE(AVG(o.total), 0)::float8 AS "averageOrderValue"
        FROM orders o
        JOIN customers c ON c.id = o."customerId"
        WHERE o."restaurantId" = ${id} AND o."customerId" IS NOT NULL ${range}
        GROUP BY c.id
        ORDER BY "totalSpent" DESC
        LIMIT 10
      `,
      prisma.$queryRaw`
        SELECT COALESCE(AVG(cnt), 0)::float8 AS "averageOrdersPerCustomer",
               COUNT(*)::int AS "totalCustomersWithOrders"
        FROM (
          SELECT "customerId", COUNT(*) AS cnt
          FROM orders
          WHERE "restaurantId" = ${id} AND "customerId" IS NOT NULL ${plainRange}
          GROUP BY "customerId"
        ) grouped
      `,
    ]);

    return {
      totalCustomers,
      newCustomers,
      topCustomers: topCustomers.map((row) => ({
        _id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        totalOrders: num(row.totalOrders),
        totalSpent: num(row.totalSpent),
        averageOrderValue: num(row.averageOrderValue),
      })),
      averageOrdersPerCustomer: num(frequency[0]?.averageOrdersPerCustomer),
      returningCustomers: num(frequency[0]?.totalCustomersWithOrders),
      period: { from, to },
    };
  }

  async getRealtimeMetrics(restaurantId) {
    const id = requireUuid(restaurantId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayStats, activeOrders, totalTables, occupiedTables, pendingReservations] =
      await Promise.all([
        prisma.$queryRaw`
          SELECT COALESCE(SUM(total), 0)::float8 AS "totalRevenue",
                 COUNT(*)::int AS "totalOrders",
                 COUNT(*) FILTER (WHERE status = 'paid')::int AS "paidOrders"
          FROM orders
          WHERE "restaurantId" = ${id}
            AND "createdAt" >= ${today}
            AND "createdAt" < ${tomorrow}
        `,
        prisma.order.count({
          where: { restaurantId: id, status: { notIn: ["paid", "cancelled"] } },
        }),
        prisma.table.count({ where: { restaurantId: id } }),
        prisma.table.count({ where: { restaurantId: id, status: "occupied" } }),
        prisma.reservation.count({
          where: {
            restaurantId: id,
            reservedAt: { gte: today, lt: tomorrow },
            status: "pending",
          },
        }),
      ]);

    const stats = todayStats[0] || { totalRevenue: 0, totalOrders: 0, paidOrders: 0 };
    return {
      today: {
        revenue: num(stats.totalRevenue),
        orders: num(stats.totalOrders),
        paidOrders: num(stats.paidOrders),
      },
      activeOrders,
      tables: {
        total: totalTables,
        occupied: occupiedTables,
        available: totalTables - occupiedTables,
        occupancyRate: totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0,
      },
      pendingReservations,
      timestamp: new Date(),
    };
  }

  async getInventoryAlerts(restaurantId) {
    const id = requireUuid(restaurantId);
    const [lowStockItems, valueRows, totalItems] = await Promise.all([
      prisma.$queryRaw`
        SELECT id, name, unit, stock, "minStockAlert", "costPrice"
        FROM inventory_items
        WHERE "restaurantId" = ${id} AND stock <= "minStockAlert"
        ORDER BY stock ASC
        LIMIT 20
      `,
      prisma.$queryRaw`
        SELECT COALESCE(SUM(stock * COALESCE("costPrice", 0)), 0)::float8 AS "totalValue"
        FROM inventory_items
        WHERE "restaurantId" = ${id}
      `,
      prisma.inventoryItem.count({ where: { restaurantId: id } }),
    ]);

    return {
      lowStockItems: toDocs(
        lowStockItems.map((row) => ({
          ...row,
          stock: num(row.stock),
          minStockAlert: num(row.minStockAlert),
          costPrice: num(row.costPrice),
        })),
      ),
      lowStockCount: lowStockItems.length,
      totalInventoryValue: num(valueRows[0]?.totalValue),
      totalItems,
    };
  }
}

export default new DashboardService();
