import { Prisma } from "@prisma/client";
import AppError from "../utils/errors/AppError.js";
import logger from "../utils/logger.js";

const handleJWTError = () => new AppError("Invalid token. Please log in again", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please log in again", 401);

const normalizeError = (err) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.join(", ")
        : "field";
      return new AppError(`Duplicate value for ${target}. Please use another value`, 409);
    }
    if (err.code === "P2003") {
      return new AppError("Related record was not found or is still in use", 400);
    }
    if (err.code === "P2025") {
      return new AppError("Record not found", 404);
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return new AppError("Invalid data", 400);
  }

  if (err?.name === "JsonWebTokenError") return handleJWTError();
  if (err?.name === "TokenExpiredError") return handleJWTExpiredError();
  if (err?.type === "entity.parse.failed") {
    return new AppError("Invalid JSON body", 400);
  }

  return err;
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const error = normalizeError(err);
  const statusCode = error.statusCode || 500;
  const isOperational = Boolean(error.isOperational);
  const message = isOperational && error.message
    ? error.message
    : "Something went wrong";

  if (!isOperational) {
    logger.error(error.message || "Unhandled error", error, req.user?._id || req.user?.id);
  }

  const body = {
    success: false,
    message,
    statusCode,
  };

  if (process.env.NODE_ENV === "development" && !isOperational && error.stack) {
    body.stack = error.stack;
  }

  res.status(statusCode).json(body);
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
};

export { errorHandler, notFoundHandler };
