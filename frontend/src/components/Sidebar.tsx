import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface SidebarProps {
  activePage: "dashboard" | "tasks" | "calendar" | "insights" | "workspace" | "settings";
}

export default function Sidebar({ activePage }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggleSidebar", handleToggle);
    return () => window.removeEventListener("toggleSidebar", handleToggle);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) return;
    showToast(`Project "${projectName}" created successfully!`);
    setIsNewProjectOpen(false);
    setProjectName("");
    setProjectDesc("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={`flex flex-col w-64 h-screen fixed left-0 top-0 z-50 p-6 bg-[#f3f3fe] border-r border-outline-variant transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="mb-8 px-2 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#004ac6] rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface leading-none">Momentum</h1>
            <p className="text-xs font-semibold text-secondary">Pro Plan</p>
          </div>
        </div>

        {/* New Project Button */}
        <button
          onClick={() => setIsNewProjectOpen(true)}
          className="mb-6 w-full py-2 px-4 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Project
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 hover:translate-x-1 ${
              activePage === "dashboard"
                ? "text-[#004ac6] font-bold bg-[#004ac6]/5 translate-x-1"
                : "text-on-secondary-container hover:bg-[#e1e2ed]"
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>

          <Link
            to="/kanban"
            className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 hover:translate-x-1 ${
              activePage === "tasks"
                ? "text-[#004ac6] font-bold bg-[#004ac6]/5 translate-x-1"
                : "text-on-secondary-container hover:bg-[#e1e2ed]"
            }`}
          >
            <span className="material-symbols-outlined">checklist</span>
            <span className="text-sm font-medium">Tasks</span>
          </Link>

          <Link
            to="/calendar"
            className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 hover:translate-x-1 ${
              activePage === "calendar"
                ? "text-[#004ac6] font-bold bg-[#004ac6]/5 translate-x-1"
                : "text-on-secondary-container hover:bg-[#e1e2ed]"
            }`}
          >
            <span className="material-symbols-outlined">calendar_today</span>
            <span className="text-sm font-medium">Calendar</span>
          </Link>

          <Link
            to="/analytics"
            className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 hover:translate-x-1 ${
              activePage === "insights"
                ? "text-[#004ac6] font-bold bg-[#004ac6]/5 translate-x-1"
                : "text-on-secondary-container hover:bg-[#e1e2ed]"
            }`}
          >
            <span className="material-symbols-outlined">analytics</span>
            <span className="text-sm font-medium">Insights</span>
          </Link>

          <Link
            to="/workspace"
            className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 hover:translate-x-1 ${
              activePage === "workspace"
                ? "text-[#004ac6] font-bold bg-[#004ac6]/5 translate-x-1"
                : "text-on-secondary-container hover:bg-[#e1e2ed]"
            }`}
          >
            <span className="material-symbols-outlined">workspaces</span>
            <span className="text-sm font-medium">Workspace</span>
          </Link>

          <Link
            to="/settings"
            className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 hover:translate-x-1 ${
              activePage === "settings"
                ? "text-[#004ac6] font-bold bg-[#004ac6]/5 translate-x-1"
                : "text-on-secondary-container hover:bg-[#e1e2ed]"
            }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              showToast("Help Center documentation is loading...");
            }}
            className="flex items-center gap-4 px-4 py-2 text-on-secondary-container hover:bg-[#e1e2ed] rounded-lg transition-all duration-200"
          >
            <span className="material-symbols-outlined">help</span>
            <span className="text-sm font-medium">Help Center</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-2 text-on-secondary-container hover:bg-[#e1e2ed] rounded-lg transition-all duration-200 text-left"
          >
            <span className="material-symbols-outlined text-error">logout</span>
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* New Project Modal */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 text-xs font-medium">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-on-surface">Create New Project</h3>
              <button onClick={() => setIsNewProjectOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="project-name">
                  Project Name
                </label>
                <input
                  id="project-name"
                  type="text"
                  required
                  placeholder="e.g., Mobile Client App"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="project-desc">
                  Description
                </label>
                <textarea
                  id="project-desc"
                  rows={3}
                  placeholder="Summarize the project goals..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg font-bold shadow-sm transition-all text-xs mt-2"
              >
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#1e222b] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold z-50 animate-in slide-in-from-bottom-3 duration-300">
          {toast}
        </div>
      )}
    </>
  );
}
