import mongoose from "mongoose";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { NotFoundError } from "../utils/appError.js";

export const queryTasks = async (userId, options) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    priority,
    category,
    favorite,
    labels,
    sort = "position",
    order = "asc",
    month,
    year,
  } = options;

  const query = {
    createdBy: new mongoose.Types.ObjectId(userId),
    deletedAt: null,
  };

  // Text Search
  if (search) {
    query.$text = { $search: search };
  }

  // Filters
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (favorite !== undefined) query.favorite = favorite === "true" || favorite === true;
  
  if (labels) {
    const labelList = Array.isArray(labels) ? labels : labels.split(",");
    query.labels = { $all: labelList };
  }

  // Calendar Date Filter
  if (month && year) {
    const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    const end = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));
    query.dueDate = { $gte: start, $lte: end };
  }

  // Pagination & Sorting
  const skip = (page - 1) * limit;
  const sortOrder = order === "asc" ? 1 : -1;
  const sortOptions = {};
  sortOptions[sort] = sortOrder;

  const tasks = await Task.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Task.countDocuments(query);

  return {
    tasks,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

export const createTask = async (userId, taskData) => {
  const task = await Task.create({
    ...taskData,
    createdBy: userId,
  });

  // Log Activity
  await Activity.create({
    action: "Task Created",
    task: task.title,
    performedBy: userId,
    metadata: { taskId: task._id },
  });

  return task;
};

export const getTaskById = async (userId, taskId) => {
  const task = await Task.findOne({ _id: taskId, createdBy: userId });
  if (!task) {
    throw new NotFoundError("Task not found.");
  }
  return task;
};

export const updateTask = async (userId, taskId, taskData) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, createdBy: userId },
    { ...taskData, updatedBy: userId },
    { new: true, runValidators: true }
  );
  if (!task) {
    throw new NotFoundError("Task not found.");
  }

  // Log Activity
  await Activity.create({
    action: "Task Updated",
    task: task.title,
    performedBy: userId,
    metadata: { taskId: task._id },
  });

  return task;
};

export const softDeleteTask = async (userId, taskId) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, createdBy: userId },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!task) {
    throw new NotFoundError("Task not found.");
  }

  // Log Activity
  await Activity.create({
    action: "Task Deleted",
    task: task.title,
    performedBy: userId,
    metadata: { taskId: task._id },
  });

  return task;
};

export const updateTaskStatus = async (userId, taskId, status) => {
  const updateData = { status };
  if (status === "Completed") {
    updateData.completedAt = new Date();
  } else {
    updateData.completedAt = null;
  }

  const task = await Task.findOneAndUpdate(
    { _id: taskId, createdBy: userId },
    updateData,
    { new: true, runValidators: true }
  );
  if (!task) {
    throw new NotFoundError("Task not found.");
  }

  // Log Activity
  await Activity.create({
    action: "Status Changed",
    task: task.title,
    performedBy: userId,
    metadata: { taskId: task._id, status },
  });

  return task;
};

// Reorder tasks for Kanban Board Drag-and-Drop
export const reorderTasks = async (userId, reorderData) => {
  const bulkOps = reorderData.map((item) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(item.id), createdBy: userId },
      update: { $set: { position: item.position } },
    },
  }));

  await Task.bulkWrite(bulkOps);

  // Log Activity
  await Activity.create({
    action: "Tasks Reordered",
    task: `${reorderData.length} Tasks`,
    performedBy: userId,
  });

  return { updatedCount: reorderData.length };
};

// Single Optimized Aggregation for Dashboard
export const getDashboardMetrics = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const startOfToday = new Date(now.setUTCHours(0, 0, 0, 0));
  const endOfToday = new Date(now.setUTCHours(23, 59, 59, 999));

  const taskMetrics = await Task.aggregate([
    { $match: { createdBy: userObjectId, deletedAt: null } },
    {
      $facet: {
        total: [{ $count: "count" }],
        completed: [{ $match: { status: "Completed" } }, { $count: "count" }],
        pending: [{ $match: { status: { $ne: "Completed" } } }, { $count: "count" }],
        overdue: [{ $match: { status: { $ne: "Completed" }, dueDate: { $lt: startOfToday } } }, { $count: "count" }],
        priorities: [
          { $group: { _id: "$priority", count: { $sum: 1 } } }
        ],
        statuses: [
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ],
        today: [
          { $match: { dueDate: { $gte: startOfToday, $lte: endOfToday } } },
          { $sort: { position: 1 } },
          { $limit: 10 }
        ],
        upcoming: [
          { $match: { status: { $ne: "Completed" }, dueDate: { $gt: endOfToday } } },
          { $sort: { dueDate: 1 } },
          { $limit: 10 }
        ],
        recent: [
          { $sort: { updatedAt: -1 } },
          { $limit: 5 }
        ],
      }
    }
  ]);

  const result = taskMetrics[0];
  const totalVal = result.total[0]?.count || 0;
  const completedVal = result.completed[0]?.count || 0;
  const pendingVal = result.pending[0]?.count || 0;
  const overdueVal = result.overdue[0]?.count || 0;
  const completionRate = totalVal > 0 ? Number(((completedVal / totalVal) * 100).toFixed(1)) : 0;

  const priorityBreakdown = { High: 0, Medium: 0, Low: 0 };
  result.priorities.forEach((p) => {
    if (p._id in priorityBreakdown) {
      priorityBreakdown[p._id] = p.count;
    }
  });

  const statusBreakdown = { Todo: 0, "In Progress": 0, Completed: 0 };
  result.statuses.forEach((s) => {
    if (s._id in statusBreakdown) {
      statusBreakdown[s._id] = s.count;
    }
  });

  // Fetch recent activity
  const activities = await Activity.find({ performedBy: userId })
    .sort({ timestamp: -1 })
    .limit(10)
    .populate("performedBy", "name email")
    .lean();

  return {
    summary: {
      totalTasks: totalVal,
      completedTasks: completedVal,
      pendingTasks: pendingVal,
      overdueTasks: overdueVal,
      completionRate,
    },
    today: result.today,
    upcoming: result.upcoming,
    recent: result.recent,
    activity: activities,
    priorityDistribution: priorityBreakdown,
    statusDistribution: statusBreakdown,
  };
};

// Global Search
export const globalSearch = async (userId, q) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Perform regex-based search across title, description, category, and labels
  return Task.find({
    createdBy: userObjectId,
    deletedAt: null,
    $or: [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { labels: { $regex: q, $options: "i" } },
    ],
  })
    .limit(30)
    .lean();
};

// Activity log retrieval
export const getActivityLogs = async (userId) => {
  return Activity.find({ performedBy: userId })
    .sort({ timestamp: -1 })
    .limit(50)
    .populate("performedBy", "name email")
    .lean();
};
