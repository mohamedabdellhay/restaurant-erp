import { body, param } from "express-validator";

const currencies = ["USD", "EUR", "GBP", "EGP", "SAR", "AED", "JOD", "LBP"];

export const updateSettingsValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Platform name is required")
    .isLength({ min: 2, max: 80 })
    .withMessage("Platform name must be between 2 and 80 characters"),
  body("supportEmail")
    .optional({ values: "falsy" })
    .isEmail()
    .withMessage("Support email must be a valid email"),
  body("supportPhone")
    .optional({ values: "falsy" })
    .isLength({ max: 30 })
    .withMessage("Support phone is too long"),
  body("defaultCurrency")
    .isIn(currencies)
    .withMessage("Choose a supported currency"),
  body("allowRegistration").isBoolean().withMessage("Registration setting must be true or false"),
  body("maintenanceMode").isBoolean().withMessage("Maintenance setting must be true or false"),
];

export const updateRestaurantValidator = [
  param("id").isUUID().withMessage("Invalid restaurant ID"),
  body("name")
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage("Restaurant name must be between 2 and 100 characters"),
  body("email")
    .optional({ values: "falsy" })
    .isEmail()
    .withMessage("Restaurant email must be a valid email"),
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("address").trim().isLength({ min: 5, max: 200 }).withMessage("Address is required"),
  body("currency").isIn(currencies).withMessage("Choose a supported currency"),
];

export const planValidator = [
  body("name").trim().notEmpty().isLength({ min: 2, max: 60 }).withMessage("Plan name is required"),
  body("price").isFloat({ min: 0 }).withMessage("Plan price must be zero or more"),
  body("currency").isIn(currencies).withMessage("Choose a supported currency"),
  body("description").optional({ values: "falsy" }).isLength({ max: 300 }),
  body("features").isArray().withMessage("Features must be a list"),
  body("isActive").isBoolean().withMessage("Active setting must be true or false"),
  body("limits.users").isInt({ min: 1 }).withMessage("User limit must be at least 1"),
  body("limits.branches").isInt({ min: 1 }).withMessage("Branch limit must be at least 1"),
];

export const planIdValidator = [param("id").isUUID().withMessage("Invalid plan ID")];

export const updatePlanValidator = [
  ...planIdValidator,
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 60 })
    .withMessage("Plan name is required"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Plan price must be zero or more"),
  body("currency").optional().isIn(currencies).withMessage("Choose a supported currency"),
  body("description").optional({ values: "falsy" }).isLength({ max: 300 }),
  body("features").optional().isArray().withMessage("Features must be a list"),
  body("isActive").optional().isBoolean().withMessage("Active setting must be true or false"),
  body("limits.users").optional().isInt({ min: 1 }).withMessage("User limit must be at least 1"),
  body("limits.branches")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Branch limit must be at least 1"),
];

export const updateSubscriptionValidator = [
  param("id").isUUID().withMessage("Invalid subscription ID"),
  body("status")
    .isIn(["pending", "active", "cancelled", "expired"])
    .withMessage("Status must be pending, active, cancelled, or expired"),
];
