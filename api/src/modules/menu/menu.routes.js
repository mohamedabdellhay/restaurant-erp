import express from "express";
import MenuItemController from "./menu.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { hasPermission } from "../../middleware/roleMiddleware.js";
import { PERMISSIONS } from "../../utils/constants/permissions.js";
import {
  createMenuItemValidator,
  updateMenuItemValidator,
  commonIdValidator,
} from "./menu.validator.js";
import { handleValidationErrors } from "../../middleware/validationMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /menu:
 *   get:
 *     summary: Get all menu items
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter items by category ID
 *     responses:
 *       200:
 *         description: List of menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/MenuItem' }
 */
router.get("/", protect, hasPermission(PERMISSIONS.VIEW_MENU), MenuItemController.index);

/**
 * @swagger
 * /menu/{id}:
 *   get:
 *     summary: Get menu item by ID
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Menu item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/MenuItem' }
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/:id",
  protect,
  hasPermission(PERMISSIONS.VIEW_MENU),
  commonIdValidator,
  handleValidationErrors,
  MenuItemController.getMenuItemById,
);

/**
 * @swagger
 * /menu:
 *   post:
 *     summary: Create menu item
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MenuItem' }
 *     responses:
 *       201:
 *         description: Menu item created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/",
  protect,
  hasPermission(PERMISSIONS.MANAGE_MENU),
  createMenuItemValidator,
  handleValidationErrors,
  MenuItemController.create,
);

/**
 * @swagger
 * /menu/{id}:
 *   put:
 *     summary: Update menu item
 *     tags: [Menu]
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
 *           schema: { $ref: '#/components/schemas/MenuItem' }
 *     responses:
 *       200:
 *         description: Menu item updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  "/:id",
  protect,
  hasPermission(PERMISSIONS.MANAGE_MENU),
  updateMenuItemValidator,
  handleValidationErrors,
  MenuItemController.update,
);

/**
 * @swagger
 * /menu/{id}/recipe:
 *   get:
 *     summary: Get menu item recipe
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Menu item recipe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       inventoryItem: { type: object }
 *                       qty: { type: number }
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/:id/recipe",
  protect,
  hasPermission(PERMISSIONS.VIEW_MENU),
  commonIdValidator,
  handleValidationErrors,
  MenuItemController.getRecipe,
);

/**
 * @swagger
 * /menu/{id}/recipe:
 *   patch:
 *     summary: Update menu item recipe
 *     tags: [Menu]
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
 *             required: [recipe]
 *             properties:
 *               recipe:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventoryItem: { type: string }
 *                     qty: { type: number }
 *     responses:
 *       200:
 *         description: Recipe updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  "/:id/recipe",
  protect,
  hasPermission(PERMISSIONS.MANAGE_MENU),
  commonIdValidator,
  handleValidationErrors,
  MenuItemController.updateRecipe,
);

/**
 * @swagger
 * /menu/{id}:
 *   delete:
 *     summary: Delete menu item
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Menu item deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  "/:id",
  protect,
  hasPermission(PERMISSIONS.MANAGE_MENU),
  commonIdValidator,
  handleValidationErrors,
  MenuItemController.delete,
);

export default router;
