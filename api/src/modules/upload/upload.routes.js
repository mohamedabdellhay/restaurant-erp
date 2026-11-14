import express from "express";
import UploadController from "./upload.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { uploadAd, uploadImage } from "../../middleware/uploadMiddleware.js";
import { hasPermission } from "../../middleware/roleMiddleware.js";
import { PERMISSIONS } from "../../utils/constants/permissions.js";

const router = express.Router();

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload an image
 *     tags: [Utility]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post("/", protect, uploadImage.single("image"), UploadController.upload);
router.post(
  "/ad",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  uploadAd.single("file"),
  UploadController.uploadAd,
);

export default router;
