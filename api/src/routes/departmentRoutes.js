import express from "express";
import DepartmentController from "../controllers/DepartmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { hasPermission } from "../middleware/roleMiddleware.js";
import { PERMISSIONS } from "../utils/constants/permissions.js";

const router = express.Router();

router.use(protect);

// get all departments
router.get(
    "/",
    hasPermission(PERMISSIONS.VIEW_DEPARTMENTS),
    DepartmentController.index,
);

// get one department
router.get(
    "/:id",
    hasPermission(PERMISSIONS.VIEW_DEPARTMENTS),
    DepartmentController.show,
);

// create new department
router.post(
    "/",
    hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS),
    DepartmentController.create,
);

// update department
router.put(
    "/:id",
    hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS),
    DepartmentController.update,
);

// delete department
router.delete(
    "/:id",
    hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS),
    DepartmentController.delete,
);

export default router;
