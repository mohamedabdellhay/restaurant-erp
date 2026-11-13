import prisma from "../../db/client.js";
import { toDoc } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";
import { hashPassword } from "../../db/password.js";
import tokenHelper from "../../utils/tokenHelper.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ResponseHandler from "../../utils/responseHandler.js";
import AppError from "../../utils/errors/AppError.js";
import PaymentFactory from "../payment/payment.factory.js";
import RoleService from "../role/role.service.js";
import DepartmentService from "../department/department.service.js";

class SubscriptionController {
  getPlans = asyncHandler(async (req, res) => {
    const plans = await prisma.plan.findMany({ where: { isActive: true } });
    ResponseHandler.success(res, plans.map((plan) => toDoc(plan)), "Plans retrieved successfully");
  });

  register = asyncHandler(async (req, res) => {
    const settings = await prisma.platformSetting.findUnique({ where: { id: "default" } });
    if (settings?.allowRegistration === false) {
      throw new AppError("New restaurant registration is closed", 403);
    }

    const {
      restaurantName,
      restaurantAddress,
      restaurantPhone,
      restaurantEmail,
      adminName,
      adminEmail,
      adminPassword,
      planId,
    } = req.body;

    const existingStaff = await prisma.staff.findUnique({ where: { email: adminEmail } });
    if (existingStaff) throw new AppError("Email already registered", 409);

    const plan = await prisma.plan.findUnique({ where: { id: requireUuid(planId) || "" } });
    if (!plan) throw new AppError("Invalid Plan selected", 400);

    const result = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          address: restaurantAddress,
          phone: restaurantPhone,
          email: restaurantEmail || adminEmail,
        },
      });

      await RoleService.seedDefaultRoles(restaurant.id, tx);
      await DepartmentService.seedDefaultDepartments(restaurant.id, tx);
      const adminRole = await tx.role.findFirst({
        where: { restaurantId: restaurant.id, name: "Admin" },
      });

      const staff = await tx.staff.create({
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash: await hashPassword(adminPassword),
          roleId: adminRole.id,
          restaurantId: restaurant.id,
        },
      });

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const subscription = await tx.subscription.create({
        data: {
          restaurantId: restaurant.id,
          planId: plan.id,
          startDate,
          endDate,
          status: "pending",
        },
      });

      const transactionId = "TRX_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      await tx.transaction.create({
        data: {
          transactionId,
          provider: "kashier",
          amount: plan.price,
          currency: "EGP",
          referenceType: "Subscription",
          referenceId: subscription.id,
          restaurantId: restaurant.id,
        },
      });

      return { restaurant, staff, subscription, transactionId };
    });

    const { accessToken, refreshToken } = tokenHelper.generateTokenPair({
      id: result.staff.id,
      role: result.staff.roleId,
    });

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const kashierProvider = PaymentFactory.getProvider("kashier");
    const checkoutUrl = await kashierProvider.getCheckoutUrl(
      result.transactionId,
      plan.price,
      "EGP",
      {
        name: adminName,
        email: adminEmail,
        reference: `REG_${result.restaurant.id}_${Date.now()}`,
      },
      `${req.protocol}://${req.get("host")}/api/payments/callback/kashier`,
      { restaurantId: result.restaurant.id },
    );

    ResponseHandler.created(
      res,
      {
        restaurant: toDoc(result.restaurant),
        subscription: toDoc(result.subscription),
        staff: toDoc(result.staff),
        accessToken,
        refreshToken,
        checkoutUrl,
      },
      "Registration successful. Please complete payment via the provided URL.",
    );
  });

  confirmPayment = asyncHandler(async (req, res) => {
    const { subscriptionId, transactionId } = req.body;
    const id = requireUuid(subscriptionId);
    const subscription = id ? await prisma.subscription.findUnique({ where: { id } }) : null;
    if (!subscription) throw new AppError("Subscription not found", 404);

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: "active",
        paymentDetails: {
          transactionId: transactionId || "MOCK_TRX_" + Date.now(),
          amount: 0,
          currency: "EGP",
          paymentMethod: "Manual",
          paidAt: new Date(),
        },
      },
    });
    ResponseHandler.success(res, toDoc(updated), "Payment confirmed");
  });
}

export default new SubscriptionController();
