import RoleService from "./role.service.js";
import ResponseHandler from "../../utils/responseHandler.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ALL_PERMISSIONS } from "../../utils/constants/permissions.js";
import AppError from "../../utils/errors/AppError.js";

class RoleController {
  // Get all roles for the current restaurant
  index = asyncHandler(async (req, res) => {
    const roles = await RoleService.getAllRoles(req.user.restaurant);
    ResponseHandler.success(res, roles, "Roles retrieved successfully");
  });

  // Get role by ID
  getById = asyncHandler(async (req, res) => {
    const role = await RoleService.getRoleById(req.params.id, req.user.restaurant);
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    ResponseHandler.success(res, role, "Role retrieved successfully");
  });

  // Create new role
  create = asyncHandler(async (req, res) => {
    const data = { ...req.body, restaurant: req.user.restaurant };
    const newRole = await RoleService.createRole(data);
    ResponseHandler.created(res, newRole, "Role created successfully");
  });

  // Update existing role
  update = asyncHandler(async (req, res) => {
    const updatedRole = await RoleService.updateRole(
      req.params.id,
      req.user.restaurant,
      req.body,
    );
    if (!updatedRole) {
      throw new AppError("Role not found", 404);
    }
    ResponseHandler.success(res, updatedRole, "Role updated successfully");
  });

  // Delete role
  delete = asyncHandler(async (req, res) => {
    try {
      const deletedRole = await RoleService.deleteRole(
        req.params.id,
        req.user.restaurant,
      );
      if (!deletedRole) {
        throw new AppError("Role not found", 404);
      }
      ResponseHandler.success(res, null, "Role deleted successfully");
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  });

  // Get all available system permissions
  getAllPermissions = asyncHandler(async (req, res) => {
    ResponseHandler.success(
      res,
      ALL_PERMISSIONS,
      "Permissions retrieved successfully",
    );
  });
}

export default new RoleController();
