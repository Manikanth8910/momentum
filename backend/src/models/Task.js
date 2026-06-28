import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Completed"],
      default: "Todo",
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    category: {
      type: String,
      trim: true,
    },
    labels: {
      type: [String],
      default: [],
    },
    dueDate: {
      type: Date,
    },
    estimatedTime: {
      type: Number,
      min: [0, "Estimated time cannot be negative"],
    },
    completedAt: {
      type: Date,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      trim: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    attachments: [
      {
        filename: String,
        url: String,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must have a creator"],
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
taskSchema.index({ createdBy: 1, status: 1, priority: 1 });
taskSchema.index({ position: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ title: "text", description: "text" });

// Query middleware to auto-exclude soft-deleted tasks
taskSchema.pre(/^find/, function (next) {
  this.find({ deletedAt: null });
  next();
});

export const Task = mongoose.model("Task", taskSchema);
export default Task;
