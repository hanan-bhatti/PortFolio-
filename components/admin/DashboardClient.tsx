"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiUsers,
  FiEye,
  FiDownload,
  FiCamera,
  FiFileText,
  FiFolder,
  FiMail,
  FiActivity,
  FiPlus,
  FiTrash2,
  FiCheckSquare,
  FiSquare,
  FiCalendar,
  FiClock,
  FiArrowRight,
  FiMessageSquare,
  FiTrendingUp,
  FiLayout,
  FiCheckCircle,
  FiPlusCircle
} from "react-icons/fi";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  name: string;
  subject: string;
  read: boolean;
  createdAt: Date;
}

interface Post {
  id: string;
  title: string;
  published: boolean;
  createdAt: Date;
}

interface Visitor {
  id: string;
  country: string | null;
  device: string | null;
  browser: string | null;
  lastSeen: Date;
  visits: number;
}

interface TopPage {
  path: string;
  _count: {
    path: number;
  };
}

interface DashboardClientProps {
  stats: {
    totalVisitors: number;
    totalPageViews: number;
    totalDownloads: number;
    totalPhotos: number;
    totalPosts: number;
    publishedPosts: number;
    totalProjects: number;
    unreadMessages: number;
  };
  recentMessages: Message[];
  recentPosts: Post[];
  recentVisitors: Visitor[];
  topPages: TopPage[];
  sparklineData: number[];
  datesList: string[]; // YYYY-MM-DD
}

interface TodoTask {
  id: string;
  text: string;
  category: "blog" | "project" | "milestone" | "other";
  status: "pending" | "completed";
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
}

type TabType = "overview" | "planner" | "activity";

