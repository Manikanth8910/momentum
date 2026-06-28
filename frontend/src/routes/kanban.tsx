import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { apiFetch } from "../lib/api";
import { useAuthGuard } from "../hooks/useAuthGuard";

export const Route = createFileRoute("/kanban")({
  head: () => ({
    meta: [
      { title: "Momentum Task Management | Kanban Board" },
      { name: "description", content: "Manage your engineering sprint tasks." },
    ],
  }),
  component: Kanban,
});

interface Task {
  id: string;
  code: string;
  title: string;
  description?: string;
  priority: "High" | "Medium" | "Low";
  column: "todo" | "inprogress" | "done";
  progress?: number; // percentage
  tags?: string[];
  dueDate?: string;
  assignees?: string[];
  commentsCount?: number;
  docsCount?: number;
}

function Kanban() {
  useAuthGuard();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [viewType, setViewType] = useState<"Board" | "List" | "Timeline">("Board");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await apiFetch("/tasks");
        const data = await res.json();
        if (data.success && data.data && Array.isArray(data.data.tasks)) {
          const mappedTasks: Task[] = data.data.tasks.map((t: any) => ({
            id: t._id,
            code: t.code || `ENG-${Math.floor(100 + Math.random() * 900)}`,
            title: t.title,
            description: t.description || "",
            priority: t.priority || "Medium",
            column: t.status === "In Progress" ? "inprogress" : t.status === "Completed" ? "done" : "todo",
            dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
            tags: t.labels || [],
          }));
          setTasks(mappedTasks);
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      }
    };
    fetchTasks();

    const handleSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setSearchQuery(customEvent.detail || "");
    };
    window.addEventListener("taskSearch", handleSearch);

    // Also listen to taskCreated event to refresh the list
    window.addEventListener("taskCreated", fetchTasks);

    return () => {
      window.removeEventListener("taskSearch", handleSearch);
      window.removeEventListener("taskCreated", fetchTasks);
    };
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          priority: newPriority,
          status: "Todo",
          category: "Engineering",
          labels: ["Frontend"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        const t = data.data;
        const newTask: Task = {
          id: t._id,
          code: t.code || `ENG-${Math.floor(100 + Math.random() * 900)}`,
          title: t.title,
          description: t.description || "",
          priority: t.priority || "Medium",
          column: "todo",
          dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
          tags: t.labels || [],
        };
        setTasks([...tasks, newTask]);
      }
    } catch (err) {
      console.error(err);
    }

    setNewTitle("");
    setNewDesc("");
    setNewPriority("Medium");
    setIsModalOpen(false);
  };

  const moveTask = async (id: string, direction: "forward" | "backward") => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    let nextCol = task.column;
    if (direction === "forward") {
      if (task.column === "todo") nextCol = "inprogress";
      else if (task.column === "inprogress") nextCol = "done";
    } else {
      if (task.column === "done") nextCol = "inprogress";
      else if (task.column === "inprogress") nextCol = "todo";
    }

    const backendStatus = nextCol === "inprogress" ? "In Progress" : nextCol === "done" ? "Completed" : "Todo";

    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, column: nextCol } : t))
    );

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await apiFetch(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: backendStatus }),
      });
    } catch (err) {
      console.error("Failed to update task status on backend:", err);
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    try {
      await apiFetch(`/tasks/${id}`, { method: "DELETE" });
      showToast("Task deleted.");
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const archiveDoneTasks = async () => {
    const doneTasks = tasks.filter((task) => task.column === "done");
    setTasks(tasks.filter((task) => task.column !== "done"));

    const token = localStorage.getItem("token");
    if (!token) return;

    // Soft delete done tasks in backend
    for (const task of doneTasks) {
      try {
        await apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Failed to archive task on backend:", err);
      }
    }
  };

  const getColTasks = (col: "todo" | "inprogress" | "done") => {
    return tasks.filter((t) => {
      if (t.column !== col) return false;
      const query = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        t.code.toLowerCase().includes(query) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    });
  };

  const renderCard = (task: Task) => {
    const priorityColors = {
      High: "bg-error-container text-on-error-container",
      Medium: "bg-secondary-container text-on-secondary-container",
      Low: "bg-surface-container-high text-on-surface-variant",
    };

    return (
      <div
        key={task.id}
        className={`bg-white border border-outline-variant rounded-lg p-4 shadow-sm hover:shadow-md hover:border-[#004ac6]/30 transition-all cursor-pointer group/card relative ${
          task.column === "done" ? "opacity-75 grayscale-[0.5] hover:opacity-100" : ""
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          <span className="text-xs font-medium text-outline group-hover/card:text-[#004ac6]">
            {task.code}
          </span>
        </div>
        <h3 className={`text-sm font-bold text-on-surface mb-1 ${task.column === "done" ? "line-through" : ""}`}>
          {task.title}
        </h3>
        {task.description && (
          <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1 mb-3">
            {task.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-[#f3f3fe] text-on-surface-variant px-1.5 py-0.5 rounded border border-outline-variant/30"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {task.progress !== undefined && (
          <div className="w-full bg-[#f3f3fe] h-1 rounded-full mb-3 overflow-hidden">
            <div className="bg-[#004ac6] h-full transition-all duration-300" style={{ width: `${task.progress}%` }}></div>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex -space-x-2">
            {task.assignees ? (
              task.assignees.map((imgUrl, index) => (
                <img
                  key={index}
                  className="w-6 h-6 rounded-full border-2 border-white object-cover"
                  alt="Assignee"
                  src={imgUrl}
                />
              ))
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#e1e2ed] text-on-surface-variant flex items-center justify-center text-[10px] font-bold border-2 border-white">
                U
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Movement Controls */}
            {task.column !== "todo" && (
              <button
                onClick={(e) => { e.stopPropagation(); moveTask(task.id, "backward"); }}
                className="p-1 text-outline hover:text-[#004ac6] transition-colors rounded hover:bg-[#f3f3fe]"
                title="Move Backward"
              >
                <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
              </button>
            )}
            {task.column !== "done" && (
              <button
                onClick={(e) => { e.stopPropagation(); moveTask(task.id, "forward"); }}
                className="p-1 text-outline hover:text-[#004ac6] transition-colors rounded hover:bg-[#f3f3fe]"
                title="Move Forward"
              >
                <span className="material-symbols-outlined !text-[16px]">arrow_forward</span>
              </button>
            )}
            {task.commentsCount !== undefined && (
              <div className="flex items-center gap-0.5 text-on-surface-variant">
                <span className="material-symbols-outlined !text-[14px]">chat_bubble</span>
                <span className="text-xs">{task.commentsCount}</span>
              </div>
            )}
            {task.docsCount !== undefined && (
              <div className="flex items-center gap-0.5 text-on-surface-variant">
                <span className="material-symbols-outlined !text-[14px]">link</span>
                <span className="text-xs">{task.docsCount}</span>
              </div>
            )}
            {/* Delete Button */}
            <button
              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
              className="p-1 text-outline hover:text-error transition-colors rounded hover:bg-red-50 ml-auto opacity-0 group-hover/card:opacity-100"
              title="Delete Task"
            >
              <span className="material-symbols-outlined !text-[16px]">delete</span>
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="flex min-h-screen bg-background text-on-surface font-body-md overflow-hidden">
      {/* Sidebar */}
      <Sidebar activePage="tasks" />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 flex flex-col h-screen bg-background">
        {/* Header */}
        <Header />

        {/* Kanban Toolbar */}
        <div className="px-4 md:px-8 py-3 md:py-4 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-white">
          <div className="flex flex-wrap items-center gap-3 md:gap-6">
            <div className="flex flex-col">
              <h1 className="text-base md:text-xl font-bold text-on-surface">Engineering Sprint</h1>
              <p className="text-xs text-on-surface-variant hidden sm:block">Q4 Performance Improvements</p>
            </div>
            <div className="flex bg-[#f3f3fe] rounded-lg p-1 border border-outline-variant">
              <button onClick={() => setViewType("Board")} className={`px-2 md:px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewType === "Board" ? "bg-white shadow-sm text-[#004ac6]" : "text-on-surface-variant hover:text-on-surface"}`}>Board</button>
              <button onClick={() => { setViewType("List"); showToast("List view coming soon!"); }} className={`px-2 md:px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewType === "List" ? "bg-white shadow-sm text-[#004ac6]" : "text-on-surface-variant hover:text-on-surface"}`}>List</button>
              <button onClick={() => { setViewType("Timeline"); showToast("Timeline view coming soon!"); }} className={`px-2 md:px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewType === "Timeline" ? "bg-white shadow-sm text-[#004ac6]" : "text-on-surface-variant hover:text-on-surface"}`}>Timeline</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast("Opening filters...")} className="flex items-center gap-1 px-2 md:px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-[#f3f3fe] transition-colors">
              <span className="material-symbols-outlined !text-[16px]">filter_list</span>
              <span className="hidden sm:inline">Filter</span>
            </button>
            <button onClick={() => showToast("Opening sort options...")} className="flex items-center gap-1 px-2 md:px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-[#f3f3fe] transition-colors">
              <span className="material-symbols-outlined !text-[16px]">swap_vert</span>
              <span className="hidden sm:inline">Sort</span>
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 px-2 md:px-3 py-1.5 bg-[#004ac6] text-white rounded-lg text-xs font-semibold hover:bg-[#004ac6]/90 transition-all active:scale-95 shadow-sm">
              <span className="material-symbols-outlined !text-[16px]">add</span>
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>

        {/* Scrollable Board Content */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#fafafa]">
          <div className="flex h-full p-4 md:p-8 gap-4 md:gap-8 min-w-max">
            {/* Column: To Do */}
            <div className="w-80 flex flex-col h-full group">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">To Do</span>
                  <span className="bg-[#e1e2ed] text-on-surface-variant text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {getColTasks("todo").length}
                  </span>
                </div>
                <button className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar pb-8">
                {getColTasks("todo").map(renderCard)}
              </div>
            </div>

            {/* Column: In Progress */}
            <div className="w-80 flex flex-col h-full group">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">In Progress</span>
                  <span className="bg-[#004ac6] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {getColTasks("inprogress").length}
                  </span>
                </div>
                <button className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar pb-8">
                {getColTasks("inprogress").map(renderCard)}
              </div>
            </div>

            {/* Column: Done */}
            <div className="w-80 flex flex-col h-full group">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Done</span>
                  <span className="bg-[#e1e2ed] text-on-surface-variant text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {getColTasks("done").length}
                  </span>
                </div>
                <button className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar pb-8">
                {getColTasks("done").map(renderCard)}
                {getColTasks("done").length > 0 && (
                  <button
                    onClick={archiveDoneTasks}
                    className="w-full py-4 border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center gap-2 text-on-surface-variant hover:bg-[#f3f3fe] hover:border-[#004ac6]/50 transition-all group/archive"
                  >
                    <span className="material-symbols-outlined group-hover/archive:text-[#004ac6]">archive</span>
                    <span className="text-xs font-semibold">Archive Finished Tasks</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-on-surface">Add New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="task-title">
                  Task Title
                </label>
                <input
                  id="task-title"
                  className="w-full border border-outline-variant rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#004ac6]"
                  placeholder="Task title..."
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="task-desc">
                  Description
                </label>
                <textarea
                  id="task-desc"
                  className="w-full border border-outline-variant rounded-lg p-2.5 text-sm resize-none h-20 focus:outline-none focus:border-[#004ac6]"
                  placeholder="Task details..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="task-priority">
                  Priority
                </label>
                <select
                  id="task-priority"
                  className="w-full border border-outline-variant rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#004ac6]"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-sm hover:bg-[#f3f3fe] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004ac6] text-white rounded-lg text-sm hover:bg-[#004ac6]/90 transition-colors"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#1e222b] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold z-50 animate-in slide-in-from-bottom-3 duration-300">
          {toast}
        </div>
      )}
    </div>
  );
}
