import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { apiFetch } from "../lib/api";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { usePersistentState } from "../hooks/usePersistentState";
import {
  Settings as SettingsIcon,
  User,
  Paintbrush,
  Bell,
  Calendar,
  Layers,
  Users,
  Shield,
  Cpu,
  Keyboard,
  Sliders,
  Database,
  CreditCard,
  HelpCircle,
  Info,
  Check,
  Plus,
  Trash2,
  Lock,
  Globe,
  AlertTriangle,
  ExternalLink,
  Download,
  ChevronRight,
} from "lucide-react";



type Section =
  | "general"
  | "profile"
  | "appearance"
  | "notifications"
  | "calendar"
  | "workspace"
  | "team"
  | "security"
  | "integrations"
  | "shortcuts"
  | "preferences"
  | "data"
  | "help"
  | "about";

export default function SettingsPage() {
  useAuthGuard();
  const [activeSection, setActiveSection] = useState<Section>("general");
  const [toast, setToast] = useState<string | null>(null);

  // General States - load from localStorage or blank
  const [wsName, setWsName] = useState(() => localStorage.getItem("workspaceName") || "");
  const [wsDesc, setWsDesc] = useState(() => localStorage.getItem("workspaceDesc") || "");
  const [autoSave, setAutoSave] = useState(true);
  const [visibility, setVisibility] = useState("private");

  // Calendar Settings States
  const [calDefaultView, setCalDefaultView] = useState("month");
  const [calWeekStart, setCalWeekStart] = useState("sunday");
  const [calTimeZone, setCalTimeZone] = useState("Asia/Kolkata");
  const [calWorkDays, setCalWorkDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  // Workspace Settings States
  const [wsUrl, setWsUrl] = useState(() => localStorage.getItem("workspaceUrl") || "");
  const [wsAutoArchive, setWsAutoArchive] = useState(true);
  const [wsAllowGuests, setWsAllowGuests] = useState(true);
  const [wsSprintLength, setWsSprintLength] = useState("2 weeks");

  // Preferences States
  const [prefLanguage, setPrefLanguage] = useState("en-US");
  const [prefTimeFormat, setPrefTimeFormat] = useState("12h");
  const [prefDateFormat, setPrefDateFormat] = useState("MM/DD/YYYY");
  const [prefShowTeam, setPrefShowTeam] = useState(true);
  const [prefShowStats, setPrefShowStats] = useState(true);

  // Data States
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupLocation, setBackupLocation] = useState("momentum");

  // Help & Support States
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");

  // Profile States — start empty to match SSR, hydrate from cache in useEffect
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    // Hydrate from localStorage cache immediately (client-only, after hydration)
    try {
      const cached = localStorage.getItem("cachedUser");
      if (cached) {
        const u = JSON.parse(cached);
        setFullName(u.name || "");
        setEmail(u.email || "");
        setRole(u.role === "admin" ? "Administrator" : "Member");
        setAvatar(u.avatar || "");
        setUsername(u.name ? u.name.toLowerCase().replace(/[^a-z0-9]/g, "_") : "");
      }
    } catch (_) {}

    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await apiFetch("/auth/me");
        const data = await res.json();
        if (data.success) {
          setFullName(data.data.name);
          setEmail(data.data.email);
          setRole(data.data.role === "admin" ? "Administrator" : "Member");
          setAvatar(data.data.avatar || "");
          setUsername(data.data.name.toLowerCase().replace(/[^a-z0-9]/g, "_"));
          localStorage.setItem("cachedUser", JSON.stringify(data.data));
          if (data.data.integrations) {
            setIntegrations(data.data.integrations);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  // Appearance States
  const [compactMode, setCompactMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    showToast(enabled ? "Dark mode enabled" : "Light mode enabled");
  };

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (!newPassword || !currentPassword) return showToast("Please fill in all fields.");
    if (newPassword !== confirmPassword) return showToast("New passwords do not match.");
    if (newPassword.length < 8) return showToast("New password must be at least 8 characters.");
    try {
      const res = await apiFetch("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Password changed successfully!");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        showToast(data.message || "Failed to change password.");
      }
    } catch (err) {
      showToast("Network error. Please try again.");
    }
  };

  // Notification Toggles
  const [notifs, setNotifs] = useState({
    reminders: true,
    dueDates: true,
    mentions: true,
    updates: false,
    comments: true,
    email: true,
    desktop: true,
  });

  // Team Member State - starts empty, would be fetched from API
  const [team, setTeam] = useState<{id: string; name: string; email: string; role: string; status: string; lastActive: string}[]>([]);

  // Integration Connection State
  const [integrations, setIntegrations] = useState({
    gcal: true,
    slack: true,
    github: false,
    discord: false,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleNotif = (key: keyof typeof notifs) => {
    setNotifs({ ...notifs, [key]: !notifs[key] });
    showToast("Notification preferences updated");
  };

  const toggleIntegration = async (key: keyof typeof integrations) => {
    const newIntegrations = { ...integrations, [key]: !integrations[key] };
    setIntegrations(newIntegrations);
    showToast(integrations[key] ? "Integration disconnected" : "Integration connected!");

    // Persist to backend
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await apiFetch("/auth/me", {
        method: "PUT",
        body: JSON.stringify({ integrations: newIntegrations }),
      });
    } catch (err) {
      console.error("Failed to update integrations on backend:", err);
    }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: fullName,
          email: email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Profile updated successfully!");
        // Dispatch a custom event to notify Header/Sidebar to reload profile
        window.dispatchEvent(new Event("profileUpdate"));
      } else {
        showToast("Failed to update profile: " + data.message);
      }
    } catch (err) {
      showToast("Error saving profile");
      console.error(err);
    }
  };


  const handleExportJSON = async () => {
    try {
      showToast("Preparing JSON export...");
      const res = await apiFetch("/tasks");
      const data = await res.json();
      if (data.success && data.data && data.data.tasks) {
        const jsonStr = JSON.stringify(data.data.tasks, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `momentum_tasks_export_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("JSON export complete.");
      } else {
        showToast("Failed to fetch data for export.");
      }
    } catch (err) {
      console.error(err);
      showToast("Error exporting JSON.");
    }
  };

  const handleExportCSV = async () => {
    try {
      showToast("Preparing CSV export...");
      const res = await apiFetch("/tasks");
      const data = await res.json();
      if (data.success && data.data && data.data.tasks) {
        const tasks = data.data.tasks;
        if (tasks.length === 0) {
          showToast("No tasks to export.");
          return;
        }
        const headers = ["ID", "Title", "Status", "Priority", "Due Date"];
        const rows = tasks.map((t: any) => [
          t._id, 
          `"${(t.title || "").replace(/"/g, '""')}"`, 
          t.status, 
          t.priority, 
          t.dueDate
        ]);
        const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `momentum_tasks_export_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("CSV export complete.");
      } else {
        showToast("Failed to fetch data for export.");
      }
    } catch (err) {
      console.error(err);
      showToast("Error exporting CSV.");
    }
  };

  const handleSaveWorkspace = () => {
    localStorage.setItem("workspaceName", wsName);
    localStorage.setItem("workspaceDesc", wsDesc);
    localStorage.setItem("workspaceUrl", wsUrl);
    showToast("Workspace settings saved!");
    window.dispatchEvent(new Event("workspaceUpdate"));
  };

  const handleRemoveMember = (id: string) => {
    setTeam(team.filter((m) => m.id !== id));
    showToast("Member removed from workspace");
  };

  // Settings Menu Items
  const menuItems = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "profile", label: "My Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Paintbrush },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "workspace", label: "Workspace", icon: Layers },
    { id: "team", label: "Team Members", icon: Users },
    { id: "security", label: "Security", icon: Shield },
    { id: "integrations", label: "Integrations", icon: Cpu },
    { id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard },
    { id: "preferences", label: "Preferences", icon: Sliders },
    { id: "data", label: "Data & Backup", icon: Database },
    { id: "help", label: "Help & Support", icon: HelpCircle },
    { id: "about", label: "About", icon: Info },
  ] as const;

  return (
    <div className="flex min-h-screen bg-[#faf8ff] text-[#191b23] font-body-md selection:bg-[#004ac6]/10 selection:text-[#004ac6]">
      {/* Sidebar */}
      <Sidebar activePage="settings" />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <Header />

        {/* Outer Split Canvas */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {/* Column 1: Settings Navigation */}
          <nav className="w-full lg:w-60 border-b lg:border-b-0 lg:border-r border-outline-variant/40 bg-white p-4 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto shrink-0 custom-scrollbar">
            <div className="hidden lg:block px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-outline">
              Settings
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-[#004ac6]/5 text-[#004ac6] font-bold"
                      : "text-on-secondary-container hover:bg-[#e1e2ed]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Column 2: Active Setting Content */}
          <div className="flex-1 p-4 lg:p-8 lg:overflow-y-auto max-w-[750px]">
            {/* General Section */}
            {activeSection === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">General Settings</h3>
                  <p className="text-xs text-secondary mt-1">Configure your primary workspace options.</p>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-4 shadow-sm">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant" htmlFor="ws-name">
                      Workspace Name
                    </label>
                    <input
                      id="ws-name"
                      className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                      value={wsName}
                      onChange={(e) => setWsName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant" htmlFor="ws-desc">
                      Workspace Description
                    </label>
                    <textarea
                      id="ws-desc"
                      className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs resize-none h-20 focus:outline-none focus:border-[#004ac6]"
                      value={wsDesc}
                      onChange={(e) => setWsDesc(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Auto Save Drafts</h4>
                      <p className="text-[10px] text-secondary">Automatically save your note drafts in the background.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={() => setAutoSave(!autoSave)}
                      className="w-4 h-4 rounded border-outline-variant text-[#004ac6] focus:ring-[#004ac6]/20"
                    />
                  </div>

                  <div className="space-y-1 pt-2 border-t border-outline-variant/20">
                    <label className="text-xs font-bold text-on-surface-variant" htmlFor="visibility">
                      Workspace Visibility
                    </label>
                    <select
                      id="visibility"
                      className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6] bg-white"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                    >
                      <option value="public">Public (Anyone in team can join)</option>
                      <option value="private">Private (Invite only)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => showToast("General settings saved")}
                  className="px-4 py-2 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  Save Changes
                </button>
              </div>
            )}

            {/* Profile Section */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">My Profile</h3>
                  <p className="text-xs text-secondary mt-1">Manage your public profile and details.</p>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-4 shadow-sm">
                  {/* Profile Card */}
                  <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-outline-variant relative group cursor-pointer bg-slate-100 flex items-center justify-center">
                      <img
                        className="w-full h-full object-cover"
                        alt="Profile"
                        src={avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCHhkv6g29ueT8Y-pWWudXJhmEk8K5XOF0cFx_TZtn35hNhuXPwTAh5zqv-o_MurmSNDHfOvNoI5y1lSbpibAZXkCPnpOIjipQ06q6RVGCImC9AWZfKF1PclIagemCsxXIj72AiuXUVTxZznj-KQ6uKau-16422hn9d_14ec0vxRcH1PVBLY4KXR0g7YeXsOVDtVtFs_dxhsINObxL0xFFl7KRvMCCdZcAUtoANvfDWUMz5FKBcondpzoOMAlDxK2n0DX0x5it-BBE"}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{fullName}</h4>
                      <p className="text-xs text-secondary">{role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant" htmlFor="full-name">
                        Full Name
                      </label>
                      <input
                        id="full-name"
                        className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant" htmlFor="username">
                        Username
                      </label>
                      <input
                        id="username"
                        className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant" htmlFor="bio">
                      Biography
                    </label>
                    <textarea
                      id="bio"
                      className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs resize-none h-16 focus:outline-none focus:border-[#004ac6]"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                  >
                    Save Changes
                  </button>
                  <button onClick={() => showToast("Opening change password flow...")} className="px-4 py-2 border border-outline-variant/30 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors text-secondary">
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Appearance</h3>
                  <p className="text-xs text-secondary mt-1">Customize how Momentum looks on your screen.</p>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-6 shadow-sm">
                  {/* Compact Mode */}
                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Compact Mode</h4>
                      <p className="text-[10px] text-secondary">Render lists and cards with denser padding.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={() => setCompactMode(!compactMode)}
                      className="w-4 h-4 rounded border-outline-variant text-[#004ac6] focus:ring-[#004ac6]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Notifications</h3>
                  <p className="text-xs text-secondary mt-1">Configure your notification preferences.</p>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-4 shadow-sm">
                  {[
                    { key: "reminders", label: "Task Reminders", desc: "Get notified when a task is starting or ending." },
                    { key: "dueDates", label: "Due Date Alerts", desc: "Receive warnings 24h before task deadlines." },
                    { key: "mentions", label: "Mentions & Tag alerts", desc: "Notify when team members tag you in comments." },
                    { key: "updates", label: "Workspace Updates", desc: "Get alerts on team roadmap changes." },
                    { key: "comments", label: "Comment Activity", desc: "Receive notifications for new task comments." },
                  ].map((notifItem) => (
                    <div
                      key={notifItem.key}
                      className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-b-0"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-on-surface">{notifItem.label}</h4>
                        <p className="text-[10px] text-secondary mt-0.5">{notifItem.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifs[notifItem.key as keyof typeof notifs]}
                        onChange={() => handleToggleNotif(notifItem.key as any)}
                        className="w-4 h-4 rounded border-outline-variant text-[#004ac6] focus:ring-[#004ac6]/20"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar Settings Section */}
            {activeSection === "calendar" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Calendar Settings</h3>
                  <p className="text-xs text-secondary mt-1">Configure your calendar preferences and scheduling rules.</p>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-6 shadow-sm">
                  {/* Default View */}
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Default View</h4>
                      <p className="text-[10px] text-secondary mt-0.5">Select the default layout for your calendar.</p>
                    </div>
                    <select
                      value={calDefaultView}
                      onChange={(e) => {
                        setCalDefaultView(e.target.value);
                        showToast("Calendar view updated");
                      }}
                      className="border border-outline-variant/30 rounded-lg p-2 text-xs bg-white focus:outline-none focus:border-[#004ac6] w-40"
                    >
                      <option value="month">Month View</option>
                      <option value="week">Week View</option>
                      <option value="day">Day View</option>
                      <option value="agenda">Agenda View</option>
                    </select>
                  </div>

                  {/* Week Start */}
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Week Starts On</h4>
                      <p className="text-[10px] text-secondary mt-0.5">Choose the first day of your work week.</p>
                    </div>
                    <select
                      value={calWeekStart}
                      onChange={(e) => {
                        setCalWeekStart(e.target.value);
                        showToast("Week start updated");
                      }}
                      className="border border-outline-variant/30 rounded-lg p-2 text-xs bg-white focus:outline-none focus:border-[#004ac6] w-40"
                    >
                      <option value="sunday">Sunday</option>
                      <option value="monday">Monday</option>
                      <option value="saturday">Saturday</option>
                    </select>
                  </div>

                  {/* Time Zone */}
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Primary Time Zone</h4>
                      <p className="text-[10px] text-secondary mt-0.5">Set the local time zone for your scheduled events.</p>
                    </div>
                    <select
                      value={calTimeZone}
                      onChange={(e) => {
                        setCalTimeZone(e.target.value);
                        showToast("Time zone updated");
                      }}
                      className="border border-outline-variant/30 rounded-lg p-2 text-xs bg-white focus:outline-none focus:border-[#004ac6] w-40"
                    >
                      <option value="Asia/Kolkata">India (IST)</option>
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="America/New_York">New York (EST)</option>
                      <option value="America/Los_Angeles">Los Angeles (PST)</option>
                    </select>
                  </div>

                  {/* Work Week */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Work Week</h4>
                      <p className="text-[10px] text-secondary mt-0.5">Select your active working days.</p>
                    </div>
                    <div className="flex gap-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
                        const dayKey = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][idx];
                        const isActive = calWorkDays[dayKey as keyof typeof calWorkDays];
                        return (
                          <button
                            key={day}
                            onClick={() => {
                              setCalWorkDays({ ...calWorkDays, [dayKey]: !isActive });
                              showToast(`${day} status toggled`);
                            }}
                            className={`w-9 h-9 rounded-lg text-xs font-semibold border flex items-center justify-center transition-all ${
                              isActive
                                ? "bg-[#004ac6] text-white border-transparent"
                                : "bg-white text-on-surface border-outline-variant/30 hover:bg-slate-50"
                            }`}
                          >
                            {day[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Workspace Settings Section */}
            {activeSection === "workspace" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Workspace Settings</h3>
                  <p className="text-xs text-secondary mt-1">Manage your workspace metadata and collaboration rules.</p>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-6 shadow-sm">
                  {/* Workspace Info */}
                  <div className="space-y-4 pb-6 border-b border-outline-variant/10">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#004ac6] rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                        {wsName[0] || "E"}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">Workspace Logo</h4>
                        <p className="text-xs text-secondary mt-0.5">JPEG or PNG. Max size 1MB.</p>
                        <button
                          onClick={() => showToast("Uploading logo...")}
                          className="mt-2 text-xs font-bold text-[#004ac6] hover:underline"
                        >
                          Change Logo
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant" htmlFor="ws-name">
                          Workspace Name
                        </label>
                        <input
                          id="ws-name"
                          className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                          type="text"
                          value={wsName}
                          onChange={(e) => setWsName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant" htmlFor="ws-url">
                          Workspace URL
                        </label>
                        <input
                          id="ws-url"
                          className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                          type="text"
                          value={wsUrl}
                          onChange={(e) => setWsUrl(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant" htmlFor="ws-desc">
                        Workspace Description
                      </label>
                      <textarea
                        id="ws-desc"
                        rows={3}
                        className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                        value={wsDesc}
                        onChange={(e) => setWsDesc(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Collaboration Preferences */}
                  <div className="space-y-4 pb-6 border-b border-outline-variant/10">
                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Workspace Features</h4>
                    
                    {/* Auto Archive */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-on-surface">Auto-Archive Completed Tasks</h5>
                        <p className="text-[10px] text-secondary mt-0.5">Move completed tasks to archive after 14 days.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={wsAutoArchive}
                        onChange={() => {
                          setWsAutoArchive(!wsAutoArchive);
                          showToast("Auto-archival toggled");
                        }}
                        className="w-4 h-4 rounded border-outline-variant text-[#004ac6] focus:ring-[#004ac6]/20"
                      />
                    </div>

                    {/* Guest Access */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-on-surface">Allow Guest Access</h5>
                        <p className="text-[10px] text-secondary mt-0.5">Enable external clients to view shared boards.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={wsAllowGuests}
                        onChange={() => {
                          setWsAllowGuests(!wsAllowGuests);
                          showToast("Guest access toggled");
                        }}
                        className="w-4 h-4 rounded border-outline-variant text-[#004ac6] focus:ring-[#004ac6]/20"
                      />
                    </div>

                    {/* Sprint Cycle Length */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-on-surface">Sprint Cycle</h5>
                        <p className="text-[10px] text-secondary mt-0.5">Define the duration of active sprints.</p>
                      </div>
                      <select
                        value={wsSprintLength}
                        onChange={(e) => {
                          setWsSprintLength(e.target.value);
                          showToast("Sprint cycle updated");
                        }}
                        className="border border-outline-variant/30 rounded-lg p-2 text-xs bg-white focus:outline-none focus:border-[#004ac6] w-32"
                      >
                        <option value="1 week">1 Week</option>
                        <option value="2 weeks">2 Weeks</option>
                        <option value="4 weeks">4 Weeks</option>
                      </select>
                    </div>
                  </div>

                  {/* Save Changes */}
                  <div className="pt-4">
                    <button
                      onClick={handleSaveWorkspace}
                      className="px-4 py-2 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                    >
                      Save Changes
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-4 border border-red-200 bg-red-50/30 rounded-xl space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-red-700">Danger Zone</h4>
                      <p className="text-[10px] text-red-600 mt-0.5">Permanently delete this workspace and all associated projects/tasks.</p>
                    </div>
                    <button
                      onClick={() => showToast("Workspace deletion requested")}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Delete Workspace
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Team Members Section */}
            {activeSection === "team" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">Team Members</h3>
                    <p className="text-xs text-secondary mt-1">Manage who has access to this workspace.</p>
                  </div>
                  <button
                    onClick={() => showToast("Opening invite members...")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Invite Member
                  </button>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-outline-variant/20 text-xs font-bold text-secondary uppercase">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-xs font-semibold text-on-surface-variant">
                      {team.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-[#191b23]">{member.name}</td>
                          <td className="p-4 text-secondary">{member.email}</td>
                          <td className="p-4">{member.role}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full text-[9px] font-bold text-emerald-700">
                              {member.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {member.role !== "Product Lead" && (
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-1 hover:bg-error/5 rounded text-secondary hover:text-error transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Security</h3>
                  <p className="text-xs text-secondary mt-1">Manage authentication and password options.</p>
                </div>

                {/* Change Password Card */}
                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Change Password
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-bold text-secondary" htmlFor="cur-pass">
                        Current Password
                      </label>
                      <input
                        id="cur-pass"
                        type="password"
                        className="w-full border border-outline-variant/30 rounded-lg p-2 text-xs focus:outline-none focus:border-[#004ac6]"
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-bold text-secondary" htmlFor="new-pass">
                        New Password
                      </label>
                      <input
                        id="new-pass"
                        type="password"
                        className="w-full border border-outline-variant/30 rounded-lg p-2 text-xs focus:outline-none focus:border-[#004ac6]"
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-bold text-secondary" htmlFor="conf-pass">
                        Confirm New Password
                      </label>
                      <input
                        id="conf-pass"
                        type="password"
                        className="w-full border border-outline-variant/30 rounded-lg p-2 text-xs focus:outline-none focus:border-[#004ac6]"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => showToast("Password updated successfully")}
                    className="px-3 py-1.5 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                  >
                    Update Password
                  </button>
                </div>

                {/* Active Sessions */}
                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> Active Sessions
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-outline-variant/10 rounded-lg">
                      <div>
                        <p className="font-bold">macOS • Chrome Browser</p>
                        <p className="text-[10px] text-secondary">IP: 192.168.29.135 • Current Session</p>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Section */}
            {activeSection === "integrations" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Integrations</h3>
                  <p className="text-xs text-secondary mt-1">Connect Momentum to other tools you use.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "gcal", name: "Google Calendar", desc: "Sync meetings and schedule time blocks." },
                    { key: "slack", name: "Slack Notifications", desc: "Broadcast task updates directly into channels." },
                    { key: "github", name: "GitHub Projects", desc: "Link repository pull requests to tasks." },
                    { key: "discord", name: "Discord Webhooks", desc: "Stream updates to your community servers." },
                  ].map((intg) => (
                    <div
                      key={intg.key}
                      className="bg-white border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[140px]"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">{intg.name}</h4>
                        <p className="text-xs text-on-surface-variant mt-1">{intg.desc}</p>
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <span className="text-xs font-medium text-secondary">
                          Status:{" "}
                          <span
                            className={`font-bold ${
                              integrations[intg.key as keyof typeof integrations]
                                ? "text-[#004ac6]"
                                : "text-outline"
                            }`}
                          >
                            {integrations[intg.key as keyof typeof integrations] ? "Connected" : "Disconnected"}
                          </span>
                        </span>
                        <button
                          onClick={() => toggleIntegration(intg.key as any)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            integrations[intg.key as keyof typeof integrations]
                              ? "bg-slate-100 hover:bg-slate-200 text-[#191b23] border-outline-variant/30"
                              : "bg-[#004ac6] hover:bg-[#004ac6]/90 text-white border-transparent"
                          }`}
                        >
                          {integrations[intg.key as keyof typeof integrations] ? "Disconnect" : "Connect"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Section */}
            {activeSection === "shortcuts" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Keyboard Shortcuts</h3>
                  <p className="text-xs text-secondary mt-1">Accelerate your workflow with quick key triggers.</p>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-4 shadow-sm text-xs font-semibold text-on-surface-variant">
                  {[
                    { action: "Open Command Palette", keys: ["Cmd", "K"] },
                    { action: "Search Workspace", keys: ["S"] },
                    { action: "Create New Task", keys: ["C"] },
                    { action: "Toggle Sidebar", keys: ["Cmd", "/"] },
                    { action: "Quick Add Event", keys: ["A"] },
                  ].map((shortcut, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2.5 border-b border-outline-variant/10 last:border-b-0">
                      <span>{shortcut.action}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((k) => (
                          <kbd
                            key={k}
                            className="bg-[#f3f3fe] border border-outline-variant/40 px-2 py-0.5 rounded shadow-sm text-[10px] font-bold font-mono"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === "preferences" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Preferences</h3>
                  <p className="text-xs text-secondary mt-1">Configure your language, regional settings, and display options.</p>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-6 shadow-sm">
                  {/* Language */}
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Language</h4>
                      <p className="text-[10px] text-secondary mt-0.5">Select your preferred display language.</p>
                    </div>
                    <select
                      value={prefLanguage}
                      onChange={(e) => {
                        setPrefLanguage(e.target.value);
                        showToast("Language preference updated");
                      }}
                      className="border border-outline-variant/30 rounded-lg p-2 text-xs bg-white focus:outline-none focus:border-[#004ac6] w-40"
                    >
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="es-ES">Spanish (Español)</option>
                      <option value="de-DE">German (Deutsch)</option>
                      <option value="fr-FR">French (Français)</option>
                    </select>
                  </div>

                  {/* Time Format */}
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Time Format</h4>
                      <p className="text-[10px] text-secondary mt-0.5">Choose how time is displayed across the platform.</p>
                    </div>
                    <div className="flex gap-2 bg-[#f3f3fe] p-1 rounded-lg border border-outline-variant/20">
                      {["12h", "24h"].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => {
                            setPrefTimeFormat(fmt);
                            showToast(`Time format set to ${fmt}`);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            prefTimeFormat === fmt
                              ? "bg-white text-[#191b23] shadow-sm"
                              : "text-secondary hover:text-on-surface"
                          }`}
                        >
                          {fmt === "12h" ? "12-hour" : "24-hour"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Format */}
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Date Format</h4>
                      <p className="text-[10px] text-secondary mt-0.5">Choose your preferred date layout.</p>
                    </div>
                    <select
                      value={prefDateFormat}
                      onChange={(e) => {
                        setPrefDateFormat(e.target.value);
                        showToast("Date format updated");
                      }}
                      className="border border-outline-variant/30 rounded-lg p-2 text-xs bg-white focus:outline-none focus:border-[#004ac6] w-40"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  {/* Sidebar Toggles */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Sidebar Display</h4>
                    
                    {/* Show Team Members */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-on-surface">Show Team Members</h5>
                        <p className="text-[10px] text-secondary mt-0.5">Display active team members in the sidebar.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefShowTeam}
                        onChange={() => {
                          setPrefShowTeam(!prefShowTeam);
                          showToast("Sidebar team display updated");
                        }}
                        className="w-4 h-4 rounded border-outline-variant text-[#004ac6] focus:ring-[#004ac6]/20"
                      />
                    </div>

                    {/* Show Workspace Stats */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-on-surface">Show Workspace Statistics</h5>
                        <p className="text-[10px] text-secondary mt-0.5">Show progress charts in the sidebar.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefShowStats}
                        onChange={() => {
                          setPrefShowStats(!prefShowStats);
                          showToast("Sidebar stats display updated");
                        }}
                        className="w-4 h-4 rounded border-outline-variant text-[#004ac6] focus:ring-[#004ac6]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Backup Section */}
            {activeSection === "data" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Data & Backup</h3>
                  <p className="text-xs text-secondary mt-1">Export your workspace data and configure cloud backups.</p>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-6 shadow-sm">
                  {/* Export Workspace Data */}
                  <div className="space-y-3 pb-6 border-b border-outline-variant/10">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Export Workspace Data</h4>
                      <p className="text-[10px] text-secondary mt-0.5">Download a complete backup of all tasks, projects, and activities.</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleExportJSON}
                        className="px-4 py-2 border border-outline-variant/30 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors text-[#191b23] flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Export JSON
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 border border-outline-variant/30 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors text-[#191b23] flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Cloud Sync & Backup */}
                  <div className="space-y-4 pb-6 border-b border-outline-variant/10">
                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Backup & Sync</h4>
                    
                    {/* Auto Backup */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-on-surface">Automatic Daily Backups</h5>
                        <p className="text-[10px] text-secondary mt-0.5">Automatically back up your workspace every 24 hours.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoBackup}
                        onChange={() => {
                          setAutoBackup(!autoBackup);
                          showToast("Automatic backup updated");
                        }}
                        className="w-4 h-4 rounded border-outline-variant text-[#004ac6] focus:ring-[#004ac6]/20"
                      />
                    </div>

                    {/* Backup Storage Location */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-on-surface">Backup Destination</h5>
                        <p className="text-[10px] text-secondary mt-0.5">Choose where to store your automated backups.</p>
                      </div>
                      <select
                        value={backupLocation}
                        onChange={(e) => {
                          setBackupLocation(e.target.value);
                          showToast("Backup destination updated");
                        }}
                        className="border border-outline-variant/30 rounded-lg p-2 text-xs bg-white focus:outline-none focus:border-[#004ac6] w-40"
                      >
                        <option value="momentum">Momentum Cloud</option>
                        <option value="gdrive">Google Drive</option>
                        <option value="dropbox">Dropbox</option>
                      </select>
                    </div>
                  </div>

                  {/* Danger Zone: Reset Account */}
                  <div className="p-4 border border-red-200 bg-red-50/30 rounded-xl space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-red-700">Reset Account Data</h4>
                      <p className="text-[10px] text-red-600 mt-0.5">Permanently delete all tasks, activities, and custom settings. This action is irreversible.</p>
                    </div>
                    <button
                      onClick={() => showToast("Account reset requested")}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Reset All Data
                    </button>
                  </div>
                </div>
              </div>
            )}



            {/* About Section */}
            {activeSection === "about" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">About Momentum</h3>
                  <p className="text-xs text-secondary mt-1">Product metadata and terms.</p>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-4 shadow-sm text-xs font-semibold text-on-surface-variant">
                  <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                    <div className="w-8 h-8 bg-[#004ac6] rounded-lg flex items-center justify-center text-white">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#191b23]">Momentum Desktop</h4>
                      <p className="text-[10px] text-secondary">Version 2.4.0 (Build 98321)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-1">
                      <span className="text-secondary">License</span>
                      <span>Commercial Enterprise License</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-secondary">Terms of Service</span>
                      <a href="#" className="text-[#004ac6] hover:underline flex items-center gap-0.5">
                        Read Terms <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-secondary">Privacy Policy</span>
                      <a href="#" className="text-[#004ac6] hover:underline flex items-center gap-0.5">
                        Read Privacy <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Help & Support Section */}
            {activeSection === "help" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Help & Support</h3>
                  <p className="text-xs text-secondary mt-1">Submit support tickets, read documentation, or check system status.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Columns: Support Ticket Form */}
                  <div className="lg:col-span-2 bg-white border border-outline-variant/30 rounded-xl p-6 space-y-4 shadow-sm">
                    <h4 className="text-sm font-bold text-on-surface">Contact Support Team</h4>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!ticketSubject || !ticketDesc) return;
                        showToast("Support ticket submitted successfully!");
                        setTicketSubject("");
                        setTicketDesc("");
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant" htmlFor="ticket-subject">
                          Subject
                        </label>
                        <input
                          id="ticket-subject"
                          type="text"
                          required
                          placeholder="Brief summary of the issue"
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-on-surface-variant" htmlFor="ticket-priority">
                            Priority
                          </label>
                          <select
                            id="ticket-priority"
                            value={ticketPriority}
                            onChange={(e) => setTicketPriority(e.target.value)}
                            className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-[#004ac6]"
                          >
                            <option value="Low">Low (General question)</option>
                            <option value="Medium">Medium (Bug report)</option>
                            <option value="High">High (Service blocking)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant" htmlFor="ticket-desc">
                          Description
                        </label>
                        <textarea
                          id="ticket-desc"
                          rows={4}
                          required
                          placeholder="Provide details about what went wrong and how we can reproduce it..."
                          value={ticketDesc}
                          onChange={(e) => setTicketDesc(e.target.value)}
                          className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                      >
                        Submit Ticket
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Resources & Status */}
                  <div className="space-y-6">
                    {/* System Status */}
                    <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-3 shadow-sm">
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">System Status</h4>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-emerald-700">All systems operational</span>
                      </div>
                      <div className="text-[10px] text-secondary space-y-1">
                        <p>API Latency: 12ms (Normal)</p>
                        <p>Server Version: v2.4.2-prod</p>
                      </div>
                    </div>

                    {/* Resources Links */}
                    <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-3 shadow-sm text-xs font-semibold text-on-surface-variant">
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Resources</h4>
                      <a href="#" className="flex justify-between items-center py-2 border-b border-outline-variant/10 hover:text-[#004ac6] transition-colors">
                        <span>Help Documentation</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                      <a href="#" className="flex justify-between items-center py-2 border-b border-outline-variant/10 hover:text-[#004ac6] transition-colors">
                        <span>API & Webhooks Guide</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                      <a href="#" className="flex justify-between items-center py-2 hover:text-[#004ac6] transition-colors">
                        <span>Community Discord</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Right Utility Panel */}
          <aside className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-outline-variant/40 bg-white p-6 flex flex-col gap-6 lg:overflow-y-auto shrink-0 pb-24 lg:pb-6">
            {/* Profile Summary Widget */}
            <div className="flex flex-col items-center text-center border-b border-outline-variant/20 pb-6 gap-2">
              <img
                className="w-12 h-12 rounded-full border border-outline-variant object-cover"
                alt="Profile"
                src={avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCHhkv6g29ueT8Y-pWWudXJhmEk8K5XOF0cFx_TZtn35hNhuXPwTAh5zqv-o_MurmSNDHfOvNoI5y1lSbpibAZXkCPnpOIjipQ06q6RVGCImC9AWZfKF1PclIagemCsxXIj72AiuXUVTxZznj-KQ6uKau-16422hn9d_14ec0vxRcH1PVBLY4KXR0g7YeXsOVDtVtFs_dxhsINObxL0xFFl7KRvMCCdZcAUtoANvfDWUMz5FKBcondpzoOMAlDxK2n0DX0x5it-BBE"}
              />
              <div>
                <h4 className="text-xs font-bold text-[#191b23]">{fullName}</h4>
                <p className="text-[10px] text-secondary mt-0.5">{role}</p>
              </div>
            </div>

            {/* Storage Usage Widget */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                <span>Storage Used</span>
                <span>24.5 GB / 100 GB</span>
              </div>
              <div className="w-full bg-[#f3f3fe] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#004ac6] h-full" style={{ width: "24.5%" }}></div>
              </div>
            </div>

            {/* Security Score Widget */}
            <div className="border border-outline-variant/30 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-1.5 text-secondary text-xs font-semibold">
                <Shield className="w-4 h-4 text-[#004ac6]" />
                <span>Security Score</span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[#191b23]">92%</span>
                <span className="text-[10px] text-emerald-600 font-bold">Excellent</span>
              </div>
            </div>

            {/* Keyboard Shortcut Tip */}
            <div className="border border-outline-variant/30 rounded-xl p-4 bg-[#f3f3fe]/50 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Pro Tip</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Press <kbd className="bg-white border border-outline-variant/40 px-1 rounded text-[9px] font-bold font-mono">Cmd</kbd> + <kbd className="bg-white border border-outline-variant/40 px-1 rounded text-[9px] font-bold font-mono">/</kbd> anywhere to hide/show the main sidebar!
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#191b23] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-outline/20 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
