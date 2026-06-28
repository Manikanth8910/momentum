import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { apiFetch } from "../lib/api";
import { usePersistentState } from "../hooks/usePersistentState";
import { useAuthGuard } from "../hooks/useAuthGuard";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Momentum | Productivity Analytics" },
      { name: "description", content: "Real-time performance metrics and focus trends." },
    ],
  }),
  component: Analytics,
});

// Fallback static focus data
const defaultFocusData = [
  { name: "Mon", hours: 4 },
  { name: "Tue", hours: 6.5 },
  { name: "Wed", hours: 3 },
  { name: "Thu", hours: 5.5 },
  { name: "Fri", hours: 8 },
  { name: "Sat", hours: 2 },
  { name: "Sun", hours: 4.5 },
];

function Analytics() {
  useAuthGuard();
  const [timeRange, setTimeRange] = useState<"7days" | "30days">("7days");
  const [heatmapCells, setHeatmapCells] = useState<string[][]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, velocity: "0%" });
  const [isLoading, setIsLoading] = useState(true);
  const [focusData] = usePersistentState("focusData", defaultFocusData);

  // Fetch real task data for analytics
  useEffect(() => {
    apiFetch("/tasks").then(r => r.json()).then(data => {
      if (data.success && Array.isArray(data.data?.tasks)) {
        const tasks = data.data.tasks;
        const high = tasks.filter((t: any) => t.priority === "High").length;
        const medium = tasks.filter((t: any) => t.priority === "Medium").length;
        const low = tasks.filter((t: any) => t.priority === "Low").length;
        const total = tasks.length || 1;
        setPriorityData([
          { name: "High Priority", value: Math.round((high / total) * 100) || 0, color: "#004ac6" },
          { name: "Medium Priority", value: Math.round((medium / total) * 100) || 0, color: "#585f6c" },
          { name: "Low Priority", value: Math.round((low / total) * 100) || 0, color: "#c3c6d7" },
        ]);
        const completed = tasks.filter((t: any) => t.status === "Completed").length;
        const velocity = total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";
        setTaskStats({ total, completed, velocity });
      }
    }).catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Generate simulated heatmap colors on mount
  useEffect(() => {
    const colors = [
      "bg-[#f3f3fe]", // Less
      "bg-[#004ac6]/10",
      "bg-[#004ac6]/30",
      "bg-[#004ac6]/60",
      "bg-[#004ac6]", // More
    ];

    const grid = Array(24)
      .fill(0)
      .map((_, i) =>
        Array(7)
          .fill(0)
          .map((_, j) => colors[(i * 13 + j * 7 + 3) % colors.length])
      );

    setHeatmapCells(grid);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-body-md">
      {/* Sidebar */}
      <Sidebar activePage="insights" />

      {/* Main Content Canvas */}
      <main className="flex-1 lg:ml-64 min-h-screen p-4 md:p-8 max-w-[1400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full min-h-[50vh]">
            <div className="w-8 h-8 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Top Bar */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">Productivity Analytics</h2>
            <p className="text-sm text-on-surface-variant">Real-time performance metrics and focus trends.</p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex bg-[#f3f3fe] p-[4px] rounded-lg border border-outline-variant">
              <button onClick={() => setTimeRange("7days")} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${timeRange === "7days" ? "bg-white shadow-sm text-[#004ac6]" : "text-on-surface-variant hover:text-on-surface"}`}>7 Days</button>
              <button onClick={() => setTimeRange("30days")} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${timeRange === "30days" ? "bg-white shadow-sm text-[#004ac6]" : "text-on-surface-variant hover:text-on-surface"}`}>30 Days</button>
            </div>
            <button disabled title="Planned for a future release" className="flex items-center gap-1 px-3 py-2 bg-white border border-outline-variant rounded-lg transition-colors text-sm font-semibold opacity-50 cursor-not-allowed">
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </header>

        {/* Summary Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Weekly Task Velocity Card */}
          <div className="col-span-1 md:col-span-2 bg-white border border-outline-variant rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Weekly Task Velocity
                </p>
                <h3 className="text-4xl font-bold leading-none">{taskStats.total > 0 ? taskStats.velocity : "—"}</h3>
                <p className="text-xs text-[#004ac6] mt-3 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  +12% from last week
                </p>
              </div>
              <div className="w-48 h-16">
                <svg className="w-full h-full" viewBox="0 0 200 60">
                  <path
                    d="M0,50 Q20,20 40,40 T80,10 T120,45 T160,20 T200,30"
                    fill="none"
                    stroke="#004ac6"
                    strokeWidth="2.5"
                  ></path>
                  <path
                    d="M0,50 Q20,20 40,40 T80,10 T120,45 T160,20 T200,30 V60 H0 Z"
                    fill="url(#grad1)"
                    opacity="0.1"
                  ></path>
                  <defs>
                    <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: "#004ac6", stopOpacity: 1 }}></stop>
                      <stop offset="100%" style={{ stopColor: "#004ac6", stopOpacity: 0 }}></stop>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Avg. Focus Session */}
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Avg. Focus Session
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-bold">42</h3>
              <span className="text-sm text-on-surface-variant">min</span>
            </div>
            <div className="mt-4 h-1.5 bg-[#f3f3fe] rounded-full overflow-hidden">
              <div className="h-full bg-[#004ac6] w-[70%]" style={{ width: "70%" }}></div>
            </div>
            <p className="text-xs text-on-surface-variant mt-3">Goal: 60 min session</p>
          </div>

          {/* Active Projects */}
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Active Projects
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-bold">12</h3>
              <span className="text-sm text-on-surface-variant">across 3 teams</span>
            </div>
            <div className="flex -space-x-2 mt-4">
              {[
                "https://lh3.googleusercontent.com/aida-public/AB6AXuAUFHqm5MdDh3J5ahWxeZaLzUKJ378LCuKpvtm7OBUbnAWAjgrn4VDcxFQo2IjhFjV7RndnitxfW9JFH3eE-Oq-zd9KRY6wxpHzaropPnuOk5eA49PdJitDQn-c37SYAIgzYVKRf5UCbTywFr04IsUnqciszhif7CZN51bulXiFJdTwD1Z-zZ29h0BCjbkJoG2CYRT-vkmOc77sDVfJoHTvGlkYRhYlIufA0bJKDjggX1Qo4skSF1obiDV5zRnEEJYAwKlxNmhI7Dw",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDYrfJKzQgfhKIImZjAE42UerW_QWC30_sYdIKgD_YsldIxZnrmrUwSlUen4tA6E8_8iKM-LEYLuoENZ4okWThAWfE9815672qBuFcPGx4FXhEi0AM8Eei3fwKMugEtz59vmfPqRcvCop-IIxWWA3P27N9a_y6a-UkKYvf30hjb46sm9pLOIJN4HS2KPYiMeMuPHZAG0_8owRb-IvihPanl-ZXeASPfmkKXiElpODizLYGWPTsmqkHWDX5fWKG_qtA02dp7zRcw618",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDrb-pkiekWIIE1rXd5fISBU6oEKiTbPtaSdPsLIEGX3vBCVaVSAmHOE_RJjWRQgEzrObQ0pQ6KToqAkNIgzau42vkObpbWHrTaTBR65r7TDeFf915TZdS9BbJPyicEoo9yxZQx_fWSg38dRXS3dN2NP2u01sz03Cnn3HM5Y5yeB07Z98FQDiOYkjGA-PnSSG_dq0PZmUpgDXc_elu5tnU85tBx5HvxotLixtn89lWmqOQh8koMOyuN42FgAM6Cna0_KcDIqA-UQtQ",
              ].map((src, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-[#e1e2ed]"
                >
                  <img className="w-full h-full object-cover" alt="Team member" src={src} />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-[#f3f3fe] flex items-center justify-center text-xs font-bold text-[#004ac6]">
                +9
              </div>
            </div>
          </div>
        </section>

        {/* Main Chart & Donut Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Focus Time Trends: Large Chart */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-lg font-bold">Focus Time Trends</h4>
                <p className="text-sm text-on-surface-variant">Aggregated deep work hours per day.</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]"></span>
                  <span className="text-xs font-medium">This Period</span>
                </div>
              </div>
            </div>

            {/* Recharts Line Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={focusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#737686" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#191b23",
                      color: "#ffffff",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#004ac6"
                    strokeWidth={3}
                    dot={{ fill: "#004ac6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Distribution Donut */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center shadow-sm">
            <h4 className="text-lg font-bold self-start mb-6">Priority Dist.</h4>
            <div className="relative w-44 h-44 mb-6 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-on-surface">124</span>
                <span className="text-xs text-on-surface-variant">Total Tasks</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              {priorityData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span>{item.name}</span>
                  </div>
                  <span className="text-on-surface-variant">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Task Distribution & Heatmap Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Task Distribution Grid */}
          <div className="col-span-1 bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-bold mb-4">Task Distribution</h4>
            <div className="space-y-4">
              {[
                { label: "UI Design", time: "32h", percent: "80%" },
                { label: "Research", time: "12h", percent: "40%" },
                { label: "Documentation", time: "8h", percent: "25%" },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1 text-xs font-semibold">
                    <span>{item.label}</span>
                    <span className="text-on-surface-variant">{item.time}</span>
                  </div>
                  <div className="h-1 bg-[#f3f3fe] rounded-full overflow-hidden">
                    <div className="h-full bg-[#004ac6]" style={{ width: item.percent }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-outline-variant">
              <p className="text-sm font-semibold text-on-surface-variant mb-4">Top Project Contributors</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#e1e2ed] border border-outline-variant flex items-center justify-center text-xs font-bold">
                      DS
                    </div>
                    <span className="text-xs font-semibold">Design System v2</span>
                  </div>
                  <span className="material-symbols-outlined text-[#004ac6] text-[18px]">bolt</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#e1e2ed] border border-outline-variant flex items-center justify-center text-xs font-bold">
                      UR
                    </div>
                    <span className="text-xs font-semibold">User Flow Research</span>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[18px]">history</span>
                </div>
              </div>
            </div>
          </div>

          {/* Productivity Heatmap */}
          <div className="col-span-1 md:col-span-2 bg-white border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold">Productivity Heatmap</h4>
                <span className="text-xs text-on-surface-variant">Aug 2023 - Jan 2024</span>
              </div>
              <div className="overflow-x-auto pb-2 scrollbar-none">
                <div className="flex gap-1 min-w-max">
                  {heatmapCells.map((col, cIdx) => (
                    <div key={cIdx} className="flex flex-col gap-1">
                      {col.map((cellClass, rIdx) => (
                        <div key={rIdx} className={`w-3 h-3 rounded-[2px] ${cellClass}`} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-on-surface-variant">Less</p>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-[2px] bg-[#f3f3fe]"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-[#004ac6]/10"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-[#004ac6]/30"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-[#004ac6]/60"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-[#004ac6]"></div>
                  </div>
                  <p className="text-xs text-on-surface-variant">More</p>
                </div>
                <div className="text-xs text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Activity levels based on focus duration & task completions
                </div>
              </div>

              {/* Bento-style extra info */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#f3f3fe] rounded-lg border border-outline-variant/30">
                  <p className="text-xs text-on-surface-variant mb-1">Longest Streak</p>
                  <div className="flex items-center gap-2">
                    <h5 className="text-lg font-bold">24 Days</h5>
                    <span className="material-symbols-outlined text-[#004ac6]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      local_fire_department
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-[#f3f3fe] rounded-lg border border-outline-variant/30">
                  <p className="text-xs text-on-surface-variant mb-1">Consistency Score</p>
                  <div className="flex items-center gap-2">
                    <h5 className="text-lg font-bold">92%</h5>
                    <span className="material-symbols-outlined text-secondary">verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        </>
        )}
      </main>

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#1e222b] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold z-50 animate-in slide-in-from-bottom-3 duration-300">
          {toast}
        </div>
      )}
    </div>
  );
}
