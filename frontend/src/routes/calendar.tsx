import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  X,
  Trash2,
  Edit2,
  CalendarRange,
  ListTodo,
  Play,
  Bookmark,
  FileText,
  User,
} from "lucide-react";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Momentum Calendar | High-Performance Scheduling" },
      { name: "description", content: "Notion and Linear style productivity calendar." },
    ],
  }),
  component: CalendarPage,
});

interface Event {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  duration: string;
  tags: string[];
  comments: { id: string; author: string; text: string; time: string }[];
  attachments: string[];
  assignee?: string;
}

const INITIAL_EVENTS: Event[] = [
  {
    id: "1",
    title: "Refactor Authentication Middleware",
    description: "Consolidate redundant JWT checks and implement OAuth2 PKCE flow for desktop clients. Ensure all routes are guarded.",
    priority: "High",
    status: "In Progress",
    date: "2026-06-28", // Today
    time: "09:00 AM",
    duration: "1h 30m",
    tags: ["Security", "Backend"],
    comments: [
      { id: "c1", author: "Sarah Chen", text: "Please review the OAuth spec before starting.", time: "2h ago" },
    ],
    attachments: ["auth_flow_v2.pdf"],
    assignee: "Alex Thorne",
  },
  {
    id: "2",
    title: "Design Review - Navigation System",
    description: "Go over the new collapsible sidebar design and get alignment on transitions and mobile behavior.",
    priority: "Medium",
    status: "To Do",
    date: "2026-06-28", // Today
    time: "11:00 AM",
    duration: "1h",
    tags: ["Design", "V2"],
    comments: [],
    attachments: [],
    assignee: "Alex Thorne",
  },
  {
    id: "3",
    title: "Database Index Optimization",
    description: "Analyze slow query logs and add composite indexes to the workspace activities table.",
    priority: "Medium",
    status: "To Do",
    date: "2026-06-26", // Past / Overdue if not done
    time: "02:30 PM",
    duration: "2h",
    tags: ["Database", "Performance"],
    comments: [],
    attachments: [],
    assignee: "Alex Thorne",
  },
  {
    id: "4",
    title: "Release Momentum v2.4",
    description: "Deploy the latest sprint features to production. Run sanity checks and monitor error logs.",
    priority: "High",
    status: "To Do",
    date: "2026-06-30",
    time: "10:00 AM",
    duration: "1h",
    tags: ["Release", "Ops"],
    comments: [
      { id: "c2", author: "Jordan Miller", text: "Staging checks are all green.", time: "1d ago" },
    ],
    attachments: ["release_changelog.md"],
    assignee: "Alex Thorne",
  },
  {
    id: "5",
    title: "Update Typography Tokens",
    description: "Sync Inter font weights across desktop and web application styling files.",
    priority: "Low",
    status: "Done",
    date: "2026-06-27",
    time: "04:00 PM",
    duration: "45m",
    tags: ["Design System"],
    comments: [],
    attachments: [],
    assignee: "Alex Thorne",
  },
];

