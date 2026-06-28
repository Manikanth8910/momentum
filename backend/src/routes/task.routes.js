import express from "express";
import * as taskController from "../controllers/task.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  createTaskValidator,
  updateTaskValidator,
  taskIdValidator,
} from "../validators/task.validator.js";

const router = express.Router();

// All task routes are protected
router.use(protect);

// Kanban reordering
router.patch("/reorder", taskController.reorder);

// Standard CRUD
router.route("/")
  .get(taskController.getTasks)
  .post(createTaskValidator, validateRequest, taskController.createTask);

router.route("/:id")
  .get(taskIdValidator, validateRequest, taskController.getTask)
  .put(updateTaskValidator, validateRequest, taskController.updateTask)
  .delete(taskIdValidator, validateRequest, taskController.deleteTask);

// Inline PATCH status update
router.patch("/:id/status", taskIdValidator, validateRequest, taskController.updateStatus);

export default router;
