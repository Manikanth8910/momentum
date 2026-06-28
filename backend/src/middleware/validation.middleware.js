import { validationResult } from "express-validator";
import { ValidationError } from "../utils/appError.js";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return next(new ValidationError(errorArray));
  }
  next();
};
