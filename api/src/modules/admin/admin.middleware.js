import AppError from "../../utils/errors/AppError.js";

export const requireAdmin = (req, res, next) => {
  if (!req.user?.isPlatformOwner) {
    throw new AppError("Only the platform owner can access the admin API", 403);
  }
  next();
};
