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
  FiExternalLink
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
  description: string;
  category: "blog" | "project" | "milestone" | "other";
  status: "pending" | "completed";
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
}

export default function DashboardClient({
  stats,
  recentMessages,
  recentPosts,
  recentVisitors,
  topPages,
  sparklineData,
  datesList,
}: DashboardClientProps) {
  // Todo List State
  const [todos, setTodos] = useState<TodoTask[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoDesc, setNewTodoDesc] = useState("");
  const [newTodoCategory, setNewTodoCategory] = useState<"blog" | "project" | "milestone" | "other">("project");
  const [newTodoDate, setNewTodoDate] = useState(() => new Date().toISOString().split("T")[0] || "");
  const [todoFilter, setTodoFilter] = useState<"all" | "pending" | "completed">("all");

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0] || "");

  // Analytics Chart State
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
      // Default tasks
      const defaultTodos: TodoTask[] = [
        {
          id: "1",
          text: "Draft new blog post about Next.js 15 routing",
          description: "Focus on dynamic routes, layouts, and parallel routing patterns.",
          category: "blog",
          status: "pending",
          dueDate: new Date().toISOString().split("T")[0] || "",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          text: "Optimize portfolio image asset formats",
          description: "Convert high-resolution JPEG photography uploads to dynamic WebP.",
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
      description: newTodoDesc,
      category: newTodoCategory,
      status: "pending",
      dueDate: newTodoDate,
      createdAt: new Date().toISOString(),
    };

    saveTodos([newTask, ...todos]);
    setNewTodoText("");
    setNewTodoDesc("");
  };

  const toggleTodo = (id: string) => {
    saveTodos(
      todos.map((t) => (t.id === id ? { ...t, status: t.status === "pending" ? "completed" : "pending" } : t))
    );
  };

  const deleteTodo = (id: string) => {
    saveTodos(todos.filter((t) => t.id !== id));
  };

  // Sparkline Chart Calculation
  const maxVal = Math.max(...sparklineData, 1);
  const chartWidth = 600;
  const chartHeight = 150;
  const points = sparklineData
    .map((v, i) => {
      const x = (i / (sparklineData.length - 1)) * chartWidth;
      const y = chartHeight - (v / maxVal) * (chartHeight - 20) - 10;
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

  // Get events on selected date (both todos and recent posts)
  const selectedDateTodos = todos.filter((t) => t.dueDate === selectedDate);
  const selectedDatePosts = recentPosts.filter((p) => new Date(p.createdAt).toISOString().split("T")[0] === selectedDate);

  return (
    <div className="space-y-6">
      {/* Analytics Trend Area Graph */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 relative">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-6">
          <div>
            <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Page View Analytics</h2>
            <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">30-day traffic distribution graph</p>
          </div>
          <div className="text-right font-mono text-xs text-zinc-400">
            Peak: <span className="font-bold text-amber">{maxVal} hits</span>
          </div>
        </div>

        <div className="relative w-full h-[150px] overflow-visible select-none mt-2">
          {/* Background Gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="border-t border-zinc-900 w-full h-0" />
            <div className="border-t border-zinc-900 w-full h-0" />
            <div className="border-t border-zinc-900 w-full h-0" />
            <div className="border-t border-zinc-900 w-full h-0" />
          </div>

          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Fill Area */}
            <polygon points={areaPoints} fill="url(#chart-grad)" />

            {/* Line */}
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />

            {/* Interactive Grid Dots */}
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="4.5"
                className="fill-black stroke-amber hover:fill-amber cursor-pointer transition-all duration-150"
                strokeWidth="2"
                onMouseEnter={() => setHoveredPoint({ index: idx, x: p.x, y: p.y })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </svg>

          {/* Hover Value Popover */}
          {hoveredPoint !== null && (
            <div
              className="absolute bg-[#111] border border-amber/35 px-2.5 py-1.5 font-mono text-[9px] text-white pointer-events-none z-30 flex flex-col gap-0.5 uppercase"
              style={{
                left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                top: `${(hoveredPoint.y / chartHeight) * 100 - 35}%`,
                transform: "translateX(-50%)",
              }}
            >
              <span className="text-zinc-400">{points[hoveredPoint.index]?.date}</span>
              <span className="font-bold text-amber">{points[hoveredPoint.index]?.value} Page Views</span>
            </div>
          )}
        </div>

        <div className="flex justify-between text-[8px] font-mono text-zinc-550 uppercase tracking-wide pt-3 border-t border-[#262626] mt-4">
          <span>{datesList[0]}</span>
          <span>{datesList[14]}</span>
          <span>{datesList[29]}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Work Column (2 spans wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive To-Do List */}
          <div className="border border-[#262626] bg-[#0c0c0c] p-6">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-6">
              <div>
                <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Dashboard Planner</h2>
                <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Manage project logs and blog drafts</p>
              </div>
              <div className="flex items-center gap-1.5">
                {(["all", "pending", "completed"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTodoFilter(type)}
                    className={cn(
                      "px-2 py-0.5 border font-mono text-[8px] font-bold uppercase transition-colors rounded-none",
                      todoFilter === type
                        ? "border-amber bg-amber/5 text-amber"
                        : "border-[#262626] text-zinc-400 hover:border-zinc-500"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Todo Form */}
            <form onSubmit={handleAddTodo} className="space-y-3 mb-6 bg-black/35 p-4 border border-[#262626]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Publish Next.js performance deep dive"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    className="w-full bg-[#080808] border border-[#262626] p-2 text-xs text-white outline-none focus:border-amber font-mono"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newTodoDate}
                    onChange={(e) => setNewTodoDate(e.target.value)}
                    className="w-full bg-[#080808] border border-[#262626] p-2 text-xs text-white outline-none focus:border-amber font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Details & Description</label>
                  <input
                    type="text"
                    placeholder="Short description of the tasks goals or files involved..."
                    value={newTodoDesc}
                    onChange={(e) => setNewTodoDesc(e.target.value)}
                    className="w-full bg-[#080808] border border-[#262626] p-2 text-xs text-white outline-none focus:border-amber font-mono"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={newTodoCategory}
                    onChange={(e) => setNewTodoCategory(e.target.value as any)}
                    className="w-full bg-[#080808] border border-[#262626] p-2 text-xs text-white outline-none focus:border-amber font-mono"
                  >
                    <option value="project">Project Work</option>
                    <option value="blog">Blog / Article</option>
                    <option value="milestone">Milestone</option>
                    <option value="other">Other task</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#262626]/50">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 border border-[#262626] bg-black/40 px-3 py-1.5 font-mono text-[9px] font-bold text-white uppercase hover:border-[#10B981] hover:text-[#10B981] transition-colors"
                >
                  <FiPlus className="h-3.5 w-3.5" /> Add Task
                </button>
              </div>
            </form>

            {/* Todos rendering */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
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
                      "border p-3 flex items-start justify-between gap-3 group transition-all duration-200",
                      task.status === "completed"
                        ? "border-zinc-900 bg-black/20 opacity-60"
                        : "border-[#262626] bg-[#0c0c0c] hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => toggleTodo(task.id)}
                        className="mt-0.5 text-zinc-500 hover:text-amber transition-colors shrink-0"
                      >
                        {task.status === "completed" ? (
                          <FiCheckSquare className="h-4 w-4 text-[#10B981]" />
                        ) : (
                          <FiSquare className="h-4 w-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "font-mono text-xs font-bold text-white truncate",
                            task.status === "completed" && "line-through text-zinc-500"
                          )}
                        >
                          {task.text}
                        </p>
                        {task.description && (
                          <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed font-sans">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 font-mono text-[8px] font-bold uppercase tracking-wider text-zinc-500">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 border text-[7px]",
                              task.category === "blog" && "border-sky-500/20 bg-sky-500/5 text-sky-400",
                              task.category === "project" && "border-[#F59E0B]/20 bg-[#F59E0B]/5 text-[#F59E0B]",
                              task.category === "milestone" && "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
                              task.category === "other" && "border-zinc-700 bg-zinc-800/40 text-zinc-400"
                            )}
                          >
                            {task.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiClock className="h-3 w-3" /> Due {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTodo(task.id)}
                      className="text-zinc-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      title="Delete task"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

              {todos.length === 0 && (
                <div className="py-8 text-center border border-[#262626] border-dashed font-mono text-xs text-zinc-650 uppercase">
                  No planner tasks active. Add one above!
                </div>
              )}
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Pages This Week */}
            <section className="border border-[#262626] bg-[#0c0c0c] p-6 min-w-0 overflow-hidden">
              <div className="mb-6 flex items-center justify-between border-b border-[#262626] pb-3">
                <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Top Pages</h2>
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">Views</span>
              </div>
              <div className="space-y-4">
                {topPages.map((page) => (
                  <div key={page.path} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono gap-4 min-w-0">
                      <span className="truncate text-zinc-300 flex-1" title={page.path}>
                        {page.path}
                      </span>
                      <span className="text-zinc-500 shrink-0">{page._count.path} views</span>
                    </div>
                    <div className="h-1 bg-zinc-900">
                      <div
                        className="h-full bg-[#10B981]"
                        style={{
                          width: `${(page._count.path / Math.max(...topPages.map((p) => p._count.path), 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Messages */}
            <section className="border border-[#262626] bg-[#0c0c0c] p-6 min-w-0 overflow-hidden">
              <div className="mb-6 flex items-center justify-between border-b border-[#262626] pb-3">
                <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Recent Messages</h2>
                <Link href="/admin/messages" className="font-mono text-[9px] text-[#F59E0B] uppercase tracking-wider hover:underline">
                  View inbox →
                </Link>
              </div>
              <ul className="divide-y divide-[#262626]">
                {recentMessages.map((msg) => (
                  <li key={msg.id} className="py-3">
                    <div className="flex items-center justify-between gap-4 font-mono text-xs min-w-0">
                      <p className="font-medium text-zinc-200 flex items-center gap-2 truncate min-w-0 flex-1">
                        {!msg.read ? (
                          <span className="inline-block h-1.5 w-1.5 bg-[#10B981] shrink-0" />
                        ) : null}
                        <span className="truncate">{msg.name}</span>
                      </p>
                      <span className="text-[10px] text-zinc-500 shrink-0">{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 truncate font-mono text-[11px] text-zinc-400">{msg.subject}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Sidebar Column (1 span wide) */}
        <div className="space-y-6">
          {/* Interactive Event Calendar */}
          <div className="border border-[#262626] bg-[#0c0c0c] p-6">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
              <div>
                <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Calendar</h2>
                <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Events scheduler</p>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs text-white">
                <button onClick={prevMonth} className="px-1.5 py-0.5 border border-[#262626] hover:border-zinc-500 bg-black/20">
                  &lt;
                </button>
                <span className="px-1 font-bold text-[10px] uppercase">
                  {currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
                <button onClick={nextMonth} className="px-1.5 py-0.5 border border-[#262626] hover:border-zinc-500 bg-black/20">
                  &gt;
                </button>
              </div>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] font-bold text-zinc-400 uppercase mb-2">
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
                if (!item) return <div key={`empty-${idx}`} className="h-7" />;

                const hasTodo = todos.some((t) => t.dueDate === item.dateStr && t.status === "pending");
                const hasPost = recentPosts.some((p) => new Date(p.createdAt).toISOString().split("T")[0] === item.dateStr);
                const isSelected = selectedDate === item.dateStr;
                const isToday = new Date().toISOString().split("T")[0] === item.dateStr;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(item.dateStr)}
                    className={cn(
                      "h-7 flex flex-col items-center justify-between p-1 font-mono text-[10px] relative transition-all border",
                      isSelected
                        ? "border-amber bg-amber/10 text-white font-bold"
                        : isToday
                        ? "border-[#10B981] bg-[#10B981]/5 text-white font-bold"
                        : "border-[#262626]/20 bg-black/20 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    <span>{item.day}</span>
                    <div className="flex gap-0.5 justify-center w-full">
                      {hasTodo && <span className="w-1 h-1 bg-amber rounded-full shrink-0" />}
                      {hasPost && <span className="w-1 h-1 bg-[#10B981] rounded-full shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Date Specific Events View panel */}
            <div className="mt-4 pt-3 border-t border-[#262626] font-mono text-[10px]">
              <div className="flex justify-between items-center text-[9px] text-zinc-550 font-bold uppercase tracking-wider mb-2">
                <span>Events for {selectedDate}</span>
                <span className="text-amber">({selectedDateTodos.length + selectedDatePosts.length})</span>
              </div>

              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {selectedDateTodos.map((t) => (
                  <div key={t.id} className="p-2 border border-[#262626] bg-black/45 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn("text-[10px] font-bold text-white truncate", t.status === "completed" && "line-through text-zinc-500")}>
                        {t.text}
                      </p>
                      <span className="text-[8px] text-amber uppercase font-semibold">Todo: {t.category}</span>
                    </div>
                    <button
                      onClick={() => toggleTodo(t.id)}
                      className={cn(
                        "px-1.5 py-0.5 border text-[8px] font-bold uppercase rounded-none shrink-0",
                        t.status === "completed" ? "border-[#10B981] text-[#10B981]" : "border-zinc-800 text-zinc-500 hover:border-zinc-650"
                      )}
                    >
                      {t.status === "completed" ? "Done" : "Mark Done"}
                    </button>
                  </div>
                ))}

                {selectedDatePosts.map((p) => (
                  <div key={p.id} className="p-2 border border-[#262626] bg-black/45 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white truncate">{p.title}</p>
                      <span className="text-[8px] text-[#10B981] uppercase font-semibold">Published Post</span>
                    </div>
                    <Link
                      href={`/admin/posts/${p.id}/edit`}
                      className="px-1.5 py-0.5 border border-zinc-800 hover:border-zinc-650 text-[8px] font-bold uppercase rounded-none text-zinc-400 shrink-0"
                    >
                      Edit
                    </Link>
                  </div>
                ))}

                {selectedDateTodos.length === 0 && selectedDatePosts.length === 0 && (
                  <p className="text-[10px] text-zinc-600 py-2 italic">No planner events scheduled for this day.</p>
                )}
              </div>
            </div>
          </div>

          {/* Live Visitor Feed */}
          <section className="border border-[#262626] bg-[#0c0c0c] p-6 min-w-0 overflow-hidden">
            <div className="mb-6 flex items-center justify-between border-b border-[#262626] pb-3">
              <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Live Visitors</h2>
              <span className="font-mono text-[9px] text-[#10B981] uppercase tracking-wider animate-pulse">● Live Feed</span>
            </div>
            <ul className="divide-y divide-[#262626]">
              {recentVisitors.map((visitor) => (
                <li key={visitor.id} className="py-3 flex items-start justify-between gap-4 text-xs font-mono">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-zinc-200 font-medium truncate">
                      {visitor.country || "Unknown Location"}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5 truncate">
                      {visitor.device || "desktop"} • {visitor.browser || "unknown"}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-zinc-400">
                      {new Date(visitor.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="block text-[10px] text-zinc-500 mt-0.5">
                      {visitor.visits} sessions
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
