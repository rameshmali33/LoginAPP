/**
 * Centralized Error Handling Middleware
 * Catches all errors from routes/controllers and returns consistent JSON responses
 */

const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;

  // Joi validation error
  if (err.isJoi) {
    statusCode = 400;
    message = "Validation Error";
    details = err.details.map((d) => ({
      field: d.context.key,
      message: d.message,
    }));
  }

  // JWT/Auth errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  // Not Found error
  if (err.statusCode === 404) {
    statusCode = 404;
    message = "Resource not found";
  }

  // Return consistent error response
  res.status(statusCode).json({
    success: false,
    message,
    details,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
