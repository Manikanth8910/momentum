import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import * as projectController from "../controllers/project.controller.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(projectController.getProjects)
  .post(projectController.createProject);

router.route("/:id")
  .put(projectController.updateProject)
  .delete(projectController.deleteProject);

export default router;
