import AppError from "../utils/errors/AppError.js";
import { getTranslation, translations } from "../utils/translations.js";

/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Not authorized to access this route", 401);
    }

    const userRoleName = typeof req.user.role === "string" ? req.user.role : req.user.role?.name;
    const lowerRoles = roles.map(r => r.toLowerCase());

    if (!lowerRoles.includes(userRoleName?.toLowerCase())) {
      throw new AppError(
        `User role '${userRoleName}' is not authorized to access this route`,
        403,
      );
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = (req, res, next) => {
  const userRoleName = typeof req.user.role === "string" ? req.user.role : req.user.role?.name;
  if (!req.user || userRoleName?.toLowerCase() !== "admin") {
    throw new AppError("Access denied. Admin only.", 403);
  }
  next();
};

/**
 * Check if user is manager or admin
 */
export const isManagerOrAdmin = (req, res, next) => {
  const userRoleName = typeof req.user.role === "string" ? req.user.role : req.user.role?.name;
  const lowerRole = userRoleName?.toLowerCase();
  if (!req.user || !["admin", "manager"].includes(lowerRole)) {
    throw new AppError("Access denied. Manager or Admin only.", 403);
  }
  next();
};
/**
 * Check if user has specific permission
 * @param {string} permission - The permission to check
 */
export const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Not authorized to access this route", 401);
    }

    // Since req.user.role is now an object populated from DB
    const permissions = req.user.role?.permissions || [];

    if (!permissions.includes(permission)) {
      const lang = req.headers["accept-language"] || "en";
      throw new AppError(
        getTranslation("You do not have permission to perform this action", lang),
        403,
      );
    }

    next();
  };
};