// Helper for generating days of June 2026
// June 1, 2026 is a Monday. June has 30 days.
// A 5-week grid of 35 days (June 1 - July 5) fits perfectly.
const JUNE_2026_DAYS = Array.from({ length: 35 }, (_, i) => {
  const dayNum = i + 1;
  if (dayNum <= 30) {
    return {
      dateString: `2026-06-${dayNum.toString().padStart(2, "0")}`,
      dayOfMonth: dayNum,
      isCurrentMonth: true,
      dayOfWeek: i % 7, // 0 = Mon, 6 = Sun
    };
  } else {
    const nextMonthDay = dayNum - 30;
    return {
      dateString: `2026-07-${nextMonthDay.toString().padStart(2, "0")}`,
      dayOfMonth: nextMonthDay,
      isCurrentMonth: false,
      dayOfWeek: i % 7,
    };
  }
});

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarPage() {
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [currentView, setCurrentView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(INITIAL_EVENTS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  
  // Add Event Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("2026-06-28");
  const [newTime, setNewTime] = useState("10:00 AM");
  const [newDuration, setNewDuration] = useState("1h");
  const [newPriority, setNewPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [newStatus, setNewStatus] = useState<"To Do" | "In Progress" | "Done">("To Do");
  const [newTags, setNewTags] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Quick Notes state
  const [quickNote, setQuickNote] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Filters and Searches
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === "All" || event.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [events, searchQuery, priorityFilter]);

  // Group events by date for easy rendering
  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    filteredEvents.forEach((event) => {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    });
    return map;
  }, [filteredEvents]);

  // Handle Event Creation
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEvent: Event = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc,
      priority: newPriority,
      status: newStatus,
      date: newDate,
      time: newTime,
      duration: newDuration,
      tags: newTags ? newTags.split(",").map((t) => t.trim()) : [],
      comments: [],
      attachments: [],
      assignee: "Alex Thorne",
    };

    setEvents([...events, newEvent]);
    setSelectedEvent(newEvent);
    setIsAddModalOpen(false);

    // Reset Form
    setNewTitle("");
    setNewDesc("");
    setNewDate("2026-06-28");
    setNewTime("10:00 AM");
    setNewDuration("1h");
    setNewPriority("Medium");
    setNewStatus("To Do");
    setNewTags("");
  };

  // Handle Event Deletion
  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
    if (selectedEvent?.id === id) {
      setSelectedEvent(null);
    }
  };

  // Handle Comments Add
  const [commentText, setCommentText] = useState("");
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedEvent) return;

    const updatedEvents = events.map((event) => {
      if (event.id !== selectedEvent.id) return event;
      const updatedComments = [
        ...event.comments,
        {
          id: Date.now().toString(),
          author: "Alex Thorne",
          text: commentText,
          time: "Just now",
        },
      ];
      return { ...event, comments: updatedComments };
    });

    setEvents(updatedEvents);
    setSelectedEvent({
      ...selectedEvent,
      comments: [
        ...selectedEvent.comments,
        {
          id: Date.now().toString(),
          author: "Alex Thorne",
          text: commentText,
          time: "Just now",
        },
      ],
    });
    setCommentText("");
  };

  // Date Checkers
  const isToday = (dateStr: string) => dateStr === "2026-06-28";
  const isWeekend = (dayOfWeek: number) => dayOfWeek === 5 || dayOfWeek === 6; // Sat, Sun

  // Overdue and Today's sidebar items
  const overdueTasks = useMemo(() => {
    return events.filter((e) => e.date < "2026-06-28" && e.status !== "Done");
  }, [events]);

  const todayTasks = useMemo(() => {
    return events.filter((e) => e.date === "2026-06-28");
  }, [events]);

  return (
    <div className="flex min-h-screen bg-[#faf8ff] text-[#191b23] font-body-md antialiased selection:bg-[#004ac6]/10 selection:text-[#004ac6]">
      {/* Sidebar */}
      <Sidebar activePage="calendar" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <Header />

        {/* Calendar Top Toolbar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-8 py-4 bg-white border-b border-outline-variant/40 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#191b23]">Calendar</h2>
              <p className="text-xs text-secondary mt-0.5">Sunday, June 28, 2026</p>
            </div>
            <div className="flex items-center gap-1 bg-[#f3f3fe] border border-outline-variant/30 rounded-lg p-0.5">
              <button onClick={() => showToast("Previous date range...")} className="p-1.5 hover:bg-white rounded-md text-secondary hover:text-on-surface transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => showToast("Jump to today...")} className="px-3 py-1 bg-white shadow-sm border border-outline-variant/20 rounded-md text-xs font-semibold text-[#191b23]">
                Today
              </button>
              <button onClick={() => showToast("Next date range...")} className="p-1.5 hover:bg-white rounded-md text-secondary hover:text-on-surface transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-[#191b23] hidden lg:block">June 2026</h3>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                className="pl-9 pr-4 py-1.5 w-full md:w-48 bg-[#f3f3fe] border border-outline-variant/30 rounded-lg text-xs focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]/10 transition-all"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                className="pl-8 pr-4 py-1.5 bg-[#f3f3fe] border border-outline-variant/30 rounded-lg text-xs font-medium focus:outline-none focus:border-[#004ac6] appearance-none cursor-pointer"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            </div>

            {/* View Selector Segmented Control */}
            <div className="flex bg-[#f3f3fe] border border-outline-variant/30 rounded-lg p-0.5">
              {(["month", "week", "day", "agenda"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md uppercase tracking-wider transition-all ${
                    currentView === view
                      ? "bg-white text-[#004ac6] shadow-sm"
                      : "text-secondary hover:text-on-surface"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Quick Add Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>
        </header>

        {/* Main Content Split Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Canvas: Calendar Grid / View */}
          <div className="flex-1 p-6 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-white border border-outline-variant/30 rounded-xl p-8 shadow-sm">
                <div className="w-16 h-16 bg-[#f3f3fe] rounded-full flex items-center justify-center text-[#004ac6] mb-4">
                  <CalendarRange className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[#191b23] mb-1">No tasks scheduled.</h3>
                <p className="text-sm text-secondary max-w-xs mb-6">
                  Create a new task or adjust your filters to see scheduled items.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  Schedule Task
                </button>
              </div>
            ) : currentView === "month" ? (
              /* Month View */
              <div className="bg-white border border-outline-variant/30 rounded-xl overflow-x-auto shadow-sm">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-7 border-b border-outline-variant/30 text-center bg-[#f8f9fc] py-2.5">
                    {WEEKDAYS.map((day) => (
                      <span key={day} className="text-xs font-bold uppercase tracking-wider text-secondary">
                        {day}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 grid-rows-5 divide-x divide-y divide-outline-variant/20 min-h-[560px]">
                    {JUNE_2026_DAYS.map((dayInfo, idx) => {
                    const dayEvents = eventsByDate[dayInfo.dateString] || [];
                    const isDayToday = isToday(dayInfo.dateString);
                    const isDayWeekend = isWeekend(dayInfo.dayOfWeek);

                    return (
                      <div
                        key={idx}
                        className={`p-2 flex flex-col gap-1 min-h-[110px] hover:bg-slate-50/50 transition-colors ${
                          !dayInfo.isCurrentMonth ? "bg-slate-50/30 text-secondary/50 opacity-60" : ""
                        } ${isDayWeekend ? "bg-slate-50/20" : ""}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                              isDayToday
                                ? "bg-[#004ac6] text-white font-bold"
                                : "text-on-surface"
                            }`}
                          >
                            {dayInfo.dayOfMonth}
                          </span>
                        </div>

                        {/* Day Events */}
                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                          {dayEvents.map((event) => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={`w-full text-left px-2 py-1 rounded text-[11px] font-medium border transition-all truncate flex items-center gap-1.5 ${
                                selectedEvent?.id === event.id
                                  ? "bg-[#004ac6]/5 border-[#004ac6] text-[#004ac6]"
                                  : "bg-[#f8f9fc] border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  event.priority === "High"
                                    ? "bg-error"
                                    : event.priority === "Medium"
                                    ? "bg-amber-500"
                                    : "bg-outline"
                                }`}
                              ></span>
                              <span className="truncate">{event.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>
            ) : currentView === "week" ? (
              /* Week View */
              <div className="bg-white border border-outline-variant/30 rounded-xl overflow-x-auto shadow-sm flex flex-col">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-7 border-b border-outline-variant/30 text-center bg-[#f8f9fc] py-3 divide-x divide-outline-variant/20">
                    {JUNE_2026_DAYS.slice(21, 28).map((dayInfo) => {
                    const isDayToday = isToday(dayInfo.dateString);
                    return (
                      <div key={dayInfo.dateString} className="flex flex-col items-center gap-1 py-1">
                        <span className="text-xs font-bold text-secondary uppercase">
                          {WEEKDAYS[dayInfo.dayOfWeek]}
                        </span>
                        <span
                          className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                            isDayToday ? "bg-[#004ac6] text-white" : ""
                          }`}
                        >
                          {dayInfo.dayOfMonth}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-7 divide-x divide-outline-variant/20 min-h-[450px]">
                  {JUNE_2026_DAYS.slice(21, 28).map((dayInfo) => {
                    const dayEvents = eventsByDate[dayInfo.dateString] || [];
                    const isDayWeekend = isWeekend(dayInfo.dayOfWeek);

                    return (
                      <div
                        key={dayInfo.dateString}
                        className={`p-3 flex flex-col gap-2 min-h-[350px] ${
                          isDayWeekend ? "bg-slate-50/20" : ""
                        }`}
                      >
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={`p-3 rounded-lg border text-left cursor-pointer transition-all space-y-1.5 hover:shadow-sm ${
                              selectedEvent?.id === event.id
                                ? "bg-[#004ac6]/5 border-[#004ac6] text-[#004ac6]"
                                : "bg-[#f8f9fc] border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-outline uppercase">{event.time}</span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  event.priority === "High"
                                    ? "bg-error"
                                    : event.priority === "Medium"
                                    ? "bg-amber-500"
                                    : "bg-outline"
                                }`}
                              ></span>
                            </div>
                            <h4 className="text-xs font-bold leading-snug line-clamp-2">{event.title}</h4>
                            <div className="flex flex-wrap gap-0.5">
                              {event.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-[9px] bg-slate-200/50 px-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>
            ) : currentView === "day" ? (
              /* Day View */
              <div className="bg-white border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm p-6 space-y-4">
                <div className="border-b border-outline-variant/20 pb-4">
                  <h3 className="text-lg font-bold">Sunday, June 28</h3>
                  <p className="text-xs text-secondary">Today's Schedule</p>
                </div>
                <div className="space-y-3">
                  {eventsByDate["2026-06-28"]?.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer transition-all hover:shadow-sm ${
                        selectedEvent?.id === event.id
                          ? "bg-[#004ac6]/5 border-[#004ac6]"
                          : "bg-[#f8f9fc] border-outline-variant/20 hover:border-outline-variant/40"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              event.priority === "High"
                                ? "bg-error"
                                : event.priority === "Medium"
                                ? "bg-amber-500"
                                : "bg-outline"
                            }`}
                          ></span>
                          <h4 className="text-sm font-bold text-on-surface">{event.title}</h4>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-200/50 rounded-full font-bold text-secondary">
                            {event.status}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-1">{event.description}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-secondary font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {event.time} ({event.duration})
                        </span>
                        <div className="flex gap-1">
                          {event.tags.map((tag) => (
                            <span key={tag} className="text-[10px] bg-slate-200/50 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )) || <p className="text-sm text-secondary">No events scheduled for today.</p>}
                </div>
              </div>
            ) : (
              /* Agenda View */
              <div className="space-y-6">
                {JUNE_2026_DAYS.map((dayInfo) => {
                  const dayEvents = eventsByDate[dayInfo.dateString] || [];
                  if (dayEvents.length === 0) return null;

                  return (
                    <div key={dayInfo.dateString} className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="border-b border-outline-variant/20 pb-3 flex justify-between items-center">
                        <h4 className="text-sm font-bold text-[#191b23]">
                          {WEEKDAYS[dayInfo.dayOfWeek]}, June {dayInfo.dayOfMonth}, 2026
                        </h4>
                        {isToday(dayInfo.dateString) && (
                          <span className="px-2.5 py-0.5 bg-[#004ac6] text-white text-[10px] font-bold rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={`p-3 rounded-lg border flex justify-between items-center gap-4 cursor-pointer transition-all hover:border-outline-variant/45 ${
                              selectedEvent?.id === event.id
                                ? "bg-[#004ac6]/5 border-[#004ac6]"
                                : "bg-[#f8f9fc] border-outline-variant/20"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  event.priority === "High"
                                    ? "bg-error"
                                    : event.priority === "Medium"
                                    ? "bg-amber-500"
                                    : "bg-outline"
                                }`}
                              ></span>
                              <span className="text-xs font-semibold text-secondary w-16">{event.time}</span>
                              <span className="text-sm font-bold text-on-surface">{event.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {event.tags.map((t) => (
                                <span key={t} className="text-[10px] bg-slate-200/50 px-1.5 py-0.5 rounded">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Canvas: Details Panel or Bento Sidebar */}
          {selectedEvent ? (
            /* Selected Event Details Panel */
            <aside className="w-80 border-l border-outline-variant/40 bg-white p-6 flex flex-col gap-6 overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Task Details</span>
                  <h3 className="text-base font-bold text-[#191b23] mt-1">{selectedEvent.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 hover:bg-[#f3f3fe] rounded text-outline hover:text-on-surface transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stats / Details */}
              <div className="space-y-4 text-xs border-b border-outline-variant/20 pb-6">
                <div className="flex justify-between items-center">
                  <span className="text-secondary font-medium">Priority</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      selectedEvent.priority === "High"
                        ? "bg-error-container text-on-error-container"
                        : selectedEvent.priority === "Medium"
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-slate-100 text-secondary"
                    }`}
                  >
                    {selectedEvent.priority}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary font-medium">Status</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-[#191b23] rounded font-bold">
                    {selectedEvent.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary font-medium">Date</span>
                  <span className="font-semibold">{selectedEvent.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary font-medium">Time</span>
                  <span className="font-semibold">{selectedEvent.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary font-medium">Duration</span>
                  <span className="font-semibold">{selectedEvent.duration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary font-medium">Assignee</span>
                  <div className="flex items-center gap-1 font-semibold">
                    <User className="w-3 h-3 text-[#004ac6]" />
                    {selectedEvent.assignee}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 border-b border-outline-variant/20 pb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Description</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Tags */}
              {selectedEvent.tags.length > 0 && (
                <div className="space-y-2 border-b border-outline-variant/20 pb-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-[#f3f3fe] border border-outline-variant/30 text-on-surface-variant px-2 py-0.5 rounded font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedEvent.attachments.length > 0 && (
                <div className="space-y-2 border-b border-outline-variant/20 pb-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Attachments</h4>
                  <div className="space-y-1">
                    {selectedEvent.attachments.map((file) => (
                      <div key={file} className="flex items-center gap-2 p-2 bg-[#f8f9fc] border border-outline-variant/20 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-100 transition-colors">
                        <FileText className="w-3.5 h-3.5 text-[#004ac6]" />
                        <span className="truncate">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="flex-1 flex flex-col gap-4 min-h-[150px]">
                <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Comments</h4>
                <div className="flex-1 overflow-y-auto space-y-3 max-h-[200px] pr-1">
                  {selectedEvent.comments.length === 0 ? (
                    <p className="text-[11px] text-secondary">No comments yet.</p>
                  ) : (
                    selectedEvent.comments.map((c) => (
                      <div key={c.id} className="bg-slate-50 p-2.5 rounded-lg border border-outline-variant/10 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-secondary">
                          <span>{c.author}</span>
                          <span>{c.time}</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment */}
                <form onSubmit={handleAddComment} className="mt-auto pt-2">
                  <input
                    className="w-full bg-[#f3f3fe] border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#004ac6]"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                </form>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-outline-variant/20 pt-4 mt-auto">
                <button onClick={() => showToast("Opening edit modal...")} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-outline-variant/30 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors text-secondary">
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-error/20 rounded-lg text-xs font-semibold hover:bg-error/5 transition-colors text-error"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </aside>
          ) : (
            /* Right Bento Sidebar (Standard widgets) */
            <aside className="w-80 border-l border-outline-variant/40 bg-white p-6 flex flex-col gap-6 overflow-y-auto">
              {/* Mini Calendar Widget */}
              <div className="border border-outline-variant/30 rounded-xl p-4 bg-slate-50/50">
                <h4 className="text-xs font-bold uppercase tracking-widest text-outline mb-3">Mini Calendar</h4>
                <div className="text-xs font-bold text-[#191b23] flex justify-between items-center mb-2">
                  <span>June 2026</span>
                  <div className="flex gap-1">
                    <ChevronLeft className="w-3 h-3 cursor-pointer text-secondary hover:text-on-surface" />
                    <ChevronRight className="w-3 h-3 cursor-pointer text-secondary hover:text-on-surface" />
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center font-semibold text-secondary mb-1">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <span key={i} className="text-[10px]">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                  {Array.from({ length: 30 }, (_, i) => {
                    const d = i + 1;
                    const isDToday = d === 28;
                    return (
                      <span
                        key={i}
                        className={`py-0.5 rounded cursor-pointer ${
                          isDToday
                            ? "bg-[#004ac6] text-white font-bold"
                            : "hover:bg-slate-200"
                        }`}
                      >
                        {d}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Overdue Tasks Widget */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Overdue Tasks</h4>
                <div className="space-y-2">
                  {overdueTasks.length === 0 ? (
                    <p className="text-xs text-secondary">No overdue tasks.</p>
                  ) : (
                    overdueTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedEvent(task)}
                        className="p-3 bg-error/5 border border-error/10 rounded-lg flex justify-between items-start cursor-pointer hover:bg-error/10 transition-colors"
                      >
                        <div>
                          <h5 className="text-xs font-bold text-on-surface line-clamp-1">{task.title}</h5>
                          <span className="text-[10px] text-error font-medium">{task.date}</span>
                        </div>
                        <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Today's Schedule Widget */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Today's Schedule</h4>
                <div className="space-y-2">
                  {todayTasks.length === 0 ? (
                    <p className="text-xs text-secondary">Nothing scheduled for today.</p>
                  ) : (
                    todayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedEvent(task)}
                        className="p-3 bg-slate-50 border border-outline-variant/20 rounded-lg flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-bold text-on-surface line-clamp-1">{task.title}</h5>
                          <span className="text-[10px] text-secondary font-medium">{task.time}</span>
                        </div>
                        <span className="text-[9px] bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded">
                          {task.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Focus Session Widget */}
              <div className="border border-outline-variant/30 rounded-xl p-4 bg-[#004ac6] text-white space-y-3 relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Focus Session
                  </span>
                  <h4 className="text-xl font-bold mt-2">Deep Work</h4>
                  <p className="text-xs opacity-90 mt-1">Silence notifications and start a 45 min focus timer.</p>
                </div>
                <button className="relative z-10 w-full py-2 bg-white text-[#004ac6] rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-50 transition-all active:scale-[0.98]">
                  <Play className="w-3.5 h-3.5 fill-[#004ac6]" />
                  Start Timer
                </button>
              </div>

              {/* Quick Notes Widget */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Quick Notes</h4>
                <textarea
                  className="w-full bg-[#f3f3fe] border border-outline-variant/30 rounded-lg text-xs text-on-surface-variant p-3 resize-none focus:outline-none focus:border-[#004ac6] h-20"
                  placeholder="Jot down a quick task..."
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#1e222b] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold z-50 animate-in slide-in-from-bottom-3 duration-300">
          {toast}
        </div>
      )}

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-outline-variant/20">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h2 className="text-base font-bold text-[#191b23]">Schedule Task</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="title">
                  Event Title
                </label>
                <input
                  id="title"
                  className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                  placeholder="Design system review..."
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="desc">
                  Description
                </label>
                <textarea
                  id="desc"
                  className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs resize-none h-16 focus:outline-none focus:border-[#004ac6]"
                  placeholder="Add details about the task..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant" htmlFor="date">
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant" htmlFor="time">
                    Time
                  </label>
                  <input
                    id="time"
                    className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                    placeholder="10:00 AM"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant" htmlFor="duration">
                    Duration
                  </label>
                  <input
                    id="duration"
                    className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                    placeholder="1h"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant" htmlFor="priority">
                    Priority
                  </label>
                  <select
                    id="priority"
                    className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6] bg-white"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6] bg-white"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="tags">
                  Tags (comma-separated)
                </label>
                <input
                  id="tags"
                  className="w-full border border-outline-variant/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                  placeholder="Design, Sprint, Security"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
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
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
