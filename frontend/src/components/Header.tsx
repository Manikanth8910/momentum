import { useState, useEffect } from "react";
import { Zap, Search } from "lucide-react";
import { apiFetch } from "../lib/api";

export default function Header() {
  const [searchFocused, setSearchFocused] = useState(false);
  // Start null to match SSR — cache loaded in useEffect to avoid hydration mismatch
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Load from localStorage cache first (client-only, safe after hydration)
    try {
      const cached = localStorage.getItem("cachedUser");
      if (cached) setUser(JSON.parse(cached));
    } catch (_) {}

    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await apiFetch("/auth/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
          localStorage.setItem("cachedUser", JSON.stringify(data.data));
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  const defaultAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuCHhkv6g29ueT8Y-pWWudXJhmEk8K5XOF0cFx_TZtn35hNhuXPwTAh5zqv-o_MurmSNDHfOvNoI5y1lSbpibAZXkCPnpOIjipQ06q6RVGCImC9AWZfKF1PclIagemCsxXIj72AiuXUVTxZznj-KQ6uKau-16422hn9d_14ec0vxRcH1PVBLY4KXR0g7YeXsOVDtVtFs_dxhsINObxL0xFFl7KRvMCCdZcAUtoANvfDWUMz5FKBcondpzoOMAlDxK2n0DX0x5it-BBE";

  const [searchVal, setSearchVal] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Quick task states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"High" | "Medium" | "Low">("Medium");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    window.dispatchEvent(new CustomEvent("taskSearch", { detail: val }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
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
          labels: ["Quick Add"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Task created successfully!");
        // Dispatch event so Kanban/Workspace pages reload their task lists
        window.dispatchEvent(new Event("taskCreated"));
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDesc("");
        setNewPriority("Medium");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to create task");
    }
  };

  return (
    <header className="flex justify-between items-center w-full px-4 lg:px-8 h-16 sticky top-0 z-40 bg-white border-b border-outline-variant/30">
      {/* Search Bar */}
      <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
        <button
          onClick={() => window.dispatchEvent(new Event("toggleSidebar"))}
          className="lg:hidden p-2 text-on-surface-variant hover:bg-[#f3f3fe] rounded-full transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div
          className={`relative w-full max-w-md transition-all rounded-lg ${
            searchFocused ? "ring-2 ring-[#004ac6]/20" : ""
          }`}
        >
          <span className="hidden sm:block material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
            search
          </span>
          <input
            className="hidden sm:block w-full pl-10 pr-4 py-2 bg-[#f3f3fe] border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-[#004ac6] transition-all"
            placeholder="Search tasks, docs, or files..."
            type="text"
            value={searchVal}
            onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {/* Mobile: icon-only search trigger */}
          <button
            className="sm:hidden p-2 text-on-surface-variant hover:bg-[#f3f3fe] rounded-full transition-colors"
            onClick={() => showToast("Search coming soon on mobile!")}
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
        <div className="hidden lg:block ml-4 border-l border-outline-variant/30 pl-4">
          <button
            onClick={() => window.location.href = "mailto:support@momentum.app"}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/30 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors text-secondary"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Give Feedback
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsProfileOpen(false);
              }}
              className="p-2 text-on-surface-variant hover:bg-[#f3f3fe] rounded-full transition-colors relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
            </button>
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-outline-variant/30 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-outline-variant/10 flex justify-between items-center">
                  <span className="font-bold text-xs">Notifications</span>
                  <button onClick={() => setIsNotifOpen(false)} className="text-[10px] text-[#004ac6] hover:underline font-semibold">
                    Mark all as read
                  </button>
                </div>
                <div className="divide-y divide-outline-variant/10 max-h-64 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-50 transition-colors flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#004ac6] mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-on-surface">Sarah Chen mentioned you in a comment</p>
                      <p className="text-[10px] text-secondary mt-0.5">2 hours ago</p>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition-colors flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#004ac6] mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-on-surface">Jordan Miller uploaded v2.4_Assets_Package.zip</p>
                      <p className="text-[10px] text-secondary mt-0.5">12 minutes ago</p>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition-colors flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-on-surface text-secondary">Sprint Q4 has been started</p>
                      <p className="text-[10px] text-secondary mt-0.5">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Create Task */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="p-2 text-on-surface-variant hover:bg-[#f3f3fe] rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">add_circle</span>
          </button>
        </div>

        <div className="md:hidden">
          <button
            disabled
            className="p-2 bg-[#f3f3fe] text-[#004ac6] rounded-xl hover:bg-[#e6e8fc] transition-colors relative cursor-not-allowed opacity-50 group"
          >
            <Search className="w-4 h-4" />
            <div className="absolute top-10 right-0 w-32 bg-[#191b23] text-white text-[10px] py-1 px-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50 pointer-events-none">
              Planned for a future release
            </div>
          </button>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <div
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant cursor-pointer hover:border-[#004ac6] transition-all"
          >
            <img
              className="w-full h-full object-cover"
              alt="User profile"
              src={user?.avatar || defaultAvatar}
            />
          </div>
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-outline-variant/30 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-xs font-medium">
              <div className="px-3 py-2 border-b border-outline-variant/10">
                <p className="font-bold text-on-surface">{user?.name || ""}</p>
                <p className="text-[10px] text-secondary truncate">{user?.email || ""}</p>
              </div>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  window.location.href = "/settings?section=profile";
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors text-on-surface-variant flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">account_circle</span>
                My Profile
              </button>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  window.location.href = "/settings?section=appearance";
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors text-on-surface-variant flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">palette</span>
                Appearance
              </button>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  window.location.href = "/settings?section=general";
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors text-on-surface-variant flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                Settings
              </button>
              <div className="h-px bg-outline-variant/10 my-1"></div>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  localStorage.removeItem("token");
                  localStorage.removeItem("cachedUser");
                  window.location.href = "/login";
                }}
                className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Create Task Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-on-surface">Quick Create Task</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="quick-title">
                  Task Title
                </label>
                <input
                  id="quick-title"
                  type="text"
                  required
                  placeholder="e.g., Fix database connection pool leak"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="quick-desc">
                  Description
                </label>
                <textarea
                  id="quick-desc"
                  rows={3}
                  placeholder="Describe the objective and requirements..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="quick-priority">
                  Priority
                </label>
                <select
                  id="quick-priority"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-[#004ac6]"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg font-bold shadow-sm transition-all text-xs mt-2"
              >
                Create Task
              </button>
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
    </header>
  );
}
