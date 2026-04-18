import { NODE_ENV } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
  // Only log stack traces in development
  if (NODE_ENV !== "production") {
    console.error(err);
  } else {
    // In production, log only a safe summary (no stack trace, no sensitive data)
    console.error(`[${new Date().toISOString()}] ${err.statusCode || 500} ${req.method} ${req.path}: ${err.message}`);
  }

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error",
    errors: NODE_ENV === "production" ? [] : (err.errors || []),
  });
};
