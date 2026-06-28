import * as taskService from "../services/task.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { successResponse } from "../utils/apiResponse.js";

export const getTasks = catchAsync(async (req, res) => {
  const result = await taskService.queryTasks(req.user._id, req.query);
  return successResponse(res, 200, "Tasks retrieved successfully", result);
});

export const createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask(req.user._id, req.body);
  return successResponse(res, 201, "Task created successfully", task);
});

export const getTask = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(req.user._id, req.params.id);
  return successResponse(res, 200, "Task retrieved successfully", task);
});

export const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(req.user._id, req.params.id, req.body);
  return successResponse(res, 200, "Task updated successfully", task);
});

export const deleteTask = catchAsync(async (req, res) => {
  await taskService.softDeleteTask(req.user._id, req.params.id);
  return successResponse(res, 200, "Task deleted successfully");
});

export const updateStatus = catchAsync(async (req, res) => {
  const task = await taskService.updateTaskStatus(req.user._id, req.params.id, req.body.status);
  return successResponse(res, 200, "Task status updated successfully", task);
});

export const reorder = catchAsync(async (req, res) => {
  const result = await taskService.reorderTasks(req.user._id, req.body);
  return successResponse(res, 200, "Tasks reordered successfully", result);
});

export const getDashboard = catchAsync(async (req, res) => {
  const dashboard = await taskService.getDashboardMetrics(req.user._id);
  return successResponse(res, 200, "Dashboard metrics retrieved", dashboard);
});

export const getSearch = catchAsync(async (req, res) => {
  const q = req.query.q || "";
  const results = await taskService.globalSearch(req.user._id, q);
  return successResponse(res, 200, "Search results retrieved", results);
});

export const getActivity = catchAsync(async (req, res) => {
  const activity = await taskService.getActivityLogs(req.user._id);
  return successResponse(res, 200, "Recent activity logs retrieved", activity);
});
