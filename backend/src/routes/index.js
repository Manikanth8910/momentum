import express from "express";
import mongoose from "mongoose";
import authRoutes from "./auth.routes.js";
import taskRoutes from "./task.routes.js";
import * as taskController from "../controllers/task.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  const isHealthy = dbStatus === 1;

  const healthInfo = {
    status: isHealthy ? "UP" : "DOWN",
    timestamp: new Date(),
    uptime: process.uptime(),
    database: statusMap[dbStatus] || "Unknown",
  };

  if (isHealthy) {
    return successResponse(res, 200, "Service is healthy", healthInfo);
  } else {
    return errorResponse(res, 503, "Service is unhealthy", [healthInfo]);
  }
});

// Version endpoint
router.get("/version", (req, res) => {
  return successResponse(res, 200, "Version retrieved", {
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Mounting modules
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/tasks", taskRoutes);

// Global endpoints
router.get("/api/v1/dashboard", protect, taskController.getDashboard);
router.get("/api/v1/activity", protect, taskController.getActivity);
router.get("/api/v1/search", protect, taskController.getSearch);

export default router;
