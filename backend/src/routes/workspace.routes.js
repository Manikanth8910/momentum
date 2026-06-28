import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import * as workspaceController from "../controllers/workspace.controller.js";

const router = express.Router();
router.use(protect);

router.get("/members", workspaceController.getMembers);
router.post("/invite", workspaceController.inviteMember);

export default router;
