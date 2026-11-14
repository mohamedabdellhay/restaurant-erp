import { body, param } from "express-validator";
import { BUSINESS_MESSAGES, validateBusiness } from "./businessValidation.js";

const rejectInvalidBusiness = (requireIdentity) =>
  body().custom((_, { req }) => {
    const result = validateBusiness(req.body, { requireIdentity });
    if (!result.valid) {
      throw new Error(
        result.issues.map((issue) => BUSINESS_MESSAGES[issue.code]).join(". "),
      );
    }
    return true;
  });

export const createRestaurantValidator = [
  body("name")
    .notEmpty()
    .withMessage("Restaurant name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("address").notEmpty().withMessage("Address is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("website").optional().isURL().withMessage("Invalid website URL"),
  body("currency").optional().isString().withMessage("Currency must be a string"),
  body("settings.taxPercent")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax percent must be a positive number"),
  body("settings.serviceChargePercent")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Service charge percent must be a positive number"),
  body("settings.theme.primaryColor")
    .optional()
    .isHexColor()
    .withMessage("Primary color must be a valid hex color"),
  body("settings.theme.secondaryColor")
    .optional()
    .isHexColor()
    .withMessage("Secondary color must be a valid hex color"),
  body("settings.theme.accentColor")
    .optional()
    .isHexColor()
    .withMessage("Accent color must be a valid hex color"),
  body("settings.theme.mode")
    .optional()
    .isIn(["light", "dark"])
    .withMessage("Mode must be either 'light' or 'dark'"),
  rejectInvalidBusiness(false),
];

export const updateRestaurantValidator = [
  param("id").isUUID().withMessage("Invalid restaurant ID"),
  body("website").optional({ values: "falsy" }).isURL().withMessage("Invalid website URL"),
  body("settings.taxPercent")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax percent must be a positive number"),
  body("settings.serviceChargePercent")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Service charge percent must be a positive number"),
  body("settings.theme.primaryColor")
    .optional()
    .isHexColor()
    .withMessage("Primary color must be a valid hex color"),
  body("settings.theme.secondaryColor")
    .optional()
    .isHexColor()
    .withMessage("Secondary color must be a valid hex color"),
  body("settings.theme.accentColor")
    .optional()
    .isHexColor()
    .withMessage("Accent color must be a valid hex color"),
  body("settings.theme.mode")
    .optional()
    .isIn(["light", "dark"])
    .withMessage("Mode must be either 'light' or 'dark'"),
  body("settings.invoiceLanguage")
    .optional()
    .isIn(["en", "ar"])
    .withMessage("Invoice language must be English or Arabic"),
  body("settings.invoice.slogan")
    .optional({ values: "null" })
    .isString()
    .isLength({ max: 80 })
    .withMessage("Invoice slogan must be 80 characters or fewer"),
  body("settings.invoice.policy")
    .optional({ values: "null" })
    .isString()
    .isLength({ max: 500 })
    .withMessage("Invoice policy must be 500 characters or fewer"),
  body("settings.invoice.note")
    .optional({ values: "null" })
    .isString()
    .isLength({ max: 400 })
    .withMessage("Invoice information must be 400 characters or fewer"),
  body("settings.invoice.accentColor")
    .optional({ values: "falsy" })
    .isHexColor()
    .withMessage("Invoice color must be a valid hex color"),
  body("settings.invoice.showLogo").optional().isBoolean().withMessage("Show logo must be true or false"),
  body("settings.invoice.showVat").optional().isBoolean().withMessage("Show VAT must be true or false"),
  body("settings.invoice.showCr")
    .optional()
    .isBoolean()
    .withMessage("Show commercial registration must be true or false"),
  rejectInvalidBusiness(true),
];

export const updateThemeValidator = [
  param("id").isUUID().withMessage("Invalid restaurant ID"),
  body("primaryColor").optional().isHexColor().withMessage("Primary color must be a valid hex color"),
  body("secondaryColor")
    .optional()
    .isHexColor()
    .withMessage("Secondary color must be a valid hex color"),
  body("accentColor").optional().isHexColor().withMessage("Accent color must be a valid hex color"),
  body("mode")
    .optional()
    .isIn(["light", "dark"])
    .withMessage("Mode must be either 'light' or 'dark'"),
];

export const restaurantIdValidator = [
  param("id").isUUID().withMessage("Invalid restaurant ID"),
];
