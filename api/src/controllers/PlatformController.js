import asyncHandler from "../utils/asyncHandler.js";
import ResponseHandler from "../utils/responseHandler.js";
import PlatformService from "../services/PlatformService.js";

class PlatformController {
  overview = asyncHandler(async (req, res) => {
    const data = await PlatformService.overview();
    ResponseHandler.success(res, data, "Platform overview retrieved successfully");
  });

  getSettings = asyncHandler(async (req, res) => {
    const settings = await PlatformService.getSettings();
    ResponseHandler.success(res, settings, "Platform settings retrieved successfully");
  });

  updateSettings = asyncHandler(async (req, res) => {
    const settings = await PlatformService.updateSettings(req.body);
    ResponseHandler.success(res, settings, "Platform settings updated successfully");
  });

  restaurants = asyncHandler(async (req, res) => {
    const rows = await PlatformService.listRestaurants();
    ResponseHandler.success(res, rows, "Restaurants retrieved successfully");
  });

  updateRestaurant = asyncHandler(async (req, res) => {
    const restaurant = await PlatformService.updateRestaurant(req.params.id, req.body);
    if (!restaurant) return ResponseHandler.error(res, "Restaurant not found", 404);
    ResponseHandler.success(res, restaurant, "Restaurant updated successfully");
  });

  plans = asyncHandler(async (req, res) => {
    const rows = await PlatformService.listPlans();
    ResponseHandler.success(res, rows, "Plans retrieved successfully");
  });

  createPlan = asyncHandler(async (req, res) => {
    const plan = await PlatformService.createPlan(req.body);
    ResponseHandler.created(res, plan, "Plan created successfully");
  });

  updatePlan = asyncHandler(async (req, res) => {
    const plan = await PlatformService.updatePlan(req.params.id, req.body);
    if (!plan) return ResponseHandler.error(res, "Plan not found", 404);
    ResponseHandler.success(res, plan, "Plan updated successfully");
  });

  subscriptions = asyncHandler(async (req, res) => {
    const rows = await PlatformService.listSubscriptions();
    ResponseHandler.success(res, rows, "Subscriptions retrieved successfully");
  });

  updateSubscription = asyncHandler(async (req, res) => {
    const subscription = await PlatformService.updateSubscription(
      req.params.id,
      req.body.status,
    );
    if (!subscription) return ResponseHandler.error(res, "Subscription not found", 404);
    ResponseHandler.success(res, subscription, "Subscription updated successfully");
  });
}

export default new PlatformController();
