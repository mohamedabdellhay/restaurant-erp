import prisma from "../db/client.js";
import { toDoc } from "../db/present.js";
import { requireUuid } from "../db/ids.js";
import AppError from "../utils/errors/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import tokenHelper from "../utils/tokenHelper.js";

async function loadStaff(id) {
  const staffId = requireUuid(id);
  if (!staffId) return null;
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { role: true },
  });
  if (!staff) return null;
  const doc = toDoc(staff);
  doc.restaurant = staff.restaurantId;
  return doc;
}

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) throw new AppError("Not authorized to access this route", 401);

  const decoded = tokenHelper.verifyAccessToken(token);
  const staff = await loadStaff(decoded.id);
  if (!staff) throw new AppError("Not authorized to access this route", 401);
  if (!staff.isActive) throw new AppError("Your account has been deactivated", 401);

  req.user = staff;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = tokenHelper.verifyAccessToken(token);
      const staff = await loadStaff(decoded.id);
      if (staff && staff.isActive) req.user = staff;
    } catch {
      // Continue without a user.
    }
  }

  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    const userRoleName = typeof req.user.role === "string" ? req.user.role : req.user.role?.name;
    if (!roles.includes(userRoleName?.toLowerCase()) && !roles.includes(userRoleName)) {
      throw new AppError("You do not have permission to perform this action", 403);
    }
    next();
  };
};
