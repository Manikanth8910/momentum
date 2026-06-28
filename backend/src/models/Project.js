import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    progress: { type: Number, default: 0 },
    dueDate: { type: Date },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    isPinned: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
