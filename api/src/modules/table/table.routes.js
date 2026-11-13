import express from "express";
import TableController from "./table.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { hasPermission } from "../../middleware/roleMiddleware.js";
import { PERMISSIONS } from "../../utils/constants/permissions.js";
import {
  createTableValidator,
  updateTableValidator,
  tableIdValidator,
} from "./table.validator.js";
import { handleValidationErrors } from "../../middleware/validationMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Get all tables
 *     description: Retrieve a list of all tables in the restaurant. Accessible by all authenticated staff.
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tables retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Table'
 */
router.get("/", protect, hasPermission(PERMISSIONS.VIEW_TABLES), TableController.index);

/**
 * @swagger
 * /tables/{id}:
 *   get:
 *     summary: Get table by ID
 *     description: Retrieve detailed information about a specific table.
 *     tags: [Tables]
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
 *         description: Table retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Table'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/:id",
  protect,
  hasPermission(PERMISSIONS.VIEW_TABLES),
  tableIdValidator,
  handleValidationErrors,
  TableController.getTableById,
);

/**
 * @swagger
 * /tables:
 *   post:
 *     summary: Create new table
 *     description: Add a new table to the restaurant. Only accessible by Admins.
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - seats
 *             properties:
 *               number:
 *                 type: string
 *                 example: "T10"
 *               seats:
 *                 type: number
 *                 example: 6
 *               status:
 *                 type: string
 *                 enum: ["available", "occupied", "reserved", "inactive"]
 *                 default: "available"
 *     responses:
 *       201:
 *         description: Table created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  "/",
  protect,
  hasPermission(PERMISSIONS.MANAGE_TABLES),
  createTableValidator,
  handleValidationErrors,
  TableController.create,
);

/**
 * @swagger
 * /tables/{id}:
 *   patch:
 *     summary: Update table
 *     description: Update table details or status. Only accessible by Admins and Managers.
 *     tags: [Tables]
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
 *               number:
 *                 type: string
 *               seats:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: ["available", "occupied", "reserved", "inactive"]
 *     responses:
 *       200:
 *         description: Table updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  "/:id",
  protect,
  hasPermission(PERMISSIONS.MANAGE_TABLES),
  updateTableValidator,
  handleValidationErrors,
  TableController.update,
);

/**
 * @swagger
 * /tables/{id}:
 *   delete:
 *     summary: Delete table
 *     description: Permanently remove a table. Only accessible by Admins.
 *     tags: [Tables]
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
 *         description: Table deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  "/:id",
  protect,
  hasPermission(PERMISSIONS.MANAGE_TABLES),
  tableIdValidator,
  handleValidationErrors,
  TableController.delete,
);

export default router;
