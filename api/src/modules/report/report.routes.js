import express from "express";
import ReportController from "./report.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { hasPermission } from "../../middleware/roleMiddleware.js";
import { PERMISSIONS } from "../../utils/constants/permissions.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Analytics and reporting operations
 */

// All report routes require authentication and VIEW_REPORTS permission
router.use(protect);
router.use(hasPermission(PERMISSIONS.VIEW_REPORTS));

// ─── Sales ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /reports/sales:
 *   get:
 *     summary: Sales performance report
 *     description: Returns total revenue, average order value, tax, service charges, order count, a daily revenue trend, and revenue split by payment method. Scoped to paid orders only.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: "Start date (inclusive) in YYYY-MM-DD format"
 *         example: "2025-01-01"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: "End date (inclusive) in YYYY-MM-DD format"
 *         example: "2025-12-31"
 *     responses:
 *       200:
 *         description: Sales performance summary
 */
router.get("/sales", ReportController.getSales);

// ─── Inventory ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /reports/inventory:
 *   get:
 *     summary: Inventory summary report
 *     description: Returns total item count, total stock value, low-stock item count, and the full list of low-stock items with supplier details.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory summary with low-stock alerts
 */
router.get("/inventory", ReportController.getInventory);

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /reports/orders:
 *   get:
 *     summary: Order analytics report
 *     description: Returns order status distribution, type distribution (dineIn/takeaway/delivery), hourly trends, daily revenue trends, and the top 5 most-ordered items.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: "Start date (inclusive) in YYYY-MM-DD format"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: "End date (inclusive) in YYYY-MM-DD format"
 *     responses:
 *       200:
 *         description: Order analytics and trends
 */
router.get("/orders", ReportController.getOrders);

// ─── Reservations ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /reports/reservations:
 *   get:
 *     summary: Reservations analytics report
 *     description: Returns reservation count, total guests, upcoming reservation count, status distribution, and busiest days of the week.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: "Start date (inclusive) in YYYY-MM-DD format"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: "End date (inclusive) in YYYY-MM-DD format"
 *     responses:
 *       200:
 *         description: Reservations report
 */
router.get("/reservations", ReportController.getReservations);

// ─── Staff Performance ────────────────────────────────────────────────────────

/**
 * @swagger
 * /reports/staff-performance:
 *   get:
 *     summary: Staff performance report
 *     description: Returns per-staff metrics including the number of paid orders handled, total revenue generated, and average order value. Ordered by total revenue descending.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: "Start date (inclusive) in YYYY-MM-DD format"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: "End date (inclusive) in YYYY-MM-DD format"
 *     responses:
 *       200:
 *         description: Array of staff performance objects
 */
router.get("/staff-performance", ReportController.getStaffPerformance);

// ─── Revenue Breakdown ────────────────────────────────────────────────────────

/**
 * @swagger
 * /reports/revenue:
 *   get:
 *     summary: Revenue breakdown by time period
 *     description: Returns a time-series of revenue figures grouped by day, week, or month, along with a payment-method split and overall totals. Scoped to paid orders.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: "Start date (inclusive) in YYYY-MM-DD format"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: "End date (inclusive) in YYYY-MM-DD format"
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Time grouping for the trend data
 *     responses:
 *       200:
 *         description: Revenue trend with totals and payment-method split
 */
router.get("/revenue", ReportController.getRevenueBreakdown);

// ─── Top Selling Items ────────────────────────────────────────────────────────

/**
 * @swagger
 * /reports/top-items:
 *   get:
 *     summary: Top-selling menu items
 *     description: Returns top menu items sorted by quantity sold, including total revenue per item. Scoped to paid orders.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: "Start date (inclusive) in YYYY-MM-DD format"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: "End date (inclusive) in YYYY-MM-DD format"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of items to return
 *     responses:
 *       200:
 *         description: Array of top-selling menu items
 */
router.get("/top-items", ReportController.getTopItems);

export default router;