export default function DashboardClient({
  stats,
  recentMessages,
  recentPosts,
  recentVisitors,
  topPages,
  sparklineData,
  datesList,
}: DashboardClientProps) {
  // Tabs State
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Todo List State
  const [todos, setTodos] = useState<TodoTask[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoCategory, setNewTodoCategory] = useState<"blog" | "project" | "milestone" | "other">("project");
  const [newTodoDate, setNewTodoDate] = useState(() => new Date().toISOString().split("T")[0] || "");
  const [todoFilter, setTodoFilter] = useState<"all" | "pending" | "completed">("pending");

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0] || "");

  // Analytics Chart Hover State
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null);

  // Load Todos from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin_dashboard_todos");
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse todos", e);
      }
    } else {
      const defaultTodos: TodoTask[] = [
        {
          id: "1",
          text: "Draft new blog post about Next.js 15 routing",
          category: "blog",
          status: "pending",
          dueDate: new Date().toISOString().split("T")[0] || "",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          text: "Optimize portfolio image asset formats",
          category: "project",
          status: "pending",
          dueDate: new Date().toISOString().split("T")[0] || "",
          createdAt: new Date().toISOString(),
        }
      ];
      setTodos(defaultTodos);
      localStorage.setItem("admin_dashboard_todos", JSON.stringify(defaultTodos));
    }
  }, []);

  const saveTodos = (newTodos: TodoTask[]) => {
    setTodos(newTodos);
    localStorage.setItem("admin_dashboard_todos", JSON.stringify(newTodos));
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newTask: TodoTask = {
      id: Date.now().toString(),
      text: newTodoText,
      category: newTodoCategory,
      status: "pending",
      dueDate: newTodoDate,
      createdAt: new Date().toISOString(),
    };

    saveTodos([newTask, ...todos]);
    setNewTodoText("");
  };

  const toggleTodo = (id: string) => {
    saveTodos(
      todos.map((t) => (t.id === id ? { ...t, status: t.status === "pending" ? "completed" : "pending" } : t))
    );
  };

  const deleteTodo = (id: string) => {
    saveTodos(todos.filter((t) => t.id !== id));
  };

  // SVG Chart points calculation
  const maxVal = Math.max(...sparklineData, 1);
  const chartWidth = 700;
  const chartHeight = 160;
  const points = sparklineData.map((v, i) => {
    const x = (i / (sparklineData.length - 1)) * chartWidth;
    const y = chartHeight - (v / maxVal) * (chartHeight - 30) - 15;
    return { x, y, value: v, date: datesList[i] };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `0,${chartHeight} ${polylinePoints} ${chartWidth},${chartHeight}`;

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays };
  };

  const { firstDay, totalDays } = getDaysInMonth(currentMonth);
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    const dStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarDays.push({ day: i, dateStr: dStr });
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const selectedDateTodos = todos.filter((t) => t.dueDate === selectedDate);
  const selectedDatePosts = recentPosts.filter((p) => new Date(p.createdAt).toISOString().split("T")[0] === selectedDate);

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Header */}
      <div className="flex border-b border-[#262626] bg-[#0c0c0c] p-1 gap-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all rounded-none",
            activeTab === "overview"
              ? "bg-[#161616] text-[#F59E0B] border-b-2 border-[#F59E0B]"
              : "text-zinc-400 hover:text-white"
          )}
        >
          <FiLayout className="h-3.5 w-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("planner")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all rounded-none",
            activeTab === "planner"
              ? "bg-[#161616] text-[#F59E0B] border-b-2 border-[#F59E0B]"
              : "text-zinc-400 hover:text-white"
          )}
        >
          <FiCalendar className="h-3.5 w-3.5" />
          <span>Planner & Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all rounded-none",
            activeTab === "activity"
              ? "bg-[#161616] text-[#F59E0B] border-b-2 border-[#F59E0B]"
              : "text-zinc-400 hover:text-white"
          )}
        >
          <FiMessageSquare className="h-3.5 w-3.5" />
          <span>Messages & Feed</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[500px]">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            {/* 30-Day Analytics Curve */}
            <div className="border border-[#262626] bg-[#0c0c0c] p-6 relative">
              <div className="flex items-center justify-between border-b border-[#262626]/60 pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <FiTrendingUp className="h-4 w-4 text-[#F59E0B]" />
                  <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Traffic Analytics</h3>
                </div>
                <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wide">
                  Peak Views: <span className="text-white font-bold">{maxVal}</span>
                </div>
              </div>

              <div className="relative w-full h-[160px] overflow-visible select-none mt-2">
                {/* Horizontal gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-t border-zinc-900/60 w-full h-0" />
                  <div className="border-t border-zinc-900/60 w-full h-0" />
                  <div className="border-t border-zinc-900/60 w-full h-0" />
                </div>

                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="glow-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Area shape */}
                  <polygon points={areaPoints} fill="url(#glow-grad)" />

                  {/* Bezier or standard line */}
                  <polyline
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />

                  {/* Nodes */}
                  {points.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      className="fill-black stroke-amber hover:fill-amber cursor-pointer transition-all duration-150"
                      strokeWidth="1.5"
                      onMouseEnter={() => setHoveredPoint({ index: idx, x: p.x, y: p.y })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </svg>

                {/* Hover bubble */}
                {hoveredPoint !== null && (
                  <div
                    className="absolute bg-[#111] border border-amber/35 px-2.5 py-1.5 font-mono text-[9px] text-white pointer-events-none z-30 flex flex-col gap-0.5 uppercase"
                    style={{
                      left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                      top: `${(hoveredPoint.y / chartHeight) * 100 - 35}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <span className="text-zinc-550">{points[hoveredPoint.index]?.date}</span>
                    <span className="font-bold text-amber">{points[hoveredPoint.index]?.value} hits</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase tracking-wider pt-3 border-t border-[#262626]/50 mt-4">
                <span>{datesList[0]}</span>
                <span>{datesList[14]}</span>
                <span>{datesList[29]}</span>
              </div>
            </div>

            {/* Sub grids: Top Pages */}
            <div className="grid gap-6 md:grid-cols-2">
              <section className="border border-[#262626] bg-[#0c0c0c] p-6">
                <div className="mb-4 flex items-center justify-between border-b border-[#262626] pb-3">
                  <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Popular Pages (Last 7 Days)</h2>
                  <span className="font-mono text-[9px] text-zinc-500 uppercase">Hits</span>
                </div>
                <div className="space-y-4">
                  {topPages.map((page) => (
                    <div key={page.path} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-mono gap-4 min-w-0">
                        <span className="truncate text-zinc-300 flex-1" title={page.path}>
                          {page.path}
                        </span>
                        <span className="text-zinc-500 shrink-0 font-bold">{page._count.path}</span>
                      </div>
                      <div className="h-1 bg-zinc-950">
                        <div
                          className="h-full bg-amber"
                          style={{
                            width: `${(page._count.path / Math.max(...topPages.map((p) => p._count.path), 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {topPages.length === 0 && (
                    <p className="py-6 text-center font-mono text-xs text-zinc-650">No page view logs found</p>
                  )}
                </div>
              </section>

              <section className="border border-[#262626] bg-[#0c0c0c] p-6">
                <div className="mb-4 flex items-center justify-between border-b border-[#262626] pb-3">
                  <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Recent Blog Releases</h2>
                  <Link href="/admin/posts" className="font-mono text-[9px] text-amber uppercase tracking-wider hover:underline">
                    Manage all →
                  </Link>
                </div>
                <ul className="divide-y divide-[#262626]">
                  {recentPosts.map((post) => (
                    <li key={post.id} className="flex items-center justify-between gap-3 py-3 font-mono text-xs">
                      <Link href={`/admin/posts/${post.id}/edit`} className="min-w-0 flex-1 group">
                        <p className="truncate text-zinc-200 group-hover:text-amber transition-colors">{post.title}</p>
                        <p className="mt-0.5 text-[9px] text-zinc-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                      </Link>
                      <span className={cn(
                        "px-1.5 py-0.5 text-[8px] font-bold border uppercase shrink-0",
                        post.published ? "border-[#10B981] bg-[#10B981]/5 text-[#10B981]" : "border-zinc-700 bg-zinc-800/40 text-zinc-400"
                      )}>
                        {post.published ? "Live" : "Draft"}
                      </span>
                    </li>
                  ))}
                  {recentPosts.length === 0 && (
                    <li className="py-6 text-center text-xs font-mono text-zinc-650">No blogs published yet</li>
                  )}
                </ul>
              </section>
            </div>
          </div>
        )}

        {/* TAB 2: PLANNER & CALENDAR */}
        {activeTab === "planner" && (
          <div className="grid gap-6 md:grid-cols-5 animate-fadeIn">
            {/* Planner Left column (Calendar) */}
            <div className="md:col-span-2 border border-[#262626] bg-[#0c0c0c] p-6 h-fit">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
                <div>
                  <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Calendar</h3>
                  <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Filter by date</p>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs text-white">
                  <button onClick={prevMonth} className="px-1.5 py-0.5 border border-[#262626] hover:border-zinc-500 bg-black/20">
                    &lt;
                  </button>
                  <span className="px-1 font-bold text-[9px] uppercase">
                    {currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                  <button onClick={nextMonth} className="px-1.5 py-0.5 border border-[#262626] hover:border-zinc-500 bg-black/20">
                    &gt;
                  </button>
                </div>
              </div>

              {/* Grid weekdays */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] font-bold text-zinc-500 uppercase mb-2">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => {
                  if (!item) return <div key={`empty-${idx}`} className="h-8" />;

                  const hasTodo = todos.some((t) => t.dueDate === item.dateStr && t.status === "pending");
                  const hasPost = recentPosts.some((p) => new Date(p.createdAt).toISOString().split("T")[0] === item.dateStr);
                  const isSelected = selectedDate === item.dateStr;
                  const isToday = new Date().toISOString().split("T")[0] === item.dateStr;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(item.dateStr)}
                      className={cn(
                        "h-8 flex flex-col items-center justify-between p-1 font-mono text-[10px] relative transition-all border rounded-none",
                        isSelected
                          ? "border-amber bg-amber/10 text-white font-bold"
                          : isToday
                          ? "border-[#10B981] bg-[#10B981]/5 text-white font-bold"
                          : "border-[#262626]/20 bg-black/20 text-zinc-400 hover:border-zinc-700"
                      )}
                    >
                      <span>{item.day}</span>
                      <div className="flex gap-0.5 justify-center w-full">
                        {hasTodo && <span className="w-1.5 h-1.5 bg-amber rounded-full shrink-0 animate-pulse" />}
                        {hasPost && <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Calendar events list */}
              <div className="mt-4 pt-3 border-t border-[#262626] font-mono text-[10px]">
                <div className="flex justify-between items-center text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
                  <span>Log: {selectedDate}</span>
                  <span className="text-amber">({selectedDateTodos.length + selectedDatePosts.length})</span>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {selectedDateTodos.map((t) => (
                    <div key={t.id} className="p-2 border border-[#262626] bg-black/45 flex items-center justify-between gap-2">
                      <p className={cn("text-[10px] font-bold text-white truncate", t.status === "completed" && "line-through text-zinc-500")}>
                        {t.text}
                      </p>
                      <button
                        onClick={() => toggleTodo(t.id)}
                        className={cn(
                          "px-1 py-0.5 border text-[8px] font-bold uppercase rounded-none shrink-0",
                          t.status === "completed" ? "border-[#10B981] text-[#10B981]" : "border-zinc-800 text-zinc-400"
                        )}
                      >
                        {t.status === "completed" ? "Done" : "Mark"}
                      </button>
                    </div>
                  ))}

                  {selectedDatePosts.map((p) => (
                    <div key={p.id} className="p-2 border border-[#262626] bg-black/45 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold text-white truncate">{p.title}</p>
                      <span className="text-[8px] text-[#10B981] uppercase font-bold shrink-0">Blog</span>
                    </div>
                  ))}

                  {selectedDateTodos.length === 0 && selectedDatePosts.length === 0 && (
                    <p className="text-[10px] text-zinc-650 italic py-1">No scheduler items on this day</p>
                  )}
                </div>
              </div>
            </div>

            {/* Planner Right Column (Todo Board) */}
            <div className="md:col-span-3 border border-[#262626] bg-[#0c0c0c] p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
                  <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Planner Logs</h3>
                  <div className="flex items-center gap-1.5">
                    {(["all", "pending", "completed"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setTodoFilter(type)}
                        className={cn(
                          "px-2 py-0.5 border font-mono text-[8px] font-bold uppercase transition-colors rounded-none",
                          todoFilter === type
                            ? "border-amber bg-amber/5 text-amber"
                            : "border-[#262626] text-zinc-500 hover:border-zinc-400"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inline Quick Add Todo Form */}
                <form onSubmit={handleAddTodo} className="flex gap-2 mb-4 bg-black/40 border border-[#262626] p-2">
                  <input
                    type="text"
                    required
                    placeholder="Log a new task, blog idea, or project milestone..."
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white outline-none font-mono px-1 placeholder-zinc-600"
                  />
                  <select
                    value={newTodoCategory}
                    onChange={(e) => setNewTodoCategory(e.target.value as any)}
                    className="bg-[#0c0c0c] border border-[#262626] text-[10px] text-zinc-400 outline-none font-mono px-1 shrink-0"
                  >
                    <option value="project">Project</option>
                    <option value="blog">Blog</option>
                    <option value="milestone">Milestone</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-amber/10 border border-amber/30 text-amber hover:bg-amber/20 px-2 py-1 font-mono text-[9px] font-bold uppercase shrink-0"
                  >
                    Add
                  </button>
                </form>

                {/* Task List container */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {todos
                    .filter((t) => {
                      if (todoFilter === "pending") return t.status === "pending";
                      if (todoFilter === "completed") return t.status === "completed";
                      return true;
                    })
                    .map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "border p-2.5 flex items-center justify-between gap-3 group transition-all rounded-none",
                          task.status === "completed"
                            ? "border-zinc-950 bg-black/20 opacity-60"
                            : "border-[#262626] bg-black/35 hover:border-zinc-700"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleTodo(task.id)}
                            className="text-zinc-550 hover:text-amber transition-colors shrink-0"
                          >
                            {task.status === "completed" ? (
                              <FiCheckSquare className="h-4 w-4 text-[#10B981]" />
                            ) : (
                              <FiSquare className="h-4 w-4" />
                            )}
                          </button>
                          <span
                            className={cn(
                              "font-mono text-xs text-zinc-200 truncate",
                              task.status === "completed" && "line-through text-zinc-650"
                            )}
                          >
                            {task.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 border text-[7px] font-mono uppercase font-bold",
                              task.category === "blog" && "border-sky-500/20 bg-sky-500/5 text-sky-400",
                              task.category === "project" && "border-[#F59E0B]/20 bg-[#F59E0B]/5 text-[#F59E0B]",
                              task.category === "milestone" && "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
                              task.category === "other" && "border-zinc-700 bg-zinc-800/40 text-zinc-400"
                            )}
                          >
                            {task.category}
                          </span>
                          <button
                            onClick={() => deleteTodo(task.id)}
                            className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                  {todos.length === 0 && (
                    <div className="py-8 text-center border border-[#262626] border-dashed font-mono text-xs text-zinc-650 uppercase">
                      No matching planner tasks
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVITY / MESSAGES */}
        {activeTab === "activity" && (
          <div className="grid gap-6 md:grid-cols-2 animate-fadeIn">
            {/* Inbox logs */}
            <section className="border border-[#262626] bg-[#0c0c0c] p-6">
              <div className="mb-4 flex items-center justify-between border-b border-[#262626] pb-3">
                <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Inbox Overview</h2>
                <Link href="/admin/messages" className="font-mono text-[9px] text-amber uppercase tracking-wider hover:underline">
                  Go to Inbox →
                </Link>
              </div>
              <ul className="divide-y divide-[#262626]">
                {recentMessages.map((msg) => (
                  <li key={msg.id} className="py-3">
                    <div className="flex items-center justify-between gap-4 font-mono text-xs min-w-0">
                      <p className="font-medium text-zinc-200 flex items-center gap-2 truncate min-w-0 flex-1">
                        {!msg.read && <span className="inline-block h-1.5 w-1.5 bg-[#10B981] shrink-0" />}
                        <span className="truncate">{msg.name}</span>
                      </p>
                      <span className="text-[9px] text-zinc-500 shrink-0">{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 truncate font-mono text-[11px] text-zinc-400">{msg.subject}</p>
                  </li>
                ))}
                {recentMessages.length === 0 && (
                  <li className="py-6 text-center text-xs font-mono text-zinc-650">No incoming messages</li>
                )}
              </ul>
            </section>

            {/* Live visitors feed */}
            <section className="border border-[#262626] bg-[#0c0c0c] p-6">
              <div className="mb-4 flex items-center justify-between border-b border-[#262626] pb-3">
                <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Recent Visits</h2>
                <span className="font-mono text-[9px] text-[#10B981] uppercase tracking-wider animate-pulse">● Live Feed</span>
              </div>
              <ul className="divide-y divide-[#262626]">
                {recentVisitors.map((visitor) => (
                  <li key={visitor.id} className="py-3 flex items-start justify-between gap-4 text-xs font-mono">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-zinc-200 font-medium truncate">
                        {visitor.country || "Unknown Location"}
                      </span>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wide mt-0.5 truncate">
                        {visitor.device || "desktop"} • {visitor.browser || "unknown"}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-zinc-400">
                        {new Date(visitor.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="block text-[9px] text-zinc-550 mt-0.5">
                        {visitor.visits} sessions
                      </span>
                    </div>
                  </li>
                ))}
                {recentVisitors.length === 0 && (
                  <li className="py-6 text-center text-xs font-mono text-zinc-650">No visitors logged yet</li>
                )}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
