import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { handleValidationErrors } from "../../middleware/validationMiddleware.js";
import { requireAdmin } from "./admin.middleware.js";
import AdminController from "./admin.controller.js";
import {
  planIdValidator,
  planValidator,
  updateRestaurantValidator,
  updateSettingsValidator,
  updateSubscriptionValidator,
} from "./admin.validator.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/overview", AdminController.overview);
router.get("/settings", AdminController.getSettings);
router.put(
  "/settings",
  updateSettingsValidator,
  handleValidationErrors,
  AdminController.updateSettings,
);
router.get("/restaurants", AdminController.restaurants);
router.put(
  "/restaurants/:id",
  updateRestaurantValidator,
  handleValidationErrors,
  AdminController.updateRestaurant,
);
router.get("/plans", AdminController.plans);
router.post("/plans", planValidator, handleValidationErrors, AdminController.createPlan);
router.put(
  "/plans/:id",
  planIdValidator,
  planValidator,
  handleValidationErrors,
  AdminController.updatePlan,
);
router.get("/subscriptions", AdminController.subscriptions);
router.put(
  "/subscriptions/:id",
  updateSubscriptionValidator,
  handleValidationErrors,
  AdminController.updateSubscription,
);

export default router;
