import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { handleValidationErrors } from "../../middleware/validationMiddleware.js";
import { requireAdmin } from "./admin.middleware.js";
import AdminController from "./admin.controller.js";
import {
  planValidator,
  updatePlanValidator,
  updateRestaurantValidator,
  updateSettingsValidator,
  updateSubscriptionValidator,
} from "./admin.validator.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PlatformSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: default
 *         name:
 *           type: string
 *           example: Restaurant ERP
 *         supportEmail:
 *           type: string
 *           example: support@example.com
 *         supportPhone:
 *           type: string
 *           example: "+201234567890"
 *         defaultCurrency:
 *           type: string
 *           enum: [USD, EUR, GBP, EGP, SAR, AED, JOD, LBP]
 *           example: EGP
 *         allowRegistration:
 *           type: boolean
 *           example: true
 *         maintenanceMode:
 *           type: boolean
 *           example: false
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PlatformSettingsInput:
 *       type: object
 *       required: [name, defaultCurrency, allowRegistration, maintenanceMode]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 80
 *         supportEmail:
 *           type: string
 *           format: email
 *         supportPhone:
 *           type: string
 *           maxLength: 30
 *         defaultCurrency:
 *           type: string
 *           enum: [USD, EUR, GBP, EGP, SAR, AED, JOD, LBP]
 *         allowRegistration:
 *           type: boolean
 *         maintenanceMode:
 *           type: boolean
 *     AdminOverview:
 *       type: object
 *       properties:
 *         restaurants:
 *           type: integer
 *           example: 1
 *         activeSubscriptions:
 *           type: integer
 *           example: 1
 *         pendingSubscriptions:
 *           type: integer
 *           example: 0
 *         plans:
 *           type: integer
 *           example: 3
 *         staff:
 *           type: integer
 *           example: 4
 *         settings:
 *           $ref: '#/components/schemas/PlatformSettings'
 *     AdminRestaurant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, EGP, SAR, AED, JOD, LBP]
 *         vatNumber:
 *           type: string
 *         crNumber:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         staffCount:
 *           type: integer
 *         orderCount:
 *           type: integer
 *         planName:
 *           type: string
 *         subscriptionStatus:
 *           type: string
 *     AdminRestaurantInput:
 *       type: object
 *       required: [name, phone, address, currency]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, EGP, SAR, AED, JOD, LBP]
 *     Plan:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         price:
 *           type: number
 *           example: 1500
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, EGP, SAR, AED, JOD, LBP]
 *         description:
 *           type: string
 *           nullable: true
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *         limits:
 *           type: object
 *           properties:
 *             users:
 *               type: integer
 *               minimum: 1
 *             branches:
 *               type: integer
 *               minimum: 1
 *     PlanInput:
 *       type: object
 *       required: [name, price, currency, features, isActive, limits]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 60
 *         price:
 *           type: number
 *           minimum: 0
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, EGP, SAR, AED, JOD, LBP]
 *         description:
 *           type: string
 *           maxLength: 300
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *         limits:
 *           type: object
 *           required: [users, branches]
 *           properties:
 *             users:
 *               type: integer
 *               minimum: 1
 *             branches:
 *               type: integer
 *               minimum: 1
 *     PlanUpdate:
 *       type: object
 *       description: Every field is optional. Omitted fields are left unchanged.
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 60
 *         price:
 *           type: number
 *           minimum: 0
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, EGP, SAR, AED, JOD, LBP]
 *         description:
 *           type: string
 *           maxLength: 300
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *         limits:
 *           type: object
 *           properties:
 *             users:
 *               type: integer
 *               minimum: 1
 *             branches:
 *               type: integer
 *               minimum: 1
 *     AdminSubscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [pending, active, cancelled, expired]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         autoRenew:
 *           type: boolean
 *         restaurantId:
 *           type: string
 *           format: uuid
 *         restaurantName:
 *           type: string
 *         planId:
 *           type: string
 *           format: uuid
 *         planName:
 *           type: string
 *         price:
 *           type: number
 *         currency:
 *           type: string
 *     SubscriptionStatusInput:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, active, cancelled, expired]
 */

