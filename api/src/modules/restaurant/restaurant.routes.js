import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { hasPermission } from "../../middleware/roleMiddleware.js";
import { handleValidationErrors } from "../../middleware/validationMiddleware.js";
import { uploadLogo } from "../../middleware/uploadMiddleware.js";
import { PERMISSIONS } from "../../utils/constants/permissions.js";
import RestaurantController from "./restaurant.controller.js";
import {
  createRestaurantValidator,
  updateRestaurantValidator,
  updateThemeValidator,
} from "./restaurant.validator.js";

const router = express.Router();

router.get(
  "/",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  RestaurantController.index,
);
router.get("/settings", protect, RestaurantController.getCurrent);
router.post(
  "/",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  createRestaurantValidator,
  handleValidationErrors,
  RestaurantController.create,
);
router.put(
  "/:id/theme",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  updateThemeValidator,
  handleValidationErrors,
  RestaurantController.updateTheme,
);
router.put(
  "/:id",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  updateRestaurantValidator,
  handleValidationErrors,
  RestaurantController.update,
);
router.post(
  "/upload-logo",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  uploadLogo.single("logo"),
  RestaurantController.uploadLogo,
);

export default router;
