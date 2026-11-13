import express from "express";
import RoleController from "./role.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { hasPermission } from "../../middleware/roleMiddleware.js";
import { PERMISSIONS } from "../../utils/constants/permissions.js";
const router = express.Router();

router.use(protect);

// get all roles
router.get("/", hasPermission(PERMISSIONS.VIEW_ROLES), RoleController.index);

// create new role
router.post("/", hasPermission(PERMISSIONS.MANAGE_ROLES), RoleController.create);

// update existed role
router.put("/:id", hasPermission(PERMISSIONS.MANAGE_ROLES), RoleController.update);

// delete role
router.delete("/:id", hasPermission(PERMISSIONS.MANAGE_ROLES), RoleController.delete);

// get all permissions
router.get(
    "/permissions",
    hasPermission(PERMISSIONS.VIEW_ROLES),
    RoleController.getAllPermissions,
);

export default router;
