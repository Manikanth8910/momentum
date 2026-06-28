import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    role: { type: String, default: "Member" },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Pending", "Accepted", "Declined"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Invite", inviteSchema);
