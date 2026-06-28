import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, "Action description is required"],
      trim: true,
    },
    task: {
      type: String,
      required: [true, "Task reference (title or ID) is required"],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User performing the action is required"],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: false, // We use timestamp field explicitly
  }
);

export const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
