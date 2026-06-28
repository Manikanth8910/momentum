import express from "express";
import mongoose from "mongoose";
import authRoutes from "./auth.routes.js";
import taskRoutes from "./task.routes.js";
import projectRoutes from "./project.routes.js";
import noteRoutes from "./note.routes.js";
import workspaceRoutes from "./workspace.routes.js";
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
    status: isHealthy ? "ok" : "error",
    database: isHealthy ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development",
    uptime: Math.floor(process.uptime()),
  };

  if (isHealthy) {
    return res.status(200).json(healthInfo);
  } else {
    return res.status(503).json(healthInfo);
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
router.use("/api/v1/projects", projectRoutes);
router.use("/api/v1/notes", noteRoutes);
router.use("/api/v1/workspace", workspaceRoutes);

// Global endpoints
router.get("/api/v1/dashboard", protect, taskController.getDashboard);
router.get("/api/v1/recent-actions", protect, taskController.getActivity);
router.get("/api/v1/search", protect, taskController.getSearch);

export default router;
