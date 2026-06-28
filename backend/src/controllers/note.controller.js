import Note from "../models/Note.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    return successResponse(res, 200, "Notes retrieved", notes);
  } catch (error) {
    return errorResponse(res, 500, "Server error", [error.message]);
  }
};

export const createNote = async (req, res) => {
  try {
    const { title, content, tag, color } = req.body;
    const note = await Note.create({
      title,
      content,
      tag,
      color,
      createdBy: req.user._id
    });
    return successResponse(res, 201, "Note created", note);
  } catch (error) {
    return errorResponse(res, 500, "Server error", [error.message]);
  }
};

export const updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!note) return errorResponse(res, 404, "Note not found");
    return successResponse(res, 200, "Note updated", note);
  } catch (error) {
    return errorResponse(res, 500, "Server error", [error.message]);
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!note) return errorResponse(res, 404, "Note not found");
    return successResponse(res, 200, "Note deleted");
  } catch (error) {
    return errorResponse(res, 500, "Server error", [error.message]);
  }
};
