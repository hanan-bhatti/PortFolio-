"use client";

import { useState, useEffect, useCallback } from "react";
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
  FiTrendingUp,
  FiLayout,
  FiCheckCircle,
  FiPlusCircle,
  FiAlertCircle,
  FiEdit,
  FiChevronRight,
  FiList,
  FiSettings,
  FiGitBranch,
  FiArrowRight,
  FiLink,
  FiMessageSquare
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  name: string;
  subject: string;
  read: boolean;
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

interface DBPost {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
}

interface DBMilestone {
  id: string;
  title: string;
  dueDate: string | null;
  status: string; // "pending" | "completed"
}

interface DBTask {
  id: string;
  title: string;
  projectId: string | null;
  milestoneId: string | null;
  type: string; // "task" | "blog"
  blogId: string | null;
  status: string; // "backlog" | "todo" | "in_progress" | "done"
  priority: string; // "low" | "medium" | "high" | "urgent"
  dueDate: string | null;
  createdAt: string;
}

interface DBProject {
  id: string;
  title: string;
  status: string; // "backlog" | "in_progress" | "completed" | "cancelled"
  description: string | null;
  dueDate: string | null;
  milestones: DBMilestone[];
  tasks: DBTask[];
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
  recentVisitors: Visitor[];
  topPages: TopPage[];
  sparklineData: number[];
  datesList: string[]; // YYYY-MM-DD
}

type TabType = "overview" | "planner" | "activity";

