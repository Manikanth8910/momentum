import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { logger } from "./config/logger.js";

// Handle uncaught exceptions before loading anything else
process.on("uncaughtException", (err) => {
  logger.error("❌ UNCAUGHT EXCEPTION! Shutting down...");
  logger.error(`${err.name}: ${err.message}`);
  if (err.stack) logger.debug(err.stack);
  process.exit(1);
});

// Load environment variables with override enabled
dotenv.config({ override: true });

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5050;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("❌ UNHANDLED REJECTION! Shutting down gracefully...");
  logger.error(`${err.name}: ${err.message}`);
  if (err.stack) logger.debug(err.stack);
  
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on("SIGTERM", () => {
  logger.info("👋 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("💥 Process terminated!");
  });
});
