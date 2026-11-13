import express from "express";
import CustomerController from "./customer.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { hasPermission } from "../../middleware/roleMiddleware.js";
import { PERMISSIONS } from "../../utils/constants/permissions.js";
import {
  createCustomerValidator,
  updateCustomerValidator,
  customerIdValidator,
  customerSearchValidator,
} from "./customer.validator.js";
import { handleValidationErrors } from "../../middleware/validationMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management API
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get("/", hasPermission(PERMISSIONS.VIEW_CUSTOMERS), CustomerController.index);

/**
 * @swagger
 * /customers/search:
 *   get:
 *     summary: Search customers by name or phone
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (name or phone)
 *     responses:
 *       200:
 *         description: Search results
 */
router.get(
  "/search",
  hasPermission(PERMISSIONS.VIEW_CUSTOMERS),
  customerSearchValidator,
  handleValidationErrors,
  CustomerController.search,
);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 */
router.get(
  "/:id",
  hasPermission(PERMISSIONS.VIEW_CUSTOMERS),
  customerIdValidator,
  handleValidationErrors,
  CustomerController.getCustomerById,
);

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Add new customer (scoped to your restaurant)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name: { type: string, example: "John Doe" }
 *               phone: { type: string, example: "1234567890" }
 *               email: { type: string, example: "john@example.com" }
 *               address: { type: string, example: "123 Street, City" }
 *     responses:
 *       201:
 *         description: Customer created
 */
router.post(
  "/",
  hasPermission(PERMISSIONS.MANAGE_CUSTOMERS),
  createCustomerValidator,
  handleValidationErrors,
  CustomerController.create,
);

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               address: { type: string }
 *     responses:
 *       200:
 *         description: Customer updated
 */
router.put(
  "/:id",
  hasPermission(PERMISSIONS.MANAGE_CUSTOMERS),
  updateCustomerValidator,
  handleValidationErrors,
  CustomerController.update,
);

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer deleted
 */
router.delete(
  "/:id",
  hasPermission(PERMISSIONS.MANAGE_CUSTOMERS),
  customerIdValidator,
  handleValidationErrors,
  CustomerController.delete,
);

export default router;