export default function DashboardClient({
  stats,
  recentMessages,
  recentVisitors,
  topPages,
  sparklineData,
  datesList,
}: DashboardClientProps) {
  // Tabs State
  const [activeTab, setActiveTab] = useState<TabType>("planner");

  // Database-backed Planner States
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [standaloneTasks, setStandaloneTasks] = useState<DBTask[]>([]);
  const [allPosts, setAllPosts] = useState<DBPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected entities for drilldown view
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Form states
  const [showAddProject, setShowAddProject] = useState(false);
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projStatus, setProjStatus] = useState("in_progress");
  const [projDueDate, setProjDueDate] = useState("");

  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [mileTitle, setMileTitle] = useState("");
  const [mileDueDate, setMileDueDate] = useState("");

  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("task");
  const [taskBlogId, setTaskBlogId] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskStatus, setTaskStatus] = useState("todo");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskMilestoneId, setTaskMilestoneId] = useState("");

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0] || "");

  // Analytics Chart Hover State
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null);

  // Fetch all planner data from database
  const fetchPlannerData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/planner");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        setStandaloneTasks(data.standaloneTasks || []);
        setAllPosts(data.posts || []);
        
        // Auto-select first project if nothing selected yet
        if (data.projects?.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.projects[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load planner data");
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchPlannerData();
  }, [fetchPlannerData]);

  // Form submit handlers
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    try {
      const res = await fetch("/api/admin/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_PROJECT",
          title: projTitle,
          status: projStatus,
          description: projDesc,
          dueDate: projDueDate || null,
        }),
      });

      if (res.ok) {
        toast.success("Project created successfully");
        setProjTitle("");
        setProjDesc("");
        setProjDueDate("");
        setShowAddProject(false);
        const data = await res.json();
        if (data.project) {
          setSelectedProjectId(data.project.id);
        }
        fetchPlannerData();
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to create project");
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mileTitle.trim() || !selectedProjectId) return;

    try {
      const res = await fetch("/api/admin/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_MILESTONE",
          title: mileTitle,
          projectId: selectedProjectId,
          dueDate: mileDueDate || null,
        }),
      });

      if (res.ok) {
        toast.success("Milestone added");
        setMileTitle("");
        setMileDueDate("");
        setShowAddMilestone(false);
        fetchPlannerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      const res = await fetch("/api/admin/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_TASK",
          title: taskTitle,
          projectId: selectedProjectId,
          milestoneId: taskMilestoneId || null,
          type: taskType,
          blogId: taskType === "blog" ? taskBlogId : null,
          status: taskStatus,
          priority: taskPriority,
          dueDate: taskDueDate || null,
        }),
      });

      if (res.ok) {
        toast.success("Task created");
        setTaskTitle("");
        setTaskDueDate("");
        setTaskBlogId("");
        setTaskMilestoneId("");
        setShowAddTask(false);
        fetchPlannerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatusMap: { [key: string]: string } = {
      backlog: "todo",
      todo: "in_progress",
      in_progress: "done",
      done: "todo",
    };
    const nextStatus = nextStatusMap[currentStatus] || "todo";

    try {
      const res = await fetch("/api/admin/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_TASK_STATUS",
          id: taskId,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        fetchPlannerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch("/api/admin/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_TASK",
          id,
        }),
      });
      if (res.ok) {
        toast.success("Task deleted");
        fetchPlannerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Delete project? This will delete all its milestones and tasks.")) return;
    try {
      const res = await fetch("/api/admin/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_PROJECT",
          id,
        }),
      });
      if (res.ok) {
        toast.success("Project deleted");
        setSelectedProjectId(null);
        fetchPlannerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMilestoneStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "pending" ? "completed" : "pending";
    try {
      const res = await fetch("/api/admin/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_MILESTONE_STATUS",
          id,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        fetchPlannerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // SVG Chart calculation
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

  // Calendar calculations
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

  // Get active selected project
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Compile calendar events for selectedDate (combines db-based tasks & projects)
  const selectedDateTasks = [
    ...standaloneTasks.filter((t) => t.dueDate === selectedDate),
    ...projects.flatMap((p) => p.tasks.filter((t) => t.dueDate === selectedDate))
  ];
  const selectedDateProjects = projects.filter((p) => p.dueDate === selectedDate);

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Header */}
      <div className="flex border-b border-[#262626] bg-[#0c0c0c] p-1 gap-1">
        <button
          data-tour="planner-toggle"
          onClick={() => setActiveTab("planner")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all rounded-none",
            activeTab === "planner"
              ? "bg-[#161616] text-[#F59E0B] border-b-2 border-[#F59E0B]"
              : "text-zinc-400 hover:text-white"
          )}
        >
          <FiFolder className="h-3.5 w-3.5" />
          <span>Projects Workspace (Linear Mode)</span>
        </button>

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
          <span>Analytics Overview</span>
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
          <span>Activity & Inbox</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[500px]">
        {/* TAB 1: NOTION/LINEAR PLANNER */}
        {activeTab === "planner" && (
          <div className="grid gap-6 lg:grid-cols-4 animate-fadeIn">
            {/* Left Sidebar: Projects List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="border border-[#262626] bg-[#0c0c0c] p-4">
                <div className="flex items-center justify-between border-b border-[#262626] pb-2 mb-3">
                  <h3 className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Projects</h3>
                  <button
                    onClick={() => setShowAddProject(!showAddProject)}
                    className="text-amber hover:text-amber-400 transition-colors"
                    title="Add Project"
                  >
                    <FiPlusCircle className="h-4 w-4" />
                  </button>
                </div>

                {showAddProject && (
                  <form onSubmit={handleCreateProject} className="space-y-2 mb-4 bg-black/40 border border-[#262626] p-3">
                    <input
                      type="text"
                      required
                      placeholder="Project title..."
                      value={projTitle}
                      onChange={(e) => setProjTitle(e.target.value)}
                      className="w-full bg-[#0c0c0c] border border-[#262626] p-2 font-mono text-[10px] text-white outline-none focus:border-amber"
                    />
                    <input
                      type="text"
                      placeholder="Short description..."
                      value={projDesc}
                      onChange={(e) => setProjDesc(e.target.value)}
                      className="w-full bg-[#0c0c0c] border border-[#262626] p-2 font-mono text-[10px] text-white outline-none focus:border-amber"
                    />
                    <div className="flex gap-2">
                      <select
                        value={projStatus}
                        onChange={(e) => setProjStatus(e.target.value)}
                        className="w-1/2 bg-[#0c0c0c] border border-[#262626] p-1 font-mono text-[9px] text-zinc-400 outline-none"
                      >
                        <option value="backlog">Backlog</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <input
                        type="date"
                        value={projDueDate}
                        onChange={(e) => setProjDueDate(e.target.value)}
                        className="w-1/2 bg-[#0c0c0c] border border-[#262626] p-1 font-mono text-[9px] text-zinc-400 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-amber/10 border border-amber/35 hover:bg-amber/20 text-amber font-mono text-[9px] font-bold uppercase py-1.5"
                    >
                      Save Project
                    </button>
                  </form>
                )}

                <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setShowAddProject(false);
                      }}
                      className={cn(
                        "w-full text-left p-2.5 font-mono text-[11px] flex items-center justify-between transition-all rounded-none border",
                        selectedProjectId === proj.id
                          ? "border-amber bg-amber/5 text-white"
                          : "border-[#262626]/20 hover:border-zinc-800 text-zinc-400"
                      )}
                    >
                      <span className="truncate pr-2 font-bold">{proj.title}</span>
                      <span className="text-[9px] text-zinc-650 shrink-0">
                        {proj.tasks.filter((t) => t.status === "done").length}/{proj.tasks.length}
                      </span>
                    </button>
                  ))}
                  {projects.length === 0 && (
                    <p className="font-mono text-[10px] text-zinc-600 py-3 italic">No projects yet</p>
                  )}
                </div>
              </div>

              {/* Sidebar Calendar Filter */}
              <div className="border border-[#262626] bg-[#0c0c0c] p-4">
                <div className="flex items-center justify-between border-b border-[#262626] pb-2 mb-3">
                  <h3 className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-bold">Workspace Log</h3>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                    <button onClick={prevMonth} className="px-1 bg-black/20 hover:bg-black/40 border border-[#262626]">&lt;</button>
                    <button onClick={nextMonth} className="px-1 bg-black/20 hover:bg-black/40 border border-[#262626]">&gt;</button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-0.5 text-center font-mono text-[8px] font-bold text-zinc-550 uppercase mb-1">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((item, idx) => {
                    if (!item) return <div key={`empty-${idx}`} className="h-6" />;
                    const isSelected = selectedDate === item.dateStr;
                    const isToday = new Date().toISOString().split("T")[0] === item.dateStr;
                    const dayTasks = [
                      ...standaloneTasks.filter((t) => t.dueDate === item.dateStr && t.status !== "done"),
                      ...projects.flatMap((p) => p.tasks.filter((t) => t.dueDate === item.dateStr && t.status !== "done"))
                    ];

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={cn(
                          "h-6 flex flex-col items-center justify-center font-mono text-[9px] border transition-all",
                          isSelected
                            ? "border-amber bg-amber/10 text-white font-bold"
                            : isToday
                            ? "border-[#10B981] bg-[#10B981]/5 text-white"
                            : "border-[#262626]/20 bg-black/15 text-zinc-500 hover:border-zinc-800"
                        )}
                      >
                        <span>{item.day}</span>
                        {dayTasks.length > 0 && (
                          <span className="w-1 h-1 bg-amber rounded-full shrink-0 mt-0.5 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Calendar task drilldown */}
                <div className="mt-3 pt-2 border-t border-[#262626]/60 font-mono text-[9px] text-zinc-400">
                  <p className="font-bold text-zinc-500 uppercase mb-1">Logs for {selectedDate}</p>
                  <div className="space-y-1 max-h-[110px] overflow-y-auto">
                    {selectedDateTasks.map((t) => (
                      <div key={t.id} className="p-1 border border-[#262626] bg-black/40 truncate">
                        • {t.title}
                      </div>
                    ))}
                    {selectedDateTasks.length === 0 && (
                      <p className="italic text-zinc-650">No logs scheduled</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Main Panel: Notion/Linear Workspace */}
            <div className="lg:col-span-3 space-y-6">
              {currentProject ? (
                <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-6">
                  {/* Project Title / Status Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#262626]/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 border text-[8px] font-mono uppercase font-bold",
                          currentProject.status === "in_progress" && "border-amber bg-amber/5 text-amber",
                          currentProject.status === "completed" && "border-[#10B981] bg-[#10B981]/5 text-[#10B981]",
                          currentProject.status === "backlog" && "border-zinc-700 bg-zinc-800/40 text-zinc-400"
                        )}>
                          {currentProject.status.replace("_", " ")}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          Due: {currentProject.dueDate ? new Date(currentProject.dueDate).toLocaleDateString() : "No Date"}
                        </span>
                      </div>
                      <h2 className="text-lg font-syne font-bold text-white uppercase tracking-tight mt-1">
                        {currentProject.title}
                      </h2>
                      {currentProject.description && (
                        <p className="text-xs text-zinc-400 mt-1 font-sans">{currentProject.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddTask(!showAddTask)}
                        className="flex items-center gap-1.5 border border-[#262626] bg-black/45 px-3 py-1.5 font-mono text-[10px] font-bold text-white hover:border-[#10B981] hover:text-[#10B981] transition-colors rounded-none"
                      >
                        <FiPlus className="h-3.5 w-3.5" /> Task
                      </button>
                      <button
                        onClick={() => setShowAddMilestone(!showAddMilestone)}
                        className="flex items-center gap-1.5 border border-[#262626] bg-black/45 px-3 py-1.5 font-mono text-[10px] font-bold text-white hover:border-amber hover:text-amber transition-colors rounded-none"
                      >
                        <FiPlus className="h-3.5 w-3.5" /> Milestone
                      </button>
                      <button
                        onClick={() => handleDeleteProject(currentProject.id)}
                        className="border border-red-500/25 bg-red-500/5 hover:border-red-500 hover:text-red-400 p-2 text-zinc-500 transition-colors"
                        title="Delete project"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Add Milestone Form */}
                  {showAddMilestone && (
                    <form onSubmit={handleCreateMilestone} className="bg-black/35 border border-[#262626] p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div className="md:col-span-2">
                        <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase mb-1">Milestone Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Database schema deployment"
                          value={mileTitle}
                          onChange={(e) => setMileTitle(e.target.value)}
                          className="w-full bg-[#0c0c0c] border border-[#262626] p-2 font-mono text-xs text-white outline-none focus:border-amber"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase mb-1">Target Date</label>
                        <input
                          type="date"
                          value={mileDueDate}
                          onChange={(e) => setMileDueDate(e.target.value)}
                          className="w-full bg-[#0c0c0c] border border-[#262626] p-2 font-mono text-xs text-white outline-none focus:border-amber"
                        />
                      </div>
                      <div className="md:col-span-3 flex justify-end">
                        <button
                          type="submit"
                          className="bg-amber/15 border border-amber/35 text-amber hover:bg-amber/25 px-4 py-1.5 font-mono text-[9px] font-bold uppercase"
                        >
                          Save Milestone
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Add Task Form */}
                  {showAddTask && (
                    <form onSubmit={handleCreateTask} className="bg-black/35 border border-[#262626] p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase mb-1">Task Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Implement OIDC Client validation"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-[#262626] p-2 font-mono text-xs text-white outline-none focus:border-amber"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase mb-1">Due Date</label>
                          <input
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-[#262626] p-2 font-mono text-xs text-white outline-none focus:border-amber"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase mb-1">Type</label>
                          <select
                            value={taskType}
                            onChange={(e) => setTaskType(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-[#262626] p-2 font-mono text-xs text-white outline-none focus:border-amber"
                          >
                            <option value="task">General Task</option>
                            <option value="blog">Blog Release Link</option>
                          </select>
                        </div>
                        {taskType === "blog" && (
                          <div className="md:col-span-2">
                            <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase mb-1">Select Blog Post</label>
                            <select
                              value={taskBlogId}
                              onChange={(e) => setTaskBlogId(e.target.value)}
                              className="w-full bg-[#0c0c0c] border border-[#262626] p-2 font-mono text-xs text-white outline-none focus:border-amber"
                            >
                              <option value="">-- Choose Blog --</option>
                              {allPosts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase mb-1">Priority</label>
                          <select
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-[#262626] p-2 font-mono text-xs text-white outline-none focus:border-amber"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] font-bold text-zinc-550 uppercase mb-1">Milestone Link</label>
                          <select
                            value={taskMilestoneId}
                            onChange={(e) => setTaskMilestoneId(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-[#262626] p-2 font-mono text-xs text-white outline-none focus:border-amber"
                          >
                            <option value="">-- Standalone Task --</option>
                            {currentProject.milestones.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-[#262626]/50">
                        <button
                          type="submit"
                          className="bg-amber/15 border border-amber/35 text-amber hover:bg-amber/25 px-4 py-1.5 font-mono text-[9px] font-bold uppercase"
                        >
                          Save Task
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Milestones Horizontal Timeline log */}
                  {currentProject.milestones.length > 0 && (
                    <div className="bg-[#080808]/60 p-4 border border-[#262626]">
                      <h4 className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Milestone Progress</h4>
                      <div className="flex flex-row overflow-x-auto gap-4 scrollbar-none">
                        {currentProject.milestones.map((m) => {
                          const mileTasks = currentProject.tasks.filter((t) => t.milestoneId === m.id);
                          const compTasks = mileTasks.filter((t) => t.status === "done");
                          const pct = mileTasks.length > 0 ? Math.round((compTasks.length / mileTasks.length) * 100) : 0;

                          return (
                            <div key={m.id} className="min-w-[180px] p-3 bg-black/40 border border-[#262626] relative flex flex-col justify-between">
                              <div className="flex items-start justify-between gap-1.5">
                                <span className={cn(
                                  "font-mono text-[10px] font-bold truncate flex-1",
                                  m.status === "completed" ? "line-through text-zinc-550" : "text-white"
                                )}>
                                  {m.title}
                                </span>
                                <button
                                  onClick={() => handleUpdateMilestoneStatus(m.id, m.status)}
                                  className="text-zinc-600 hover:text-amber shrink-0"
                                >
                                  {m.status === "completed" ? (
                                    <FiCheckCircle className="h-4 w-4 text-[#10B981]" />
                                  ) : (
                                    <FiSquare className="h-4 w-4" />
                                  )}
                                </button>
                              </div>

                              <div className="mt-4">
                                <div className="flex justify-between text-[8px] font-mono text-zinc-500 mb-1">
                                  <span>{pct}% complete</span>
                                  <span>{mileTasks.length} tasks</span>
                                </div>
                                <div className="h-1 bg-zinc-900 w-full">
                                  <div className="h-full bg-[#10B981]" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tasks list (Notion/Linear grouping by status) */}
                  <div className="space-y-4">
                    <h4 className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-[#262626]/60 pb-2">
                      Tasks Tracker
                    </h4>

                    <div className="grid gap-4 md:grid-cols-4">
                      {(["backlog", "todo", "in_progress", "done"] as const).map((colStatus) => {
                        const colTasks = currentProject.tasks.filter((t) => t.status === colStatus);
                        return (
                          <div key={colStatus} className="bg-black/35 p-3 border border-[#262626]/60 flex flex-col justify-between min-h-[350px]">
                            <div>
                              <div className="flex items-center justify-between border-b border-[#262626]/60 pb-1.5 mb-3">
                                <span className="font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                                  {colStatus.replace("_", " ")}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1">{colTasks.length}</span>
                              </div>

                              <div className="space-y-2">
                                {colTasks.map((t) => (
                                  <div
                                    key={t.id}
                                    className="p-2.5 bg-[#0a0a0a] border border-[#262626] hover:border-zinc-700 transition-all relative group flex flex-col justify-between gap-2"
                                  >
                                    <div className="flex items-start justify-between gap-1.5">
                                      <button
                                        onClick={() => handleUpdateTaskStatus(t.id, t.status)}
                                        className="font-mono text-[10px] text-zinc-200 text-left hover:text-amber transition-colors line-clamp-2"
                                      >
                                        {t.title}
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTask(t.id)}
                                        className="text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                      >
                                        <FiTrash2 className="h-3 w-3" />
                                      </button>
                                    </div>

                                    {/* Task type details or link indicators */}
                                    {t.type === "blog" && t.blogId && (
                                      <div className="flex items-center gap-1 text-[8px] font-mono text-sky-400 uppercase font-semibold">
                                        <FiLink className="h-3 w-3 shrink-0" /> Link to Blog
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between text-[8px] font-mono mt-1 text-zinc-500 pt-1.5 border-t border-[#262626]/30">
                                      <span className={cn(
                                        "uppercase font-bold",
                                        t.priority === "urgent" && "text-red-550 animate-pulse",
                                        t.priority === "high" && "text-amber",
                                        t.priority === "medium" && "text-zinc-400",
                                        t.priority === "low" && "text-zinc-650"
                                      )}>
                                        {t.priority}
                                      </span>
                                      {t.dueDate && (
                                        <span>{new Date(t.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}

                                {colTasks.length === 0 && (
                                  <p className="text-[9px] font-mono text-zinc-700 text-center py-6 border border-zinc-950/20 border-dashed">
                                    Empty
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-[#262626] bg-[#0c0c0c] py-20 text-center font-mono text-xs text-zinc-600 uppercase">
                  Select a project from the sidebar to view workspace
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: OVERVIEW */}
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
                  <polygon points={areaPoints} fill="url(#glow-grad)" />
                  <polyline
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />

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

              <div className="flex justify-between text-[8px] font-mono text-zinc-650 uppercase tracking-wider pt-3 border-t border-[#262626]/50 mt-4">
                <span>{datesList[0]}</span>
                <span>{datesList[14]}</span>
                <span>{datesList[29]}</span>
              </div>
            </div>

            {/* Popular Pages grid */}
            <div className="grid gap-6 md:grid-cols-2">
              <section data-tour="quick-actions" className="border border-[#262626] bg-[#0c0c0c] p-6">
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

              <section data-tour="dashboard-stats" className="border border-[#262626] bg-[#0c0c0c] p-6">
                <div className="mb-4 flex items-center justify-between border-b border-[#262626] pb-3">
                  <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Quick Stats Summary</h2>
                  <FiActivity className="h-4 w-4 text-amber shrink-0" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black/40 border border-[#262626]/60 font-mono text-xs">
                    <p className="text-zinc-500 uppercase text-[9px] font-bold">Unread Inbox</p>
                    <p className="text-xl font-bold text-white mt-1">{stats.unreadMessages}</p>
                  </div>
                  <div className="p-3 bg-black/40 border border-[#262626]/60 font-mono text-xs">
                    <p className="text-zinc-500 uppercase text-[9px] font-bold">Live Blogs</p>
                    <p className="text-xl font-bold text-white mt-1">{stats.publishedPosts}</p>
                  </div>
                  <div className="p-3 bg-black/40 border border-[#262626]/60 font-mono text-xs">
                    <p className="text-zinc-500 uppercase text-[9px] font-bold">Total Downloads</p>
                    <p className="text-xl font-bold text-white mt-1">{stats.totalDownloads}</p>
                  </div>
                  <div className="p-3 bg-black/40 border border-[#262626]/60 font-mono text-xs">
                    <p className="text-zinc-500 uppercase text-[9px] font-bold">Total Photos</p>
                    <p className="text-xl font-bold text-white mt-1">{stats.totalPhotos}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVITY / MESSAGES */}
        {activeTab === "activity" && (
          <div className="grid gap-6 md:grid-cols-2 animate-fadeIn">
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
