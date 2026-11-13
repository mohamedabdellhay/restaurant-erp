import ReportService from "./report.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ResponseHandler from "../../utils/responseHandler.js";

/**
 * ReportController
 * Handles HTTP layer for all reporting endpoints.
 * Delegates all data access to ReportService.
 */
class ReportController {
  /**
   * GET /reports/sales
   * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
   */
  getSales = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const data = await ReportService.getSalesPerformance(req.user.restaurant, from, to);
    ResponseHandler.success(res, data, "Sales report retrieved successfully");
  });

  /**
   * GET /reports/inventory
   */
  getInventory = asyncHandler(async (req, res) => {
    const data = await ReportService.getInventorySummary(req.user.restaurant);
    ResponseHandler.success(res, data, "Inventory report retrieved successfully");
  });

  /**
   * GET /reports/orders
   * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
   */
  getOrders = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const data = await ReportService.getOrderAnalytics(req.user.restaurant, from, to);
    ResponseHandler.success(res, data, "Order analytics retrieved successfully");
  });

  /**
   * GET /reports/reservations
   * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
   */
  getReservations = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const data = await ReportService.getReservationsReport(req.user.restaurant, from, to);
    ResponseHandler.success(res, data, "Reservations report retrieved successfully");
  });

  /**
   * GET /reports/staff-performance
   * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
   */
  getStaffPerformance = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const data = await ReportService.getStaffPerformanceReport(req.user.restaurant, from, to);
    ResponseHandler.success(res, data, "Staff performance report retrieved successfully");
  });

  /**
   * GET /reports/revenue
   * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD), groupBy (day|week|month)
   */
  getRevenueBreakdown = asyncHandler(async (req, res) => {
    const { from, to, groupBy } = req.query;
    const data = await ReportService.getRevenueBreakdown(req.user.restaurant, from, to, groupBy);
    ResponseHandler.success(res, data, "Revenue breakdown retrieved successfully");
  });

  /**
   * GET /reports/top-items
   * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD), limit (number)
   */
  getTopItems = asyncHandler(async (req, res) => {
    const { from, to, limit } = req.query;
    const data = await ReportService.getTopSellingItems(req.user.restaurant, from, to, limit);
    ResponseHandler.success(res, data, "Top selling items retrieved successfully");
  });
}

export default new ReportController();
