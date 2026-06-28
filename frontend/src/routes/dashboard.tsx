import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { apiFetch } from "../lib/api";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { usePersistentState } from "../hooks/usePersistentState";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Momentum Dashboard | Workspace" },
      { name: "description", content: "Your daily productivity overview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  useAuthGuard();
  const [notes, setNotes] = useState("");
  // Start with null — same on SSR and client to avoid hydration mismatch
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<"All" | "Updates" | "Mentions">("All");
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, percentage: 0 });
  const [dashboardStats, setDashboardStats] = useState([
    { icon: "timer", label: "Focus Time", val: "0h", change: "-", color: "text-emerald-500" },
    { icon: "done_all", label: "Tasks Completed", val: "0", change: "-", color: "text-emerald-500" },
    { icon: "bolt", label: "Efficiency", val: "0%", change: "-", color: "text-error" },
    { icon: "calendar_month", label: "Deep Work Streak", val: "0 Days", change: "-", color: "text-outline" },
  ]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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

    const fetchDashboardData = async () => {
      try {
        const [activityRes, tasksRes] = await Promise.all([
          apiFetch("/recent-actions").catch(() => null),
          apiFetch("/tasks").catch(() => null)
        ]);

        if (activityRes) {
          const activityData = await activityRes.json();
          if (activityData.success && Array.isArray(activityData.data)) {
            setTimelineItems(activityData.data.map((act: any, idx: number) => ({
              id: act._id || idx.toString(),
              type: act.action.toLowerCase().includes("upload") ? "upload" : 
                    act.action.toLowerCase().includes("comment") ? "comment" : "complete",
              icon: act.action.toLowerCase().includes("upload") ? "cloud_upload" : 
                    act.action.toLowerCase().includes("comment") ? "forum" : "check_circle",
              user: act.performedBy?.name || "User",
              action: act.action,
              target: act.task,
              time: new Date(act.timestamp).toLocaleDateString(),
              color: act.action.toLowerCase().includes("complete") 
                ? "text-emerald-600 bg-emerald-500/10" 
                : "text-primary bg-[#004ac6]/10",
              completed: act.action.toLowerCase().includes("complete")
            })));
          }
        }

        if (tasksRes) {
          const tasksData = await tasksRes.json();
          if (tasksData.success && Array.isArray(tasksData.data?.tasks)) {
            const tasks = tasksData.data.tasks;
            const total = tasks.length || 1;
            const completed = tasks.filter((t: any) => t.status === "Completed").length;
            const eff = Math.round((completed / total) * 100) || 0;
            setTaskStats({
              total: tasks.length,
              completed,
              percentage: eff
            });
            setDashboardStats([
              { icon: "timer", label: "Focus Time", val: (completed * 1.5) + "h", change: "Stable", color: "text-emerald-500" },
              { icon: "done_all", label: "Tasks Completed", val: completed.toString(), change: "Stable", color: "text-emerald-500" },
              { icon: "bolt", label: "Efficiency", val: eff + "%", change: "Stable", color: "text-error" },
              { icon: "calendar_month", label: "Deep Work Streak", val: Math.min(completed, 5) + " Days", change: "Stable", color: "text-outline" },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    fetchDashboardData();
  }, []);



  return (
    <div className="flex min-h-screen bg-surface text-on-surface font-body-md">
      {/* Sidebar */}
      <Sidebar activePage="dashboard" />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <Header />

        {/* Dashboard Body */}
        <main className="p-4 md:p-8 max-w-[1400px] mx-auto w-full space-y-6 md:space-y-8 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
              <div className="w-8 h-8 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Page Header */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-on-surface leading-none tracking-tight">
                Good Morning{user?.name ? `, ${user.name}` : ""}
              </h2>
              <p className="text-sm md:text-lg text-on-surface-variant mt-2">
                Ready to finish the week strong? You're almost there.
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center gap-4 w-full md:min-w-[300px] md:w-auto">
              <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle className="stroke-surface-container-highest" cx="18" cy="18" fill="none" r="16" strokeWidth="3"></circle>
                  <circle className="stroke-[#004ac6]" cx="18" cy="18" fill="none" r="16" strokeDasharray="100" strokeDashoffset="16" strokeLinecap="round" strokeWidth="3"></circle>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#004ac6]">
                  {taskStats.percentage}%
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Daily Goal Progress</p>
                <p className="text-sm text-secondary">{taskStats.completed} of {taskStats.total || 6} tasks completed</p>
              </div>
            </div>
          </section>

          {/* Hero & Focus Card Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 relative overflow-hidden rounded-2xl bg-[#2b303c] p-8 text-white shadow-xl border border-white/5">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-[#1e52cc] text-white text-[10px] font-bold rounded uppercase tracking-wider">
                    Active Sprint
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Project: Apollo Phase II
                  </span>
                </div>
                <h3 className="text-3xl font-bold tracking-tight mb-2">Refine Design System Architecture</h3>
                <p className="text-sm text-slate-300/90 leading-relaxed max-w-xl mb-8">
                  Standardizing token structures for cross-platform compatibility and high-density performance optimization.
                </p>
                <div className="flex flex-col gap-2 mb-8">
                  <div className="flex justify-between text-xs font-semibold text-slate-200">
                    <span>Session Progress</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#94b3ff] w-[65%] rounded-full"></div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => navigate({ to: "/kanban" })} className="px-5 py-2 bg-[#dbe4ff] hover:bg-[#c7d7ff] text-[#002266] font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    Continue
                  </button>
                  <button onClick={() => navigate({ to: "/workspace" })} className="px-4 py-2 border border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-semibold text-xs rounded-lg transition-all">
                    View Details
                  </button>
                </div>
              </div>
              {/* Concentric Flowing Waves */}
              <svg className="absolute right-0 top-0 h-full w-full object-cover opacity-25 pointer-events-none" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M300 400C350 280 480 200 600 250C720 300 780 150 800 0" stroke="white" strokeWidth="1.5" />
                <path d="M280 400C330 270 460 180 580 230C700 280 760 130 780 0" stroke="white" strokeWidth="1" />
                <path d="M260 400C310 260 440 160 560 210C680 260 740 110 760 0" stroke="white" strokeWidth="0.75" />
                <path d="M240 400C290 250 420 140 540 190C660 240 720 90 740 0" stroke="white" strokeWidth="0.5" />
                <path d="M320 400C370 290 500 220 620 270C740 320 800 170 820 0" stroke="white" strokeWidth="2" />
                <path d="M340 400C390 300 520 240 640 290C760 340 820 190 840 0" stroke="white" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Right Column: Mini Calendar & Quick Notes */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              {/* Mini Calendar */}
              <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-on-surface">September 2024</h4>
                  <div className="flex gap-1">
                    <button onClick={() => showToast("Previous month...")} className="p-1 hover:bg-[#e1e2ed] rounded-md transition-colors">
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button onClick={() => showToast("Next month...")} className="p-1 hover:bg-[#e1e2ed] rounded-md transition-colors">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                    <span key={idx} className="text-xs font-semibold text-secondary">
                      {day}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  <span className="py-1 text-sm text-secondary opacity-40">28</span>
                  <span className="py-1 text-sm text-secondary opacity-40">29</span>
                  <span className="py-1 text-sm text-secondary opacity-40">30</span>
                  <span className="py-1 text-sm text-secondary opacity-40">31</span>
                  <span className="py-1 text-sm font-medium">1</span>
                  <span className="py-1 text-sm font-medium">2</span>
                  <span className="py-1 text-sm font-medium">3</span>
                  <span className="py-1 text-sm font-medium">4</span>
                  <span className="py-1 text-sm font-medium">5</span>
                  <span className="py-1 text-sm font-medium">6</span>
                  <span className="py-1 text-sm font-medium bg-[#004ac6]/10 text-[#004ac6] rounded-lg border border-[#004ac6]/20">
                    7
                  </span>
                  <span className="py-1 text-sm font-medium">8</span>
                  <span className="py-1 text-sm font-medium">9</span>
                  <span className="py-1 text-sm font-medium">10</span>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-secondary uppercase tracking-tight">
                    Today's Schedule
                  </p>
                  <div className="p-2 bg-[#f3f3fe] rounded-lg border-l-2 border-[#004ac6]">
                    <p className="text-sm font-semibold text-on-surface">Design Review</p>
                    <p className="text-xs text-secondary">11:00 AM — 12:30 PM</p>
                  </div>
                </div>
              </div>

              {/* Quick Notes */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-on-surface">Quick Notes</h4>
                  <button disabled title="Planned for a future release" className="material-symbols-outlined text-[18px] text-outline cursor-not-allowed opacity-50 focus:outline-none">
                    edit_note
                  </button>
                </div>
                <textarea
                  className="w-full bg-[#f3f3fe] border-none rounded-lg text-sm text-on-surface-variant p-3 resize-none focus:ring-1 focus:ring-[#004ac6] h-24 placeholder:text-outline/50"
                  placeholder="Jot down a quick thought..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
          </section>

          {/* Main Grid: Timeline & Focus Stats */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Activity Timeline */}
            <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg md:text-xl font-bold text-on-surface">Activity Timeline</h4>
                <div className="flex gap-1 overflow-x-auto">
                  <button onClick={() => setTimelineFilter("All")} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${timelineFilter === "All" ? "bg-[#e1e2ed] text-on-surface" : "text-secondary hover:text-on-surface"}`}>All</button>
                  <button onClick={() => setTimelineFilter("Updates")} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${timelineFilter === "Updates" ? "bg-[#e1e2ed] text-on-surface" : "text-secondary hover:text-on-surface"}`}>Updates</button>
                  <button onClick={() => setTimelineFilter("Mentions")} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${timelineFilter === "Mentions" ? "bg-[#e1e2ed] text-on-surface" : "text-secondary hover:text-on-surface"}`}>Mentions</button>
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {timelineItems.filter(item => {
                  if (timelineFilter === "All") return true;
                  if (timelineFilter === "Updates") return item.type !== "comment";
                  if (timelineFilter === "Mentions") return item.type === "comment";
                  return true;
                }).map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.color}`}>
                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                      </div>
                      <div className="w-px flex-1 bg-outline-variant my-1 group-last:hidden"></div>
                    </div>
                    <div className="pb-6 flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-on-surface">
                          <span className="font-bold">{item.user}</span> {item.action}{" "}
                          {item.target && (
                            <span
                              className={`text-[#004ac6] cursor-pointer hover:underline ${
                                item.completed ? "line-through text-outline" : ""
                              }`}
                            >
                              {item.target}
                            </span>
                          )}
                        </p>
                        <span className="text-xs text-outline">{item.time}</span>
                      </div>
                      {item.project && (
                        <p className="text-[10px] text-secondary truncate">{item.project}</p>
                      )}
                      {item.detail && (
                        <div className="mt-2 p-3 bg-[#f3f3fe] border border-outline-variant rounded-lg italic text-sm text-on-surface-variant">
                          {item.detail}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bento Grid / Stats Context */}
            <div className="lg:col-span-4 grid grid-rows-2 gap-8">
              <div className="bg-[#e1e2ed]/30 border border-outline-variant rounded-2xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div
                  className="w-full h-full absolute inset-0 bg-cover bg-center opacity-10 rounded-2xl"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA8XjHQkUVByH5RzxQuOV3bHd2QQJm6e6LLu3z8dNyFBIYLZ08X7czjr2cCtoZxoll3YFrWVfNiqmabAV5UlvKV36AX1xGFke8lY7q6kjmJ7EcSTxMADYMKMeHSpJrfLkFk_XBkn0GHKILQvL8_SARxIAsxI1WMDBd8vahQCCXsTcMAu0-5LvmeXYYDdO_vVbg3oJDYjJqQc2vTex50SvBSbd-DEPxyMsdINYQjRN_K_ownBNJK_WF1cXgatANKi8UFPfHt9qg9VBM')`,
                  }}
                ></div>
                <span className="material-symbols-outlined text-[48px] text-[#004ac6] mb-4 relative z-10">
                  rocket_launch
                </span>
                <h4 className="text-lg font-bold text-on-surface relative z-10">Momentum Insights</h4>
                <p className="text-sm text-on-surface-variant max-w-xs mt-1 relative z-10">
                  Your peak productivity window today was between{" "}
                  <span className="font-bold text-[#004ac6]">9:30 AM</span> and{" "}
                  <span className="font-bold text-[#004ac6]">11:15 AM</span>.
                </p>
                <button disabled title="Planned for a future release" className="mt-4 text-sm font-bold text-[#004ac6] opacity-50 cursor-not-allowed relative z-10 transition-colors">
                  View Weekly Report
                </button>
              </div>

              <div className="bg-[#004ac6] text-white rounded-2xl p-4 flex flex-col justify-between overflow-hidden relative">
                <div className="relative z-10">
                  <p className="text-xs font-semibold opacity-80 uppercase tracking-widest">Focus Level</p>
                  <h4 className="text-4xl font-bold leading-none mt-1">High</h4>
                  <p className="text-sm mt-2 opacity-90">
                    Deep work mode is currently enabled. System notifications are silenced.
                  </p>
                </div>
                <div className="relative z-10 flex items-center justify-between mt-4">
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Auto-mute Active</span>
                  <span className="material-symbols-outlined">do_not_disturb_on</span>
                </div>
                {/* Abstract decoration */}
                <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              </div>
            </div>
          </section>

          {/* Footer: Minimal Stat Cards */}
          <footer className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 pt-4 md:pt-6 border-t border-outline-variant">
            {dashboardStats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-[#004ac6] text-[20px]">{stat.icon}</span>
                  <span className={`${stat.color} text-xs font-semibold flex items-center`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-xs font-semibold text-secondary mt-2">{stat.label}</p>
                <p className="text-xl font-bold text-on-surface">{stat.val}</p>
              </div>
            ))}
          </footer>
          </>
          )}
        </main>
      </div>

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#1e222b] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold z-50 animate-in slide-in-from-bottom-3 duration-300">
          {toast}
        </div>
      )}
    </div>
  );
}
