import express from "express";
import { body } from "express-validator";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { registerValidator, loginValidator, updateProfileValidator } from "../validators/auth.validator.js";

const router = express.Router();

router.post("/register", registerValidator, validateRequest, authController.register);
router.post("/login", loginValidator, validateRequest, authController.login);
router.post(
  "/google",
  body("idToken").trim().notEmpty().withMessage("Google ID Token is required"),
  validateRequest,
  authController.googleLogin
);

// Protected Routes
router.use(protect);
router.get("/me", authController.getMe);
router.put("/me", updateProfileValidator, validateRequest, authController.updateMe);

export default router;
