import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import * as noteController from "../controllers/note.controller.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(noteController.getNotes)
  .post(noteController.createNote);

router.route("/:id")
  .put(noteController.updateNote)
  .delete(noteController.deleteNote);

export default router;
