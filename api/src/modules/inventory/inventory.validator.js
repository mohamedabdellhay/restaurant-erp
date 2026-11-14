import { body, param } from "express-validator";

export const validateInventoryItem = [
  body("name").notEmpty().withMessage("Item name is required"),
  body("sku").notEmpty().withMessage("SKU is required"),
  body("unit").notEmpty().withMessage("Unit (e.g., kg, pieces) is required"),
  body("costPrice")
    .isNumeric()
    .withMessage("Cost price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Cost price cannot be negative"),
  body("supplier").isUUID().withMessage("Valid supplier ID is required"),
  body("minStockAlert")
    .optional()
    .isNumeric()
    .withMessage("Min stock alert must be a number"),
  body("ingredientCategoryId")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("Invalid category ID"),
];

export const validateIngredientCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
];

export const validateIngredientCategoryId = [
  param("id").isUUID().withMessage("Invalid category ID"),
];

export const validateSupplier = [
  body("name").notEmpty().withMessage("Supplier name is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("email").optional().isEmail().withMessage("Invalid email address"),
  body("paymentTerms")
    .optional()
    .isIn(["cash", "credit", "installment"])
    .withMessage("Invalid payment terms"),
];

export const validateStockUpdate = [
  body("amount")
    .isNumeric()
    .withMessage("Amount must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),
  body("type")
    .isIn(["addition", "deduction"])
    .withMessage("Type must be either addition or deduction"),
];
