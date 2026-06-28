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

const seedTasksForUser = async (userId) => {
  try {
    const count = await Task.countDocuments({ createdBy: userId });
    if (count > 0) return;

    const now = new Date();
    const today = new Date(now.setUTCHours(12, 0, 0, 0));
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await Task.create([
      {
        title: "Refactor Authentication Middleware",
        description: "Remove legacy refresh token logic and secure endpoints with a single 7-day JWT header check.",
        status: "In Progress",
        priority: "High",
        category: "Security",
        labels: ["Backend", "Auth", "Security"],
        dueDate: today,
        estimatedTime: 1.5,
        favorite: true,
        color: "bg-blue-50",
        position: 1,
        createdBy: userId,
      },
      {
        title: "Update Typography CSS Tokens",
        description: "Align font-sizes, weights, and letter-spacings with the new Momentum Design System v2.4 spec.",
        status: "Todo",
        priority: "Low",
        category: "Design System",
        labels: ["Frontend", "CSS", "UI"],
        dueDate: tomorrow,
        estimatedTime: 0.75,
        favorite: false,
        color: "bg-purple-50",
        position: 2,
        createdBy: userId,
      },
      {
        title: "Database Index Optimization",
        description: "Add compound index on createdBy/status/priority and position index to improve Kanban load speeds.",
        status: "Todo",
        priority: "Medium",
        category: "Database",
        labels: ["Backend", "MongoDB"],
        dueDate: yesterday,
        estimatedTime: 2.0,
        favorite: false,
        color: "bg-amber-50",
        position: 3,
        createdBy: userId,
      },
      {
        title: "Review Apollo Phase II Roadmap",
        description: "Analyze WebSocket sync architecture payloads and verify client connection retry backoff rates.",
        status: "Todo",
        priority: "Medium",
        category: "Product",
        labels: ["Planning", "Apollo"],
        dueDate: nextWeek,
        estimatedTime: 1.0,
        favorite: true,
        color: "bg-slate-50",
        position: 4,
        createdBy: userId,
      },
      {
        title: "Deploy Release v2.4",
        description: "Deploy the refactored modular backend and premium React frontend to staging for QA review.",
        status: "Completed",
        priority: "High",
        category: "DevOps",
        labels: ["Release", "Deployment"],
        dueDate: today,
        completedAt: today,
        estimatedTime: 3.0,
        favorite: false,
        color: "bg-emerald-50",
        position: 5,
        createdBy: userId,
      },
      {
        title: "Implement Google Calendar Sync API",
        description: "Integrate the Google Calendar API client to sync meetings and task due dates automatically.",
        status: "In Progress",
        priority: "High",
        category: "Integrations",
        labels: ["Backend", "Google", "Calendar"],
        dueDate: tomorrow,
        estimatedTime: 2.5,
        favorite: true,
        color: "bg-blue-50",
        position: 6,
        createdBy: userId,
      },
      {
        title: "Dockerize Backend Microservices",
        description: "Write Dockerfiles and a docker-compose.yml configuration to run the MongoDB database and Node.js server locally in containers.",
        status: "Todo",
        priority: "Medium",
        category: "DevOps",
        labels: ["Docker", "DevOps", "Setup"],
        dueDate: nextWeek,
        estimatedTime: 1.5,
        favorite: false,
        color: "bg-slate-50",
        position: 7,
        createdBy: userId,
      },
      {
        title: "Write E2E Testing Suite with Playwright",
        description: "Create automated end-to-end browser tests to verify Google OAuth login and task creation flows.",
        status: "Todo",
        priority: "Low",
        category: "Testing",
        labels: ["QA", "Playwright", "Automation"],
        dueDate: tomorrow,
        estimatedTime: 2.0,
        favorite: false,
        color: "bg-purple-50",
        position: 8,
        createdBy: userId,
      },
      {
        title: "Optimize Frontend Asset Bundle Size",
        description: "Analyze Vite bundle report, enable code splitting on route level, and compress large SVG icon assets.",
        status: "Todo",
        priority: "Medium",
        category: "Performance",
        labels: ["Frontend", "Vite", "Performance"],
        dueDate: today,
        estimatedTime: 1.0,
        favorite: false,
        color: "bg-amber-50",
        position: 9,
        createdBy: userId,
      },
      {
        title: "Slack Webhook Notifications Integration",
        description: "Implement a Slack notification worker that broadcasts updates when a task is completed or reassigned.",
        status: "Completed",
        priority: "Medium",
        category: "Integrations",
        labels: ["Slack", "Backend", "Webhooks"],
        dueDate: yesterday,
        completedAt: yesterday,
        estimatedTime: 1.25,
        favorite: false,
        color: "bg-emerald-50",
        position: 10,
        createdBy: userId,
      },
    ]);
    console.log(`🌱 Auto-seeded 10 tasks for user: ${userId}`);
  } catch (err) {
    console.error("❌ Failed to auto-seed tasks:", err);
  }
};

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError("A user with this email address already exists.");
  }

  const user = await User.create({ name, email, password });
  await seedTasksForUser(user._id);
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

  await seedTasksForUser(user._id);
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

  await seedTasksForUser(user._id);
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
  await seedTasksForUser(user._id);
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
