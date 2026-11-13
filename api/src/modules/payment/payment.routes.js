import express from "express";
import PaymentController from "./payment.controller.js";
import PaymentSettingController from "./paymentSetting.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { hasPermission } from "../../middleware/roleMiddleware.js";
import { PERMISSIONS } from "../../utils/constants/permissions.js";
import { uploadGatewayLogo } from "../../middleware/uploadMiddleware.js";

const router = express.Router();

/**
 * Handle frontend redirects from Payment Gateways
 */
router.get("/callback/:provider", PaymentController.handleCallback);

/**
 * Handle server-to-server webhook events
 */
router.post("/webhook/:provider", PaymentController.handleCallback);

/**
 * Get all supported gateway names
 */
router.get("/gateways", protect, PaymentSettingController.getAvailableGateways);

/**
 * Manage Payment Gateway Settings
 */
router.get(
  "/settings/kashier",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  PaymentSettingController.getKashierSettings,
);

router.post(
  "/settings/kashier",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  PaymentSettingController.updateKashierSettings,
);

router.post(
  "/settings/:provider/logo",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  uploadGatewayLogo.single("logo"),
  PaymentSettingController.uploadGatewayLogo,
);

export default router;
