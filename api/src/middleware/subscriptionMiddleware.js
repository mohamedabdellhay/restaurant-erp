import prisma from "../db/client.js";
import { toDoc } from "../db/present.js";
import { refId, requireUuid } from "../db/ids.js";
import AppError from "../utils/errors/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const checkSubscription = asyncHandler(async (req, res, next) => {
  const restaurantId = requireUuid(refId(req.user?.restaurant));
  if (!restaurantId) {
    throw new AppError("User is not associated with a restaurant", 403);
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      restaurantId,
      status: "active",
      endDate: { gt: new Date() },
    },
    include: { plan: true },
  });

  if (!subscription) {
    throw new AppError("No active subscription found. Please upgrade.", 403);
  }

  req.subscription = toDoc(subscription);
  req.plan = toDoc(subscription.plan);
  next();
});

export const checkFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.plan) {
      return next(
        new AppError("Plan information missing. Ensure checkSubscription is used first.", 500),
      );
    }
    if (!req.plan.features.includes(featureName)) {
      return next(
        new AppError(
          `Your current plan (${req.plan.name}) does not support this feature: ${featureName}`,
          403,
        ),
      );
    }
    next();
  };
};

export const checkLimit = (limitName, modelName) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.plan) {
      return next(
        new AppError("Plan information missing. Ensure checkSubscription is used first.", 500),
      );
    }

    const limit = req.plan.limits[limitName];
    if (limit === undefined || limit === null) return next();

    const count = await prisma[modelName].count({
      where: { restaurantId: requireUuid(refId(req.user.restaurant)) },
    });

    if (count >= limit) {
      throw new AppError(
        `You have reached the limit for ${limitName} (${limit}) on your current plan.`,
        403,
      );
    }
    next();
  });
};
