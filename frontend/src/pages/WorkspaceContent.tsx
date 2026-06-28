import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { usePersistentState } from "../hooks/usePersistentState";
import { apiFetch } from "../lib/api";
import Sidebar from "../components/Sidebar";
import {
  Sparkles,
  Layers,
  Plus,
  Users,
  Settings,
  Share2,
  Bookmark,
  ChevronRight,
  Play,
  CheckSquare,
  FileText,
  Clock,
  Paperclip,
  MessageSquare,
  Pin,
  Calendar,
  Bell,
  Sun,
  Flame,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MoreVertical,
  X,
  PlusCircle,
  FolderPlus,
  StickyNote,
  MessageCircle,
} from "lucide-react";



// Mock Types
interface Task {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  date: string;
  status: "todo" | "inprogress" | "done" | "overdue";
  timeEst: string;
  comments: number;
  attachments: number;
  completed: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  tasksCount: number;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  isPinned: boolean;
  isFavorite: boolean;
}

interface Note {
  id: string;
  title: string;
  preview: string;
  tag: string;
  lastEdited: string;
  color: string;
  isFavorite: boolean;
}

interface Member {
  id: string;
  name: string;
  role: string;
  status: string;
  currentTask: string;
  online: boolean;
  avatar: string;
}

export default function WorkspacePage() {
  const navigate = useNavigate();
  useAuthGuard();
  const [loading, setLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const [wsName, setWsName] = useState("Engineering");
  const [wsDesc, setWsDesc] = useState("Core development hub for Momentum platform engineering.");

  useEffect(() => {
    const savedName = localStorage.getItem("workspaceName");
    const savedDesc = localStorage.getItem("workspaceDesc");
    if (savedName) setWsName(savedName);
    if (savedDesc) setWsDesc(savedDesc);

    const handleUpdate = () => {
      const updatedName = localStorage.getItem("workspaceName");
      const updatedDesc = localStorage.getItem("workspaceDesc");
      if (updatedName) setWsName(updatedName);
      if (updatedDesc) setWsDesc(updatedDesc);
    };
    window.addEventListener("workspaceUpdate", handleUpdate);
    return () => window.removeEventListener("workspaceUpdate", handleUpdate);
  }, []);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Pomodoro Timer State
  const [pomoTime, setPomoTime] = useState(1500); // 25 minutes
  const [pomoActive, setPomoActive] = useState(false);

  // FAB State
  const [fabExpanded, setFabExpanded] = useState(false);

  // States for interactive data
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    apiFetch("/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.tasks)) {
          // Map backend tasks to frontend workspace task format
          setTasks(data.data.tasks.map((t: any) => ({
            id: t._id,
            title: t.title,
            priority: t.priority,
            date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No Date",
            status: t.status === "Completed" ? "done" : t.status === "In Progress" ? "inprogress" : "todo",
            timeEst: t.estimatedTime ? `${t.estimatedTime}h` : "1h",
            comments: 0,
            attachments: 0,
            completed: t.status === "Completed",
          })));
        }
      })
      .catch((err) => console.error("Failed to fetch tasks:", err))
      .finally(() => setLoading(false));
  }, []);

  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, notesRes, memRes] = await Promise.all([
          apiFetch("/projects").catch(() => null),
          apiFetch("/notes").catch(() => null),
          apiFetch("/workspace/members").catch(() => null)
        ]);
        
        if (projRes) {
          const projData = await projRes.json();
          if (projData.success) setProjects(projData.data);
        }
        if (notesRes) {
          const notesData = await notesRes.json();
          if (notesData.success) setNotes(notesData.data);
        }
        if (memRes) {
          const memData = await memRes.json();
          if (memData.success) setMembers(memData.data);
        }
      } catch (err) {
        console.error("Failed to fetch workspace data:", err);
      }
    };
    fetchData();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      const res = await apiFetch("/workspace/invite", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: "Member" })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Invitation sent!");
        const memRes = await apiFetch("/workspace/members");
        const memData = await memRes.json();
        if (memData.success) setMembers(memData.data);
      } else {
        showToast("Failed to invite: " + data.message);
      }
    } catch (err) {
      showToast("Error inviting member");
    }
    setIsInviteModalOpen(false);
    setInviteEmail("");
  };

  // Keyboard shortcut listener for Command Palette (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Pomodoro Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (pomoActive && pomoTime > 0) {
      interval = setInterval(() => {
        setPomoTime((t) => t - 1);
      }, 1000);
    } else if (pomoTime === 0) {
      setPomoActive(false);
      showToast("Focus session completed! Take a break.");
      setPomoTime(1500);
    }
    return () => clearInterval(interval);
  }, [pomoActive, pomoTime]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    const task = tasks.find((t) => t.id === id);
    if (task) {
      showToast(task.completed ? "Task marked active" : "Task completed!");
    }
  };

  const toggleFavoriteProject = (id: string) => {
    setProjects(
      projects.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  const toggleFavoriteNote = (id: string) => {
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, isFavorite: !n.isFavorite } : n))
    );
  };

  const formatPomoTime = () => {
    const mins = Math.floor(pomoTime / 60).toString().padStart(2, "0");
    const secs = (pomoTime % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  if (loading) {
    /* Skeleton Loader */
    return (
      <div className="flex min-h-screen bg-[#faf8ff] p-6 gap-6">
        <div className="w-64 bg-slate-100 rounded-xl h-screen animate-pulse"></div>
        <div className="flex-1 space-y-6">
          <div className="h-16 bg-slate-100 rounded-xl w-full animate-pulse"></div>
          <div className="h-40 bg-slate-100 rounded-xl w-full animate-pulse"></div>
          <div className="grid grid-cols-3 gap-6">
            <div className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateProject = () => {
    const newProject: Project = {
      id: `p${Date.now()}`,
      name: "New Project",
      description: "Newly created project. Add details here.",
      progress: 0,
      tasksCount: 0,
      dueDate: "TBD",
      priority: "Medium",
      isPinned: false,
      isFavorite: false,
    };
    setProjects([newProject, ...projects]);
    showToast("New project created!");
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: `n${Date.now()}`,
      title: "New Note",
      preview: "Start typing your note here...",
      tag: "Draft",
      lastEdited: "Just now",
      color: "bg-slate-50",
      isFavorite: false,
    };
    setNotes([newNote, ...notes]);
    showToast("New note created!");
  };

  return (
    <div className="flex min-h-screen bg-[#faf8ff] text-[#191b23] font-body-md selection:bg-[#004ac6]/10 selection:text-[#004ac6] w-full overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar activePage="workspace" />

      {/* Main Workspace Frame */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen relative min-w-0 w-full overflow-x-hidden">
        {/* Top Navbar */}
        <header className="flex justify-between items-center w-full px-4 md:px-8 h-16 sticky top-0 z-40 bg-white border-b border-outline-variant/30">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 md:gap-2 text-xs font-semibold text-secondary truncate">
            <span>Momentum</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Workspaces</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#191b23]">{wsName}</span>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center justify-center md:justify-start gap-2 p-2 md:px-3 md:py-1.5 bg-[#f3f3fe] border border-outline-variant/30 rounded-lg text-xs text-outline hover:text-on-surface transition-colors w-8 md:w-44 shrink-0"
            >
              <Search className="w-4 h-4 md:w-3.5 md:h-3.5" />
              <span className="hidden md:inline">Search (Cmd + K)</span>
            </button>
            <button className="p-2 text-outline hover:bg-[#f3f3fe] rounded-full transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-error rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
              <img
                className="w-full h-full object-cover"
                alt="Profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHhkv6g29ueT8Y-pWWudXJhmEk8K5XOF0cFx_TZtn35hNhuXPwTAh5zqv-o_MurmSNDHfOvNoI5y1lSbpibAZXkCPnpOIjipQ06q6RVGCImC9AWZfKF1PclIagemCsxXIj72AiuXUVTxZznj-KQ6uKau-16422hn9d_14ec0vxRcH1PVBLY4KXR0g7YeXsOVDtVtFs_dxhsINObxL0xFFl7KRvMCCdZcAUtoANvfDWUMz5FKBcondpzoOMAlDxK2n0DX0x5it-BBE"
              />
            </div>
          </div>
        </header>

        {/* Outer Split Canvas */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-w-0 w-full">
          {/* Left Side: Main Feed */}
          <main className="flex-1 p-4 lg:p-8 max-w-[1000px] space-y-8 lg:overflow-y-auto pb-24 min-w-0 w-full">
            {/* Workspace Header Info */}
            <section className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-outline-variant/30 rounded-xl p-4 md:p-6 shadow-sm gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#004ac6] text-white rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold">{wsName}</h1>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-full text-[10px] font-bold uppercase">
                      Active Sprint
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    {wsDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5 mr-2">
                  {members.map((m) => (
                    <img
                      key={m.id}
                      className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      alt={m.name}
                      src={m.avatar}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-outline-variant/30 rounded-lg text-xs font-semibold hover:bg-[#f3f3fe] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Invite
                </button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("Workspace link copied to clipboard!"); }} className="p-2 border border-outline-variant/30 rounded-lg text-secondary hover:text-[#004ac6] hover:bg-[#f3f3fe] transition-all">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => navigate({ to: "/settings" })} className="p-2 border border-outline-variant/30 rounded-lg text-secondary hover:text-[#004ac6] hover:bg-[#f3f3fe] transition-all">
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>

            {/* Hero Section */}
            <section className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
              <div className="space-y-4 max-w-lg z-10">
                <div>
                  <span className="text-[10px] font-bold text-[#004ac6] uppercase tracking-widest">
                    👋 Welcome back
                  </span>
                  <h2 className="text-xl font-bold text-[#191b23] mt-1">Refine Design System Architecture</h2>
                  <p className="text-xs text-secondary mt-1">
                    Your focus today is stabilizing token structures for cross-platform styling compatibility.
                  </p>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Sprint Progress</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full bg-[#f3f3fe] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#004ac6] h-full" style={{ width: "65%" }}></div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate({ to: "/kanban" })}
                    className="flex items-center gap-1 px-4 py-2 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Continue Working
                  </button>
                  <div className="text-xs text-secondary font-medium">
                    Weekly Goal: Complete 12 tasks
                  </div>
                </div>
              </div>

              {/* Decorative side badge */}
              <div className="hidden md:flex items-center justify-center p-4 border border-outline-variant/20 rounded-xl bg-slate-50 min-w-[200px] text-center z-10 self-center">
                <div className="space-y-1">
                  <span className="text-xs text-secondary font-semibold">Productivity Score</span>
                  <h3 className="text-3xl font-black text-[#004ac6]">94%</h3>
                  <p className="text-[10px] text-emerald-600 font-bold">+4% vs last week</p>
                </div>
              </div>
            </section>

            {/* Quick Actions Grid */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Create Task", icon: CheckSquare, action: () => setIsAddModalOpen(true) },
                { label: "Create Project", icon: FolderPlus, action: handleCreateProject },
                { label: "Create Note", icon: StickyNote, action: handleCreateNote },
                { label: "Focus Session", icon: Flame, action: () => setPomoActive(true) },
              ].map((act, i) => (
                <button
                  key={i}
                  onClick={act.action}
                  className="flex flex-col items-center justify-center p-4 bg-white border border-outline-variant/30 rounded-xl shadow-sm hover:shadow-md hover:border-[#004ac6]/30 transition-all text-center gap-2 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#f3f3fe] text-[#004ac6] flex items-center justify-center group-hover:bg-[#004ac6] group-hover:text-white transition-all">
                    <act.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#191b23]">{act.label}</span>
                </button>
              ))}
            </section>

            {/* Active Projects */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-outline">Active Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-white border border-outline-variant/30 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[#004ac6]/20 transition-all flex flex-col justify-between min-h-[170px]"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            proj.priority === "High"
                              ? "bg-error-container text-on-error-container"
                              : "bg-slate-100 text-secondary"
                          }`}
                        >
                          {proj.priority}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleFavoriteProject(proj.id)}
                            className={`p-1 rounded hover:bg-slate-50 transition-colors ${
                              proj.isFavorite ? "text-amber-500" : "text-outline"
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                          </button>
                          {proj.isPinned && <Pin className="w-3.5 h-3.5 text-[#004ac6] rotate-45" />}
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-on-surface">{proj.name}</h4>
                      <p className="text-xs text-on-surface-variant line-clamp-2">{proj.description}</p>
                    </div>

                    <div className="space-y-2 pt-4">
                      <div className="flex justify-between text-[10px] font-semibold text-secondary">
                        <span>{proj.tasksCount} Tasks</span>
                        <span>{proj.progress}%</span>
                      </div>
                      <div className="w-full bg-[#f3f3fe] h-1 rounded-full overflow-hidden">
                        <div className="bg-[#004ac6] h-full" style={{ width: `${proj.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* My Tasks */}
            <section className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-outline">My Tasks</h3>
                <span className="text-xs text-secondary font-medium">Sprint Focus</span>
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex justify-between items-center p-3 rounded-lg border transition-all ${
                      task.completed
                        ? "bg-slate-50 border-outline-variant/20 opacity-60"
                        : "bg-white border-outline-variant/30 hover:border-outline-variant/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        className="w-4 h-4 rounded border-outline-variant text-[#004ac6] focus:ring-[#004ac6]/20 cursor-pointer"
                      />
                      <span className={`text-sm font-semibold ${task.completed ? "line-through text-outline" : "text-on-surface"}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          task.priority === "High"
                            ? "bg-error-container text-on-error-container"
                            : "bg-slate-100 text-secondary"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-xs text-outline font-medium hidden sm:block">{task.date}</span>
                      <div className="flex items-center gap-2 text-xs text-outline font-medium">
                        {task.comments > 0 && (
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3" />
                            {task.comments}
                          </span>
                        )}
                        {task.attachments > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Paperclip className="w-3 h-3" />
                            {task.attachments}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Workspace Notes */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-outline">Sticky Notes & Drafts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`border border-outline-variant/30 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[150px] ${note.color}`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-outline-variant uppercase">{note.tag}</span>
                        <button
                          onClick={() => toggleFavoriteNote(note.id)}
                          className={`p-1 rounded hover:bg-black/5 transition-colors ${
                            note.isFavorite ? "text-amber-500" : "text-outline-variant"
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-on-surface">{note.title}</h4>
                      <p className="text-xs text-on-surface-variant line-clamp-3 whitespace-pre-line">
                        {note.preview}
                      </p>
                    </div>
                    <span className="text-[10px] text-outline font-medium pt-2 border-t border-black/5">
                      Edited {note.lastEdited}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Right Side: Right Utility Panel (Bento Sidebar) */}
          <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-outline-variant/40 bg-white p-6 flex flex-col gap-6 lg:overflow-y-auto pb-24 lg:pb-6">
            {/* Clock Widget */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Current Time</span>
                <h3 className="text-lg font-bold text-[#191b23] mt-0.5">11:48 AM</h3>
              </div>
              <div className="flex items-center gap-1 text-xs text-secondary font-medium">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>24°C</span>
              </div>
            </div>

            {/* Pomodoro Timer Widget */}
            <div className="border border-outline-variant/30 rounded-xl p-4 bg-slate-50/50 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Focus Timer</h4>
                <Flame className={`w-4 h-4 ${pomoActive ? "text-orange-500 animate-pulse" : "text-outline"}`} />
              </div>
              <div className="text-center py-2">
                <span className="text-4xl font-black tabular-nums tracking-tight">{formatPomoTime()}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPomoActive(!pomoActive)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-[0.98] ${
                    pomoActive ? "bg-amber-600 hover:bg-amber-700" : "bg-[#004ac6] hover:bg-[#004ac6]/90"
                  }`}
                >
                  {pomoActive ? "Pause" : "Start"}
                </button>
                <button
                  onClick={() => {
                    setPomoActive(false);
                    setPomoTime(1500);
                  }}
                  className="px-3 py-1.5 border border-outline-variant/30 hover:bg-slate-100 rounded-lg text-xs font-bold text-secondary transition-all"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Team Collaboration Widget */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Team Status</h4>
              <div className="space-y-3">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f3f3fe]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img className="w-8 h-8 rounded-full object-cover" alt={m.name} src={m.avatar} />
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-white ${
                            m.online ? "bg-emerald-500" : "bg-outline-variant"
                          }`}
                        ></span>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-on-surface">{m.name}</h5>
                        <p className="text-[10px] text-secondary">{m.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-outline font-semibold uppercase">{m.status}</span>
                      <p className="text-[9px] text-[#004ac6] font-medium max-w-[100px] truncate">
                        {m.currentTask}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Smart Suggestions Widget */}
            <div className="border border-outline-variant/30 rounded-xl p-4 bg-[#f3f3fe]/50 space-y-3">
              <div className="flex items-center gap-1.5 text-[#004ac6]">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-widest">Smart Suggestions</h4>
              </div>
              <ul className="text-xs space-y-2 text-on-surface-variant font-medium">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full shrink-0 mt-1.5"></span>
                  <span>Prioritize **Database Index Optimization** (Overdue 2 days).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full shrink-0 mt-1.5"></span>
                  <span>Review design feedback from Sarah on the navigation layout.</span>
                </li>
              </ul>
            </div>

            {/* Upcoming Deadlines Widget */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Upcoming Deadlines</h4>
              <div className="space-y-2">
                <div className="p-3 bg-white border border-outline-variant/20 rounded-lg flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-on-surface">v2.4 Release</h5>
                    <p className="text-[10px] text-secondary">Jun 30 (2 days left)</p>
                  </div>
                  <span className="text-[9px] bg-error-container text-on-error-container px-2 py-0.5 rounded-full font-bold">
                    High
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {fabExpanded && (
          <div className="bg-white border border-outline-variant/30 rounded-xl p-3 shadow-lg space-y-2 min-w-[150px] transform origin-bottom-right transition-all">
            <button
              onClick={() => {
                setIsAddModalOpen(true);
                setFabExpanded(false);
              }}
              className="w-full text-left px-2 py-1 text-xs font-semibold hover:bg-[#f3f3fe] rounded transition-colors flex items-center gap-2"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#004ac6]" />
              New Task
            </button>
            <button
              onClick={() => {
                showToast("New project flow...");
                setFabExpanded(false);
              }}
              className="w-full text-left px-2 py-1 text-xs font-semibold hover:bg-[#f3f3fe] rounded transition-colors flex items-center gap-2"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#004ac6]" />
              New Project
            </button>
            <button
              onClick={() => {
                showToast("New note flow...");
                setFabExpanded(false);
              }}
              className="w-full text-left px-2 py-1 text-xs font-semibold hover:bg-[#f3f3fe] rounded transition-colors flex items-center gap-2"
            >
              <StickyNote className="w-3.5 h-3.5 text-[#004ac6]" />
              New Note
            </button>
          </div>
        )}
        <button
          onClick={() => setFabExpanded(!fabExpanded)}
          className="w-12 h-12 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95"
        >
          {fabExpanded ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-outline-variant/20">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h2 className="text-base font-bold text-[#191b23]">Create Task</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-outline hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsAddModalOpen(false);
                showToast("Task created!");
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="task-title">
                  Task Title
                </label>
                <input
                  id="task-title"
                  className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                  placeholder="Task title..."
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="task-desc">
                  Description
                </label>
                <textarea
                  id="task-desc"
                  className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs resize-none h-20 focus:outline-none focus:border-[#004ac6]"
                  placeholder="Details about the task..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant" htmlFor="task-priority">
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6] bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant" htmlFor="task-est">
                    Time Estimate
                  </label>
                  <input
                    id="task-est"
                    className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                    placeholder="e.g. 1.5h"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant/30 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004ac6] text-white rounded-lg text-xs font-semibold hover:bg-[#004ac6]/90 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Command Palette Overlay */}
      {isCommandPaletteOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-8 pt-24"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-xl w-full overflow-hidden shadow-2xl border border-outline-variant/20 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center p-4 border-b border-outline-variant/20">
              <Search className="w-4 h-4 text-outline absolute left-4" />
              <input
                className="w-full pl-8 pr-4 py-1 bg-transparent text-sm focus:outline-none placeholder:text-outline"
                placeholder="Type a command or search workspace..."
                autoFocus
              />
              <button
                onClick={() => setIsCommandPaletteOpen(false)}
                className="text-xs text-secondary hover:text-on-surface border border-outline-variant/30 px-2 py-0.5 rounded"
              >
                ESC
              </button>
            </div>
            <div className="p-2 max-h-[300px] overflow-y-auto text-xs font-semibold space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase text-outline">Navigation</div>
              <button
                onClick={() => {
                  window.location.href = "/dashboard";
                  setIsCommandPaletteOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f3f3fe] rounded-lg transition-colors flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-[#004ac6]" />
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  window.location.href = "/kanban";
                  setIsCommandPaletteOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f3f3fe] rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#004ac6]" />
                Go to Kanban Tasks
              </button>
              <button
                onClick={() => {
                  window.location.href = "/calendar";
                  setIsCommandPaletteOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f3f3fe] rounded-lg transition-colors flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-[#004ac6]" />
                Go to Calendar
              </button>

              <div className="px-3 py-1 text-[10px] uppercase text-outline pt-2">Actions</div>
              <button
                onClick={() => {
                  setIsAddModalOpen(true);
                  setIsCommandPaletteOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f3f3fe] rounded-lg transition-colors flex items-center gap-2"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#004ac6]" />
                Create New Task
              </button>
              <button
                onClick={() => {
                  setPomoActive(true);
                  setIsCommandPaletteOpen(false);
                  showToast("Focus timer started!");
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f3f3fe] rounded-lg transition-colors flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 text-[#004ac6] fill-[#004ac6]" />
                Start Focus Session (25 min)
              </button>
            </div>
            <div className="bg-[#f8f9fc] border-t border-outline-variant/20 p-3 text-[10px] text-secondary flex justify-between">
              <span>Use ↑↓ to navigate, Enter to select</span>
              <span>Cmd + K to toggle</span>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-outline-variant/30 flex flex-col">
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-outline-variant/20">
              <h2 className="text-lg font-bold text-on-surface">Invite Team Member</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-outline hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 md:p-6 bg-[#faf8ff] flex-1">
              <form id="invite-form" onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email Address</label>
                  <input type="email" required placeholder="colleague@company.com" className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#004ac6] bg-white shadow-sm" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                </div>
              </form>
            </div>
            <div className="p-4 md:p-6 border-t border-outline-variant/20 flex justify-end gap-3 bg-white">
              <button onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 border border-outline-variant/30 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" form="invite-form" className="px-4 py-2 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg text-sm font-bold shadow-sm transition-all">Send Invite</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#191b23] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-outline/20 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
