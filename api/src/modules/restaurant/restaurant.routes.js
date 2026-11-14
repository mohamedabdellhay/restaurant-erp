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

/**
 * @swagger
 * components:
 *   schemas:
 *     RestaurantTheme:
 *       type: object
 *       properties:
 *         primaryColor:
 *           type: string
 *           example: "#0066cc"
 *         secondaryColor:
 *           type: string
 *           example: "#004499"
 *         accentColor:
 *           type: string
 *           example: "#00ccff"
 *         mode:
 *           type: string
 *           enum: [light, dark]
 *         logo:
 *           type: string
 *     RestaurantWrite:
 *       type: object
 *       required: [name, address, phone, email, vatNumber, crNumber]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         address:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *         phone:
 *           type: string
 *           description: 8 to 15 digits
 *         email:
 *           type: string
 *           format: email
 *         website:
 *           type: string
 *           format: uri
 *         logo:
 *           type: string
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, EGP, SAR, AED, JOD, LBP]
 *           description: Tax and commercial registration rules follow this currency
 *         vatNumber:
 *           type: string
 *         crNumber:
 *           type: string
 *         settings:
 *           type: object
 *           properties:
 *             taxPercent:
 *               type: number
 *               minimum: 0
 *             serviceChargePercent:
 *               type: number
 *               minimum: 0
 *             invoiceLanguage:
 *               type: string
 *               enum: [en, ar]
 *             invoice:
 *               type: object
 *               properties:
 *                 slogan:
 *                   type: string
 *                   maxLength: 80
 *                 policy:
 *                   type: string
 *                   maxLength: 500
 *                 note:
 *                   type: string
 *                   maxLength: 400
 *                 accentColor:
 *                   type: string
 *                   example: "#111111"
 *                 showLogo:
 *                   type: boolean
 *                 showVat:
 *                   type: boolean
 *                 showCr:
 *                   type: boolean
 *             theme:
 *               $ref: '#/components/schemas/RestaurantTheme'
 *         openingHours:
 *           type: object
 *         socialMedia:
 *           type: object
 */

/**
 * @swagger
 * /restaurant:
 *   get:
 *     summary: List restaurants
 *     description: Returns every restaurant. Requires the manage-settings permission.
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Create restaurant settings
 *     description: Creates a restaurant and seeds its default roles and departments. Name, address, and phone are required. Tax and commercial registration numbers are checked when they are sent.
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestaurantWrite'
 *     responses:
 *       201:
 *         description: Restaurant settings created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  "/",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  RestaurantController.index,
);
router.post(
  "/",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  createRestaurantValidator,
  handleValidationErrors,
  RestaurantController.create,
);

/**
 * @swagger
 * /restaurant/settings:
 *   get:
 *     summary: Get current restaurant settings
 *     description: Returns the latest restaurant, including absolute logo URLs. Any authenticated staff member can read it. The response data is an empty object when no restaurant exists.
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/settings", protect, RestaurantController.getCurrent);

/**
 * @swagger
 * /restaurant/{id}/theme:
 *   put:
 *     summary: Save restaurant theme
 *     description: Merges theme colors, mode, and logo into the restaurant settings. A staff member can only update their own restaurant.
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestaurantTheme'
 *     responses:
 *       200:
 *         description: Theme saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/RestaurantTheme'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  "/:id/theme",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  updateThemeValidator,
  handleValidationErrors,
  RestaurantController.updateTheme,
);

/**
 * @swagger
 * /restaurant/{id}:
 *   put:
 *     summary: Update restaurant settings
 *     description: Saves business identity, financial settings, hours, and social links. Name, address, phone, email, VAT, and commercial registration must be valid for the selected currency before the record is saved.
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestaurantWrite'
 *     responses:
 *       200:
 *         description: Restaurant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  "/:id",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  updateRestaurantValidator,
  handleValidationErrors,
  RestaurantController.update,
);

/**
 * @swagger
 * /restaurant/upload-logo:
 *   post:
 *     summary: Upload the business logo
 *     description: Accepts a jpeg, jpg, png, gif, or webp image up to 5 MB in the logo field. restaurantId can be omitted when the signed-in user belongs to a restaurant.
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [logo]
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *               restaurantId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     logo:
 *                       type: string
 *                     restaurant:
 *                       $ref: '#/components/schemas/Restaurant'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  "/upload-logo",
  protect,
  hasPermission(PERMISSIONS.MANAGE_SETTINGS),
  uploadLogo.single("logo"),
  RestaurantController.uploadLogo,
);

export default router;
