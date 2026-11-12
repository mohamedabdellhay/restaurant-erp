import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requirePlatformOwner } from "../middleware/platformMiddleware.js";
import { handleValidationErrors } from "../middleware/validationMiddleware.js";
import PlatformController from "../controllers/PlatformController.js";
import {
  planIdValidator,
  planValidator,
  updateRestaurantValidator,
  updateSettingsValidator,
  updateSubscriptionValidator,
} from "../validators/platformValidator.js";

const router = express.Router();

router.use(protect, requirePlatformOwner);

router.get("/overview", PlatformController.overview);
router.get("/settings", PlatformController.getSettings);
router.put(
  "/settings",
  updateSettingsValidator,
  handleValidationErrors,
  PlatformController.updateSettings,
);
router.get("/restaurants", PlatformController.restaurants);
router.put(
  "/restaurants/:id",
  updateRestaurantValidator,
  handleValidationErrors,
  PlatformController.updateRestaurant,
);
router.get("/plans", PlatformController.plans);
router.post("/plans", planValidator, handleValidationErrors, PlatformController.createPlan);
router.put(
  "/plans/:id",
  planIdValidator,
  planValidator,
  handleValidationErrors,
  PlatformController.updatePlan,
);
router.get("/subscriptions", PlatformController.subscriptions);
router.put(
  "/subscriptions/:id",
  updateSubscriptionValidator,
  handleValidationErrors,
  PlatformController.updateSubscription,
);

export default router;
