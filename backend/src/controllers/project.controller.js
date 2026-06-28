import Project from "../models/Project.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    return successResponse(res, 200, "Projects retrieved", projects);
  } catch (error) {
    return errorResponse(res, 500, "Server error", [error.message]);
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, description, priority } = req.body;
    const project = await Project.create({
      name,
      description,
      priority,
      createdBy: req.user._id
    });
    return successResponse(res, 201, "Project created", project);
  } catch (error) {
    return errorResponse(res, 500, "Server error", [error.message]);
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!project) return errorResponse(res, 404, "Project not found");
    return successResponse(res, 200, "Project updated", project);
  } catch (error) {
    return errorResponse(res, 500, "Server error", [error.message]);
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return errorResponse(res, 404, "Project not found");
    return successResponse(res, 200, "Project deleted");
  } catch (error) {
    return errorResponse(res, 500, "Server error", [error.message]);
  }
};
