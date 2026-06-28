import { body, param } from "express-validator";

export const createTaskValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),
    
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
    
  body("status")
    .optional()
    .isIn(["Todo", "In Progress", "Completed"])
    .withMessage("Status must be one of: Todo, In Progress, Completed"),
    
  body("priority")
    .optional()
    .isIn(["High", "Medium", "Low"])
    .withMessage("Priority must be one of: High, Medium, Low"),
    
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid ISO8601 date format"),
    
  body("estimatedHours")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Estimated hours must be a positive number"),
    
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array of strings"),
    
  body("tags.*")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Tag items must be non-empty strings"),
];

export const updateTaskValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid task ID format"),
    
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Task title cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),
    
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
    
  body("status")
    .optional()
    .isIn(["Todo", "In Progress", "Completed"])
    .withMessage("Status must be one of: Todo, In Progress, Completed"),
    
  body("priority")
    .optional()
    .isIn(["High", "Medium", "Low"])
    .withMessage("Priority must be one of: High, Medium, Low"),
    
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid ISO8601 date format"),
    
  body("estimatedHours")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Estimated hours must be a positive number"),
];

export const taskIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid task ID format"),
];
