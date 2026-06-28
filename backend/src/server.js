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

// Environment Variable Verification (Phase 2)
const requiredEnvVars = [
  "NODE_ENV", "PORT", "MONGODB_URI", "JWT_SECRET", 
  "JWT_EXPIRES_IN", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", 
  "FRONTEND_URL", "CORS_ORIGIN"
];

const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  logger.error(`❌ FATAL ERROR: Missing required environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

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
