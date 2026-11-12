import AppError from "../utils/errors/AppError.js";

export const requirePlatformOwner = (req, res, next) => {
  if (!req.user?.isPlatformOwner) {
    throw new AppError("Only the platform owner can access this area", 403);
  }
  next();
};