router.use(protect, requireAdmin);

/**
 * @swagger
 * /admin/overview:
 *   get:
 *     summary: Get platform overview
 *     description: Counts for restaurants, subscriptions, plans, and staff, plus the current platform settings. Platform owner only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin overview retrieved successfully
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
 *                   $ref: '#/components/schemas/AdminOverview'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/overview", AdminController.overview);

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Get platform settings
 *     description: Read the SaaS platform name, support contacts, default currency, registration flag, and maintenance mode. Platform owner only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin settings retrieved successfully
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
 *                   $ref: '#/components/schemas/PlatformSettings'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   put:
 *     summary: Update platform settings
 *     description: Save platform identity and registration controls. Platform owner only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlatformSettingsInput'
 *     responses:
 *       200:
 *         description: Admin settings updated successfully
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
 *                   $ref: '#/components/schemas/PlatformSettings'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/settings", AdminController.getSettings);
router.put(
  "/settings",
  updateSettingsValidator,
  handleValidationErrors,
  AdminController.updateSettings,
);

/**
 * @swagger
 * /admin/restaurants:
 *   get:
 *     summary: List restaurants
 *     description: Restaurants with staff and order counts and the latest subscription. Payment secrets are not included. Platform owner only.
 *     tags: [Admin]
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
 *                     $ref: '#/components/schemas/AdminRestaurant'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/restaurants", AdminController.restaurants);

/**
 * @swagger
 * /admin/restaurants/{id}:
 *   put:
 *     summary: Update a restaurant
 *     description: Update the restaurant identity fields the platform owner is allowed to edit. Tax numbers and payment secrets stay unchanged. Platform owner only.
 *     tags: [Admin]
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
 *             $ref: '#/components/schemas/AdminRestaurantInput'
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
 *                   $ref: '#/components/schemas/AdminRestaurant'
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
  "/restaurants/:id",
  updateRestaurantValidator,
  handleValidationErrors,
  AdminController.updateRestaurant,
);

/**
 * @swagger
 * /admin/plans:
 *   get:
 *     summary: List subscription plans
 *     description: All plans, including inactive ones. Platform owner only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plans retrieved successfully
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
 *                     $ref: '#/components/schemas/Plan'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Create a subscription plan
 *     description: Add a plan with price, currency, features, and user and branch limits. Platform owner only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanInput'
 *     responses:
 *       201:
 *         description: Plan created successfully
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
 *                   $ref: '#/components/schemas/Plan'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/plans", AdminController.plans);
router.post("/plans", planValidator, handleValidationErrors, AdminController.createPlan);

/**
 * @swagger
 * /admin/plans/{id}:
 *   put:
 *     summary: Update a subscription plan
 *     description: Updates only the plan fields that are sent. Omitted fields stay as they are, including a single user or branch limit. Platform owner only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanUpdate'
 *     responses:
 *       200:
 *         description: Plan updated successfully
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
 *                   $ref: '#/components/schemas/Plan'
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
  "/plans/:id",
  updatePlanValidator,
  handleValidationErrors,
  AdminController.updatePlan,
);

/**
 * @swagger
 * /admin/subscriptions:
 *   get:
 *     summary: List subscriptions
 *     description: Subscriptions with restaurant and plan names. Platform owner only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
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
 *                     $ref: '#/components/schemas/AdminSubscription'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/subscriptions", AdminController.subscriptions);

/**
 * @swagger
 * /admin/subscriptions/{id}:
 *   put:
 *     summary: Update a subscription status
 *     description: Set a subscription to pending, active, cancelled, or expired. Platform owner only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionStatusInput'
 *     responses:
 *       200:
 *         description: Subscription updated successfully
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
 *                   $ref: '#/components/schemas/AdminSubscription'
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
  "/subscriptions/:id",
  updateSubscriptionValidator,
  handleValidationErrors,
  AdminController.updateSubscription,
);

export default router;
