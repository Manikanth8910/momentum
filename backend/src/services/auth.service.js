import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { ConflictError, AuthenticationError, NotFoundError } from "../utils/appError.js";

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "super_secret_jwt_key_change_in_production",
    { expiresIn: "7d" }
  );
};

// Auto-seeding logic removed to prevent mock data regeneration
export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError("A user with this email address already exists.");
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new AuthenticationError("Invalid email or password.");
  }

  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export const loginWithGoogle = async (idToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in the environment variables.");
  }

  // Debug logs
  console.log("🔍 DEBUG - Configured GOOGLE_CLIENT_ID:", `"${clientId}"`);
  try {
    const decoded = jwt.decode(idToken);
    console.log("🔍 DEBUG - ID Token Audience (aud):", `"${decoded?.aud}"`);
    console.log("🔍 DEBUG - ID Token Issuer (iss):", `"${decoded?.iss}"`);
  } catch (err) {
    console.log("🔍 DEBUG - Failed to decode ID token:", err.message);
  }

  const client = new OAuth2Client(clientId);

  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AuthenticationError("Invalid Google ID token payload.");
  }

  const { name, email, picture } = payload;

  // Find or create user
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      avatar: picture,
      role: "member",
    });
  } else if (picture && user.avatar !== picture) {
    // Sync avatar if it changed
    user.avatar = picture;
    await user.save();
  }

  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    token,
  };
};

export const getUserMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found.");
  }
  return user;
};

export const updateUserMe = async (userId, data) => {
  const user = await User.findByIdAndUpdate(userId, data, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    throw new NotFoundError("User not found.");
  }
  return user;
};
