import express from "express";
import PermissionController from "./permission.controller.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /permissions/metadata:
 *   get:
 *     summary: Get permission metadata
 *     description: Retrieve grouped permission keys and labels for frontend UI organization.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permission metadata retrieved successfully
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
 *                   example: "Permission metadata retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       module:
 *                         type: string
 *                         example: "Staff Management"
 *                       description:
 *                         type: string
 *                         example: "Control staff access and roles"
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             key:
 *                               type: string
 *                               example: "view_staff"
 *                             label:
 *                               type: string
 *                               example: "View Staff"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/metadata", protect, PermissionController.getPermissionMetadata);

export default router;
