import express from "express";
import "dotenv/config";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/errorHandlerMiddleware.js";
import logger from "./utils/logger.js";
import { getTranslation } from "./utils/translations.js";
import AppRouter from "./routes/index.js";
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to DB
connectDB();

// Request logging middleware
app.use((req, res, next) => {
  res.on("finish", () => {
    const isStateChanging = ["POST", "PUT", "DELETE", "PATCH"].includes(
      req.method,
    );
    const userId = isStateChanging ? req.user?._id || req.user?.id : null;

    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode}`, userId);
  });
  next();
});

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
const configuredOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(configuredOrigins);
for (const origin of configuredOrigins) {
  if (origin.includes("://localhost")) {
    allowedOrigins.add(origin.replace("://localhost", "://127.0.0.1"));
  } else if (origin.includes("://127.0.0.1")) {
    allowedOrigins.add(origin.replace("://127.0.0.1", "://localhost"));
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.has("*") ||
        allowedOrigins.has(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000000, // limit each IP to 100 requests per windowMs
  handler: (req, res) => {
    const lang = req.headers["accept-language"]?.startsWith("ar") ? "ar" : "en";
    const message = getTranslation(
      "Too many requests from this IP, please try again later.",
      lang,
    );
    res.status(429).json({
      status: "error",
      message,
    });
  },
});

app.use("/api", limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory with CORS
app.use("/uploads", cors(), express.static("uploads"));

app.use("/api", AppRouter);


app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: `ERP System Running on port ${PORT}`,
  });
});

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export { app, PORT };
