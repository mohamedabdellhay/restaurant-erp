import DepartmentService from "./department.service.js";
import ResponseHandler from "../../utils/responseHandler.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/errors/AppError.js";

class DepartmentController {
    // Get all departments
    index = asyncHandler(async (req, res) => {
        const departments = await DepartmentService.getAllDepartments(
            req.user.restaurant,
        );
        ResponseHandler.success(
            res,
            departments,
            "Departments retrieved successfully",
        );
    });

    // Get department by ID
    show = asyncHandler(async (req, res) => {
        const department = await DepartmentService.getDepartmentById(
            req.params.id,
            req.user.restaurant,
        );
        if (!department) {
            throw new AppError("Department not found", 404);
        }
        ResponseHandler.success(
            res,
            department,
            "Department retrieved successfully",
        );
    });

    // Create new department
    create = asyncHandler(async (req, res) => {
        const data = { ...req.body, restaurant: req.user.restaurant };
        const department = await DepartmentService.createDepartment(data);
        ResponseHandler.created(res, department, "Department created successfully");
    });

    // Update department
    update = asyncHandler(async (req, res) => {
        try {
            const department = await DepartmentService.updateDepartment(
                req.params.id,
                req.user.restaurant,
                req.body,
            );
            if (!department) {
                throw new AppError("Department not found", 404);
            }
            ResponseHandler.success(
                res,
                department,
                "Department updated successfully",
            );
        } catch (error) {
            throw new AppError(error.message, 400);
        }
    });

    // Delete department
    delete = asyncHandler(async (req, res) => {
        try {
            const department = await DepartmentService.deleteDepartment(
                req.params.id,
                req.user.restaurant,
            );
            if (!department) {
                throw new AppError("Department not found", 404);
            }
            ResponseHandler.success(res, null, "Department deleted successfully");
        } catch (error) {
            throw new AppError(error.message, 400);
        }
    });
}

export default new DepartmentController();
