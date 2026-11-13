import { Prisma } from "@prisma/client";
import prisma from "../../db/client.js";
import { requireUuid } from "../../db/ids.js";

function num(value) {
  return value == null ? 0 : Number(value);
}

function parseRangeDate(value, end = false) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    // Local calendar bounds. The Date(y, m, d, h, min, s, ms) form is local time.
    return end
      ? new Date(year, month - 1, day, 23, 59, 59, 999)
      : new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  return new Date(value);
}

function dateClause(column, from, to) {
  const expr = column.includes(".") ? column : `"${column}"`;
  const parts = [];
  if (from) parts.push(Prisma.sql`${Prisma.raw(expr)} >= ${parseRangeDate(from, false)}`);
  if (to) parts.push(Prisma.sql`${Prisma.raw(expr)} <= ${parseRangeDate(to, true)}`);
  if (!parts.length) return Prisma.empty;
  return Prisma.sql`AND ${Prisma.join(parts, " AND ")}`;
}

function periodFormat(groupBy) {
  if (groupBy === "month") return "YYYY-MM";
  if (groupBy === "week") return "IYYY-IW";
  return "YYYY-MM-DD";
}

class ReportService {
  async getSalesPerformance(restaurantId, from, to) {
    const id = requireUuid(restaurantId);
    const range = dateClause("createdAt", from, to);
    const [summary, dailyTrend, byPaymentMethod] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          COALESCE(SUM(total), 0)::float8 AS "totalRevenue",
          COALESCE(AVG(total), 0)::float8 AS "averageOrderValue",
          COALESCE(SUM(tax), 0)::float8 AS "totalTax",
          COALESCE(SUM("serviceCharge"), 0)::float8 AS "totalServiceCharge",
          COUNT(*)::int AS count
        FROM orders
        WHERE "restaurantId" = ${id} AND status = 'paid' ${range}
      `,
      prisma.$queryRaw`
        SELECT to_char("createdAt", 'YYYY-MM-DD') AS date,
               COALESCE(SUM(total), 0)::float8 AS revenue,
               COUNT(*)::int AS orders
        FROM orders
        WHERE "restaurantId" = ${id} AND status = 'paid' ${range}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw`
        SELECT "paymentMethod",
               COALESCE(SUM(total), 0)::float8 AS revenue,
               COUNT(*)::int AS count
        FROM orders
        WHERE "restaurantId" = ${id} AND status = 'paid' ${range}
        GROUP BY 1
      `,
    ]);

    const totals = summary[0] || {
      totalRevenue: 0,
      averageOrderValue: 0,
      totalTax: 0,
      totalServiceCharge: 0,
      count: 0,
    };
    return {
      totalRevenue: num(totals.totalRevenue),
      averageOrderValue: num(totals.averageOrderValue),
      totalTax: num(totals.totalTax),
      totalServiceCharge: num(totals.totalServiceCharge),
      count: num(totals.count),
      dailyTrend: dailyTrend.map((row) => ({
        date: row.date,
        revenue: num(row.revenue),
        orders: num(row.orders),
      })),
      byPaymentMethod: byPaymentMethod.map((row) => ({
        paymentMethod: row.paymentMethod,
        revenue: num(row.revenue),
        count: num(row.count),
      })),
    };
  }

  async getInventorySummary(restaurantId) {
    const id = requireUuid(restaurantId);
    const [summary] = await prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS "totalItems",
        COALESCE(SUM(stock * COALESCE("costPrice", 0)), 0)::float8 AS "totalStockValue",
        COUNT(*) FILTER (WHERE stock <= "minStockAlert")::int AS "lowStockCount"
      FROM inventory_items
      WHERE "restaurantId" = ${id}
    `;
    const lowStock = await prisma.$queryRaw`
      SELECT id, name, sku, unit, stock, "minStockAlert", "costPrice", "supplierId"
      FROM inventory_items
      WHERE "restaurantId" = ${id} AND stock <= "minStockAlert"
    `;
    const supplierIds = [...new Set(lowStock.map((row) => row.supplierId).filter(Boolean))];
    const suppliers = supplierIds.length
      ? await prisma.supplier.findMany({
          where: { id: { in: supplierIds } },
          select: { id: true, name: true, contactPerson: true, phone: true, email: true },
        })
      : [];
    const byId = new Map(suppliers.map((supplier) => [supplier.id, supplier]));

    return {
      totalItems: num(summary?.totalItems),
      totalStockValue: num(summary?.totalStockValue),
      lowStockCount: num(summary?.lowStockCount),
      lowStockItems: lowStock.map((row) => ({
        _id: row.id,
        id: row.id,
        name: row.name,
        sku: row.sku,
        unit: row.unit,
        stock: num(row.stock),
        minStockAlert: num(row.minStockAlert),
        costPrice: num(row.costPrice),
        supplier: byId.get(row.supplierId) || row.supplierId,
      })),
    };
  }

  async getOrderAnalytics(restaurantId, from, to) {
    const id = requireUuid(restaurantId);
    const range = dateClause("createdAt", from, to);
    const [statusDistribution, typeDistribution, hourlyTrends, dailyTrends, topItems] =
      await Promise.all([
        prisma.$queryRaw`
          SELECT status, COUNT(*)::int AS count
          FROM orders
          WHERE "restaurantId" = ${id} ${range}
          GROUP BY status
        `,
        prisma.$queryRaw`
          SELECT type, COUNT(*)::int AS count
          FROM orders
          WHERE "restaurantId" = ${id} ${range}
          GROUP BY type
        `,
        prisma.$queryRaw`
          SELECT EXTRACT(HOUR FROM "createdAt")::int AS hour, COUNT(*)::int AS count
          FROM orders
          WHERE "restaurantId" = ${id} ${range}
          GROUP BY 1
          ORDER BY 1
        `,
        prisma.$queryRaw`
          SELECT to_char("createdAt", 'YYYY-MM-DD') AS date,
                 COUNT(*)::int AS count,
                 COALESCE(SUM(total), 0)::float8 AS revenue
          FROM orders
          WHERE "restaurantId" = ${id} ${range}
          GROUP BY 1
          ORDER BY 1
        `,
        prisma.$queryRaw`
          SELECT oi."menuItemId" AS "menuItemId",
                 mi.name,
                 SUM(oi.qty)::int AS "totalQty",
                 SUM(oi.qty * oi.price)::float8 AS revenue
          FROM order_items oi
          JOIN orders o ON o.id = oi."orderId"
          LEFT JOIN menu_items mi ON mi.id = oi."menuItemId"
          WHERE o."restaurantId" = ${id} ${dateClause('o."createdAt"', from, to)}
          GROUP BY oi."menuItemId", mi.name
          ORDER BY "totalQty" DESC
          LIMIT 5
        `,
      ]);

    return {
      statusDistribution: statusDistribution.map((row) => ({ status: row.status, count: num(row.count) })),
      typeDistribution: typeDistribution.map((row) => ({ type: row.type, count: num(row.count) })),
      hourlyTrends: hourlyTrends.map((row) => ({ hour: num(row.hour), count: num(row.count) })),
      dailyTrends: dailyTrends.map((row) => ({
        date: row.date,
        count: num(row.count),
        revenue: num(row.revenue),
      })),
      topItems: topItems.map((row) => ({
        menuItemId: row.menuItemId,
        name: row.name,
        totalQty: num(row.totalQty),
        revenue: num(row.revenue),
      })),
    };
  }

  async getReservationsReport(restaurantId, from, to) {
    const id = requireUuid(restaurantId);
    const range = dateClause("reservedAt", from, to);
    const [statusDistribution, busiestDays, summary, upcomingCount] = await Promise.all([
      prisma.$queryRaw`
        SELECT status,
               COUNT(*)::int AS count,
               COALESCE(SUM("numberOfGuests"), 0)::int AS "totalGuests"
        FROM reservations
        WHERE "restaurantId" = ${id} ${range}
        GROUP BY status
      `,
      prisma.$queryRaw`
        SELECT (EXTRACT(DOW FROM "reservedAt")::int + 1) AS "dayOfWeek",
               COUNT(*)::int AS count
        FROM reservations
        WHERE "restaurantId" = ${id} ${range}
        GROUP BY 1
        ORDER BY count DESC
      `,
      prisma.$queryRaw`
        SELECT COALESCE(SUM("numberOfGuests"), 0)::int AS "totalGuests",
               COUNT(*)::int AS "totalReservations"
        FROM reservations
        WHERE "restaurantId" = ${id} ${range}
      `,
      prisma.reservation.count({
        where: {
          restaurantId: id,
          reservedAt: { gte: new Date() },
          status: { in: ["pending", "confirmed"] },
        },
      }),
    ]);

    return {
      totalReservations: num(summary[0]?.totalReservations),
      totalGuests: num(summary[0]?.totalGuests),
      upcomingCount,
      statusDistribution: statusDistribution.map((row) => ({
        status: row.status,
        count: num(row.count),
        totalGuests: num(row.totalGuests),
      })),
      busiestDays: busiestDays.map((row) => ({
        dayOfWeek: num(row.dayOfWeek),
        count: num(row.count),
      })),
    };
  }

  async getStaffPerformanceReport(restaurantId, from, to) {
    const id = requireUuid(restaurantId);
    const range = dateClause('o."createdAt"', from, to);
    const rows = await prisma.$queryRaw`
      SELECT o."createdById" AS "staffId",
             s.name AS "staffName",
             s.email AS "staffEmail",
             COUNT(*)::int AS "ordersHandled",
             COALESCE(SUM(o.total), 0)::float8 AS "totalRevenue",
             COALESCE(AVG(o.total), 0)::float8 AS "avgOrderValue"
      FROM orders o
      LEFT JOIN staff s ON s.id = o."createdById"
      WHERE o."restaurantId" = ${id} AND o.status = 'paid' ${range}
      GROUP BY o."createdById", s.name, s.email
      ORDER BY "totalRevenue" DESC
    `;
    return rows.map((row) => ({
      staffId: row.staffId,
      staffName: row.staffName,
      staffEmail: row.staffEmail,
      ordersHandled: num(row.ordersHandled),
      totalRevenue: num(row.totalRevenue),
      avgOrderValue: num(row.avgOrderValue),
    }));
  }

  async getRevenueBreakdown(restaurantId, from, to, groupBy = "day") {
    const id = requireUuid(restaurantId);
    const range = dateClause("createdAt", from, to);
    const format = periodFormat(groupBy);
    const [trend, byPaymentMethod, totals] = await Promise.all([
      prisma.$queryRaw`
        SELECT to_char("createdAt", ${format}) AS period,
               COALESCE(SUM(total), 0)::float8 AS revenue,
               COUNT(*)::int AS orders
        FROM orders
        WHERE "restaurantId" = ${id} AND status = 'paid' ${range}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw`
        SELECT "paymentMethod",
               COALESCE(SUM(total), 0)::float8 AS revenue,
               COUNT(*)::int AS count
        FROM orders
        WHERE "restaurantId" = ${id} AND status = 'paid' ${range}
        GROUP BY 1
      `,
      prisma.$queryRaw`
        SELECT COALESCE(SUM(total), 0)::float8 AS "totalRevenue",
               COUNT(*)::int AS "totalOrders"
        FROM orders
        WHERE "restaurantId" = ${id} AND status = 'paid' ${range}
      `,
    ]);

    return {
      groupBy,
      totalRevenue: num(totals[0]?.totalRevenue),
      totalOrders: num(totals[0]?.totalOrders),
      trend: trend.map((row) => ({
        period: row.period,
        revenue: num(row.revenue),
        orders: num(row.orders),
      })),
      byPaymentMethod: byPaymentMethod.map((row) => ({
        paymentMethod: row.paymentMethod,
        revenue: num(row.revenue),
        count: num(row.count),
      })),
    };
  }

  async getTopSellingItems(restaurantId, from, to, limit = 10) {
    const id = requireUuid(restaurantId);
    const range = dateClause('o."createdAt"', from, to);
    const take = Number(limit) || 10;
    const rows = await prisma.$queryRaw`
      SELECT oi."menuItemId" AS "menuItemId",
             mi.name,
             mi."categoryId" AS category,
             SUM(oi.qty)::int AS "totalQty",
             SUM(oi.qty * oi.price)::float8 AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      LEFT JOIN menu_items mi ON mi.id = oi."menuItemId"
      WHERE o."restaurantId" = ${id} AND o.status = 'paid' ${range}
      GROUP BY oi."menuItemId", mi.name, mi."categoryId"
      ORDER BY "totalQty" DESC
      LIMIT ${take}
    `;
    return rows.map((row) => ({
      menuItemId: row.menuItemId,
      name: row.name,
      category: row.category,
      totalQty: num(row.totalQty),
      revenue: num(row.revenue),
    }));
  }
}

export default new ReportService();
