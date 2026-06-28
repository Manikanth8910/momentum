import Invite from "../models/Invite.js";
import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

export const getMembers = async (req, res) => {
  try {
    // For now, return a mock list of users from the DB simulating a team
    // In a real app, users would be tied by a workspaceId
    const users = await User.find({ _id: { $ne: req.user._id } }).select('name email role avatar').limit(10);
    // Add the current user as well
    const me = await User.findById(req.user._id).select('name email role avatar');
    return successResponse(res, 200, "Members retrieved", [me, ...users]);
  } catch (error) {
    return errorResponse(res, 500, "Server error", [error.message]);
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return errorResponse(res, 400, "Email is required");
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (!user) {
      // For demo purposes, we create a placeholder user when invited
      user = await User.create({
        name: email.split('@')[0],
        email,
        password: "TempPassword123!", // Dummy
        role: role || "Member"
      });
    }

    const invite = await Invite.create({
      email,
      role: role || "Member",
      invitedBy: req.user._id,
      status: "Accepted" // Mocking auto-accept for demo
    });
    
    return successResponse(res, 201, "Invitation sent", invite);
  } catch (error) {
    return errorResponse(res, 500, "Server error", [error.message]);
  }
};
