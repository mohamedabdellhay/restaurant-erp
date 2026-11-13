import { body } from "express-validator";
import prisma from "../../db/client.js";
import { isUuid } from "../../db/ids.js";

export const registerSubscriptionValidator = [
  // Restaurant Details
  body("restaurantName")
    .trim()
    .notEmpty()
    .withMessage("Restaurant name is required"),
  body("restaurantAddress")
    .notEmpty()
    .withMessage("Restaurant address is required"),
  body("restaurantPhone")
    .notEmpty()
    .withMessage("Restaurant phone is required"),

  // Admin User Details
  body("adminName").trim().notEmpty().withMessage("Admin name is required"),
  body("adminEmail").isEmail().withMessage("Valid admin email is required"),
  body("adminPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  // Plan Details
  body("planId")
    .notEmpty()
    .withMessage("Plan ID is required")
    .custom(async (value) => {
      if (!isUuid(value)) throw new Error("Invalid Plan ID");
      const plan = await prisma.plan.findUnique({ where: { id: value } });
      if (!plan) {
        throw new Error("Invalid Plan ID");
      }
      return true;
    }),
];
