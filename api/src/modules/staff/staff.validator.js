import { body, param } from "express-validator";

export const createStaffValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isUUID()
    .withMessage("Invalid role ID"),

  body("restaurant")
    .optional()
    .isUUID()
    .withMessage("Invalid restaurant ID"),
  body("department")
    .optional()
    .isUUID()
    .withMessage("Invalid department ID"),
  body("phone")
    .optional()
    .trim(),
];

export const updateStaffValidator = [
  param("id").isUUID().withMessage("Invalid staff ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email").optional().trim().isEmail().withMessage("Invalid email format"),
  body("role")
    .optional()
    .isUUID()
    .withMessage("Invalid role ID"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  body("department")
    .optional()
    .isUUID()
    .withMessage("Invalid department ID"),
  body("phone")
    .optional()
    .trim(),
];

export const staffIdValidator = [
  param("id").isUUID().withMessage("Invalid staff ID"),
];
