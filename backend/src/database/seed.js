import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";

dotenv.config();

const seedData = async () => {
  try {
    // 1. Connect to DB
    const connStr = process.env.MONGO_URI || "mongodb://localhost:27017/momentum";
    await mongoose.connect(connStr);
    console.log("💾 Connected to MongoDB for seeding...");

    // 2. Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    console.log("🧹 Cleared existing users, tasks, and activities.");

    // 3. Create Dummy User
    const user = await User.create({
      name: "Alex Thorne",
      email: "alex.thorne@momentum.com",
      password: "Password123", // Will be hashed by pre-save hook
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHhkv6g29ueT8Y-pWWudXJhmEk8K5XOF0cFx_TZtn35hNhuXPwTAh5zqv-o_MurmSNDHfOvNoI5y1lSbpibAZXkCPnpOIjipQ06q6RVGCImC9AWZfKF1PclIagemCsxXIj72AiuXUVTxZznj-KQ6uKau-16422hn9d_14ec0vxRcH1PVBLY4KXR0g7YeXsOVDtVtFs_dxhsINObxL0xFFl7KRvMCCdZcAUtoANvfDWUMz5FKBcondpzoOMAlDxK2n0DX0x5it-BBE",
      role: "member",
    });
    console.log(`👤 Created user: ${user.name} (${user.email})`);

    // 4. Create Tasks
    const now = new Date();
    const today = new Date(now.setUTCHours(12, 0, 0, 0));
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tasks = await Task.create([
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
        createdBy: user._id,
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
        createdBy: user._id,
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
        createdBy: user._id,
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
        createdBy: user._id,
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
        createdBy: user._id,
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
        createdBy: user._id,
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
        createdBy: user._id,
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
        createdBy: user._id,
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
        createdBy: user._id,
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
        createdBy: user._id,
      },
    ]);
    console.log(`📋 Created ${tasks.length} tasks.`);

    // 5. Create Activity Logs
    await Activity.create([
      {
        action: "Task Created",
        task: "Refactor Authentication Middleware",
        performedBy: user._id,
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        metadata: { taskId: tasks[0]._id },
      },
      {
        action: "Task Created",
        task: "Update Typography CSS Tokens",
        performedBy: user._id,
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        metadata: { taskId: tasks[1]._id },
      },
      {
        action: "Status Changed",
        task: "Deploy Release v2.4",
        performedBy: user._id,
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        metadata: { taskId: tasks[4]._id, status: "Completed" },
      },
    ]);
    console.log("📈 Seeded activity logs.");

    console.log("⭐ Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedData();
