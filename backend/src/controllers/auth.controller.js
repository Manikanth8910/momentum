import * as authService from "../services/auth.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { successResponse } from "../utils/apiResponse.js";

export const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.registerUser({ name, email, password });

  return successResponse(res, 201, "User registered successfully", result);
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });

  return successResponse(res, 200, "User logged in successfully", result);
});

export const googleLogin = catchAsync(async (req, res) => {
  const { idToken } = req.body;
  const result = await authService.loginWithGoogle(idToken);

  return successResponse(res, 200, "Google login successful", result);
});

export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getUserMe(req.user._id);
  return successResponse(res, 200, "User profile retrieved", user);
});

export const updateMe = catchAsync(async (req, res) => {
  const user = await authService.updateUserMe(req.user._id, req.body);
  return successResponse(res, 200, "Profile updated successfully", user);
});
