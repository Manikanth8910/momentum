import { logger } from "../config/logger.js";
import { errorResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log error using winston
  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (err.stack) {
    logger.debug(err.stack);
  }

  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // Production Error Handling
  let error = { ...err };
  error.message = err.message;

  // Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400);
  }

  // Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    error = new AppError(message, 409);
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data: ${errors.join(". ")}`;
    error = new AppError(message, 400);
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please log in again!", 401);
  }
  if (err.name === "TokenExpiredError") {
    error = new AppError("Your token has expired. Please log in again!", 401);
  }

  // Operational, trusted error: send message to client
  if (error.isOperational) {
    return errorResponse(res, error.statusCode, error.message, error.errors || []);
  }

  // Programming or other unknown error: don't leak error details
  return errorResponse(res, 500, "Something went wrong on our end. Please try again later.");
};
