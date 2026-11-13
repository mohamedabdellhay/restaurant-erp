import asyncHandler from "../../utils/asyncHandler.js";
import ResponseHandler from "../../utils/responseHandler.js";
import AdminService from "./admin.service.js";

class AdminController {
  overview = asyncHandler(async (req, res) => {
    const data = await AdminService.overview();
    ResponseHandler.success(res, data, "Admin overview retrieved successfully");
  });

  getSettings = asyncHandler(async (req, res) => {
    const settings = await AdminService.getSettings();
    ResponseHandler.success(res, settings, "Admin settings retrieved successfully");
  });

  updateSettings = asyncHandler(async (req, res) => {
    const settings = await AdminService.updateSettings(req.body);
    ResponseHandler.success(res, settings, "Admin settings updated successfully");
  });

  restaurants = asyncHandler(async (req, res) => {
    const rows = await AdminService.listRestaurants();
    ResponseHandler.success(res, rows, "Restaurants retrieved successfully");
  });

  updateRestaurant = asyncHandler(async (req, res) => {
    const restaurant = await AdminService.updateRestaurant(req.params.id, req.body);
    if (!restaurant) return ResponseHandler.error(res, "Restaurant not found", 404);
    ResponseHandler.success(res, restaurant, "Restaurant updated successfully");
  });

  plans = asyncHandler(async (req, res) => {
    const rows = await AdminService.listPlans();
    ResponseHandler.success(res, rows, "Plans retrieved successfully");
  });

  createPlan = asyncHandler(async (req, res) => {
    const plan = await AdminService.createPlan(req.body);
    ResponseHandler.created(res, plan, "Plan created successfully");
  });

  updatePlan = asyncHandler(async (req, res) => {
    const plan = await AdminService.updatePlan(req.params.id, req.body);
    if (!plan) return ResponseHandler.error(res, "Plan not found", 404);
    ResponseHandler.success(res, plan, "Plan updated successfully");
  });

  subscriptions = asyncHandler(async (req, res) => {
    const rows = await AdminService.listSubscriptions();
    ResponseHandler.success(res, rows, "Subscriptions retrieved successfully");
  });

  updateSubscription = asyncHandler(async (req, res) => {
    const subscription = await AdminService.updateSubscription(
      req.params.id,
      req.body.status,
    );
    if (!subscription) return ResponseHandler.error(res, "Subscription not found", 404);
    ResponseHandler.success(res, subscription, "Subscription updated successfully");
  });
}

export default new AdminController();
