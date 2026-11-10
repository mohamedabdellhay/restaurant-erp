import express from "express";
import categoryController from "../controllers/CategoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { hasPermission } from "../middleware/roleMiddleware.js";
import { PERMISSIONS } from "../utils/constants/permissions.js";
import {
  createCategoryValidator,
  updateCategoryValidator,
  commonIdValidator,
} from "../validators/menuValidator.js";
import { handleValidationErrors } from "../middleware/validationMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve all categories scoped to the authenticated restaurant.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Categories retrieved successfully" }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Category' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", protect, hasPermission(PERMISSIONS.VIEW_CATEGORIES), categoryController.index);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Retrieve details of a specific category by ID.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Category' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/:id",
  protect,
  hasPermission(PERMISSIONS.VIEW_CATEGORIES),
  commonIdValidator,
  handleValidationErrors,
  categoryController.getCategoryById,
);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create category
 *     description: Add a new menu category. Scoped to the authenticated restaurant.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Main Courses" }
 *               description: { type: string, example: "Delicious main dishes" }
 *               image: { type: string, example: "https://example.com/images/main.jpg" }
 *               isActive: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Category' }
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
  hasPermission(PERMISSIONS.MANAGE_CATEGORIES),
  createCategoryValidator,
  handleValidationErrors,
  categoryController.create,
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category
 *     description: Update an existing category by ID.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               image: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Category' }
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
  hasPermission(PERMISSIONS.MANAGE_CATEGORIES),
  updateCategoryValidator,
  handleValidationErrors,
  categoryController.update,
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category
 *     description: Permanently remove a category.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deleted successfully
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
  hasPermission(PERMISSIONS.MANAGE_CATEGORIES),
  commonIdValidator,
  handleValidationErrors,
  categoryController.delete,
);

export default router;
