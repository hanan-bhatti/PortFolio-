"use client";

import React, { useState, useEffect, useCallback } from "react";
import WorkspaceSidebar from "./WorkspaceSidebar";
import BlockEditor from "./BlockEditor";
import BlogStatusBar from "./BlogStatusBar";
import KanbanBoard from "./KanbanBoard";
import BookmarkGrid from "./BookmarkGrid";
import QuickCaptureModal from "./QuickCaptureModal";
import IconPicker from "./IconPicker";
import { toast } from "sonner";
import {
  FiMonitor,
  FiMenu,
  FiGrid,
  FiEdit,
  FiCalendar,
  FiClock,
  FiSettings,
  FiBookmark,
  FiTerminal,
  FiList,
  FiFileText,
  FiFolder
} from "react-icons/fi";
import { cn } from "@/lib/utils";

interface PageItem {
  id: string;
  title: string;
  emoji: string;
  type: string; // note | project | blog-idea | snippet | bookmark-collection
  parentId: string | null;
  content: string;
  meta: any;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  notes: string | null;
}

interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string | null;
  category: string;
  favicon: string | null;
  ogImage: string | null;
  ogTitle: string | null;
  ogDesc: string | null;
}

export default function WorkspaceLayout() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Page entities details states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  // Global Quick Capture states
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  // Debounced auto-save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fast title renaming state
  const [titleInput, setTitleInput] = useState("");
  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all pages
  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/workspace/pages");
      if (res.ok) {
        const payload = await res.json();
        setPages(payload.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Handle page selection
  const selectPage = async (pageId: string | null) => {
    setActivePageId(pageId);
    if (!pageId) return;

    setLoadingContent(true);
    try {
      const page = pages.find((p) => p.id === pageId);
      if (page) {
        setTitleInput(page.title);
        if (page.type === "project") {
          const res = await fetch(`/api/admin/workspace/pages/${pageId}/tasks`);
          if (res.ok) {
            const payload = await res.json();
            setTasks(payload.data || []);
          }
        } else if (page.type === "bookmark-collection") {
          const res = await fetch("/api/admin/workspace/bookmarks");
          if (res.ok) {
            const payload = await res.json();
            setBookmarks(payload.data || []);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingContent(false);
    }
  };

  // Keyboard shortcut listener for ⌘K Quick Capture
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, []);

  // Create page handler
  const handleCreatePage = async (type: string, parentId?: string | null) => {
    try {
      const res = await fetch("/api/admin/workspace/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Untitled ${type}`,
          emoji: type === "project" ? "🚀" : type === "blog-idea" ? "✍️" : type === "snippet" ? "💻" : type === "bookmark-collection" ? "🔗" : "📄",
          type,
          parentId: parentId || null
        })
      });

      if (res.ok) {
        const payload = await res.json();
        await fetchPages();
        selectPage(payload.data.id);
        toast.success("Page added to workspace");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Debounced title save
  const saveTitleDebounced = useCallback((id: string, newTitle: string) => {
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    
    // Update local list instantly so sidebar updates fast
    setPages((prev) => prev.map((p) => p.id === id ? { ...p, title: newTitle } : p));

    titleTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/admin/workspace/pages/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle })
        });
      } catch (e) {
        console.error(e);
      }
    }, 800); // 800ms debounce
  }, []);

  const handleRenamePage = async (id: string, newTitle: string) => {
    setTitleInput(newTitle);
    saveTitleDebounced(id, newTitle);
  };

  // Edit icon picker handler
  const handleEmojiSelect = async (id: string, emoji: string) => {
    setPages((prev) => prev.map((p) => p.id === id ? { ...p, emoji } : p));
    try {
      await fetch(`/api/admin/workspace/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Delete page cascade handler
  const handleDeletePage = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/workspace/pages/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Page deleted");
        if (activePageId === id) {
          setActivePageId(null);
        }
        fetchPages();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Debounced auto-save editor contents (TipTap blocks)
  const saveEditorContent = useCallback((pageId: string, contentJson: string) => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/workspace/pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: JSON.parse(contentJson) })
        });
        if (res.ok) {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 1500);
          fetchPages();
        }
      } catch (e) {
        console.error(e);
        setSaveStatus("idle");
      }
    }, 1500);
  }, [fetchPages]);

  // Update blog-idea status metadata
  const handleBlogStatusChange = async (id: string, newStatus: string) => {
    const page = pages.find((p) => p.id === id);
    if (!page) return;

    const currentMeta = typeof page.meta === "object" ? page.meta : {};
    const updatedMeta = { ...currentMeta, status: newStatus };

    try {
      const res = await fetch(`/api/admin/workspace/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta: updatedMeta })
      });
      if (res.ok) {
        fetchPages();
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Kanban Board Action integrations
  const handleAddTask = async (title: string, status: string) => {
    if (!activePageId) return;
    try {
      const res = await fetch(`/api/admin/workspace/pages/${activePageId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status })
      });
      if (res.ok) {
        const payload = await res.json();
        setTasks((prev) => [...prev, payload.data]);
        toast.success("Task created");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTask = async (taskId: string, fields: Partial<Task>) => {
    // Optimistic UI updates
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...fields } : t)));
    try {
      await fetch(`/api/admin/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/admin/workspace/tasks/${taskId}`, { method: "DELETE" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleReorderTasks = async (taskId: string, status: string, order: number, allColTaskIds: string[]) => {
    // Optimistic UI update
    setTasks((prev) => {
      return prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, status, order };
        }
        const indexInCol = allColTaskIds.indexOf(t.id);
        if (indexInCol !== -1) {
          return { ...t, order: indexInCol };
        }
        return t;
      });
    });

    try {
      await fetch(`/api/admin/workspace/tasks/${taskId}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, order, columnTaskIds: allColTaskIds })
      });
    } catch (e) {
      console.error(e);
      // Fallback reload
      selectPage(activePageId);
    }
  };

  // Bookmarks Action integrations
  const handleAddBookmark = async (bookmarkFields: Omit<Bookmark, "id">) => {
    try {
      const res = await fetch("/api/admin/workspace/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bookmarkFields, pageId: activePageId })
      });
      if (res.ok) {
        const payload = await res.json();
        setBookmarks((prev) => [payload.data, ...prev]);
        toast.success("Bookmark added");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBookmark = async (bookmarkId: string, fields: Partial<Bookmark>) => {
    setBookmarks((prev) => prev.map((b) => (b.id === bookmarkId ? { ...b, ...fields } : b)));
    try {
      await fetch(`/api/admin/workspace/bookmarks/${bookmarkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    try {
      await fetch(`/api/admin/workspace/bookmarks/${bookmarkId}`, { method: "DELETE" });
      toast.success("Bookmark deleted");
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Capture submission
  const handleQuickCaptureSave = async (payload: { type: "note" | "blog-idea" | "task"; content: string; projectId?: string }) => {
    try {
      if (payload.type === "task" && payload.projectId) {
        // Create task mapped to project
        const res = await fetch(`/api/admin/workspace/pages/${payload.projectId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: payload.content, status: "todo" })
        });
        if (res.ok) {
          toast.success("Task logged to project");
          if (activePageId === payload.projectId) {
            selectPage(payload.projectId);
          }
        }
      } else {
        // Create full page
        const titleLine = payload.content.split("\n")[0] || "Quick Note";
        const trimmedTitle = titleLine.substring(0, 40) + (titleLine.length > 40 ? "..." : "");

        const res = await fetch("/api/admin/workspace/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trimmedTitle,
            emoji: payload.type === "blog-idea" ? "✍️" : "📄",
            type: payload.type,
            parentId: null
          })
        });

        if (res.ok) {
          const pageData = await res.json();
          // PATCH the main content of page with first block: paragraph containing content
          const initialBlocks = [
            {
              type: "paragraph",
              content: [{ type: "text", text: payload.content }]
            }
          ];
          await fetch(`/api/admin/workspace/pages/${pageData.data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: initialBlocks })
          });

          await fetchPages();
          selectPage(pageData.data.id);
          toast.success("Capture saved as new page");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activePage = pages.find((p) => p.id === activePageId);
  const breadcrumbParent = activePage?.parentId ? pages.find((p) => p.id === activePage.parentId) : null;
  const projectPages = pages.filter((p) => p.type === "project").map((p) => ({ id: p.id, title: p.title }));

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen w-auto -m-4 sm:-m-6 md:-m-8 border-none bg-black overflow-hidden relative">
      {/* Mobile Laptop Banner enforcement */}
      <div className="md:hidden fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center select-none font-mono">
        <FiMonitor className="h-10 w-10 text-amber animate-bounce mb-3" />
        <h4 className="text-white font-bold uppercase tracking-widest text-xs">Desktop Workspace Required</h4>
        <p className="text-zinc-550 text-[10px] max-w-[280px] mt-1.5 leading-relaxed">
          The Personal Workspace is optimized for desktop and keyboard navigation.
        </p>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-h-[500px]">
        {/* Workspace Sidebar Toggle Panel */}
        <WorkspaceSidebar
          pages={pages}
          activePageId={activePageId}
          onSelectPage={selectPage}
          onCreatePage={handleCreatePage}
          onDeletePage={handleDeletePage}
          onRenamePage={handleRenamePage}
          onTriggerQuickCapture={() => setIsQuickCaptureOpen(true)}
          collapsed={sidebarCollapsed}
        />

        {/* Workspace Content Console */}
        <main className="flex-1 bg-black flex flex-col overflow-hidden relative border-l border-[#262626]/20">
          
          {/* Header Controls Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#262626] bg-[#0c0c0c] select-none">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-zinc-550 hover:text-white p-0.5"
                title="Toggle sidebar browser"
              >
                <FiMenu className="h-4 w-4" />
              </button>
              
              {/* Breadcrumb path */}
              <div className="font-mono text-[9px] text-zinc-550 uppercase tracking-widest flex items-center gap-1.5">
                <span>Personal</span>
                {breadcrumbParent && (
                  <>
                    <span>/</span>
                    <span className="text-zinc-400">{breadcrumbParent.title}</span>
                  </>
                )}
                {activePage && (
                  <>
                    <span>/</span>
                    <span className="text-white font-bold">{activePage.title}</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick indicators */}
            <div className="flex items-center gap-3">
              {activePage && (
                <span className="px-2 py-0.5 border border-[#262626] bg-black/45 text-zinc-500 font-mono text-[8px] uppercase tracking-wider rounded-none select-none">
                  {activePage.type.replace("-", " ")}
                </span>
              )}
            </div>
          </div>

          {/* Active page renderer container */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
            {activePage ? (
              <div className="max-w-[760px] mx-auto space-y-6">
                
                {/* Title and Icon Controls */}
                <div className="flex items-center gap-3 border-b border-[#262626]/40 pb-4">
                  <IconPicker
                    currentIcon={activePage.emoji}
                    onSelect={(iconName) => handleEmojiSelect(activePage.id, iconName)}
                  />
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => handleRenamePage(activePage.id, e.target.value)}
                    className="flex-1 bg-transparent text-2xl font-syne font-extrabold text-white outline-none border-none uppercase tracking-tight py-1 placeholder-zinc-800"
                  />
                </div>

                {/* NOTE | BLOG-IDEA | SNIPPET RENDERERS */}
                {(activePage.type === "note" || activePage.type === "blog-idea" || activePage.type === "snippet") && (
                  <div className="space-y-4">
                    {activePage.type === "blog-idea" && (
                      <BlogStatusBar
                        currentStatus={activePage.meta?.status || "Draft"}
                        onChange={(status) => handleBlogStatusChange(activePage.id, status)}
                        className="mb-4"
                      />
                    )}
                    
                    <BlockEditor
                      initialContent={activePage.content}
                      onChange={(jsonContent) => saveEditorContent(activePage.id, jsonContent)}
                      statusIndicator={saveStatus}
                    />
                  </div>
                )}

                {/* PROJECT WORKSPACE KANBAN BOARD */}
                {activePage.type === "project" && (
                  <div className="space-y-6">
                    {/* Top goals editor */}
                    <div className="p-4 bg-[#0a0a0a] border border-[#262626]/80 rounded-none relative">
                      <span className="absolute top-2 right-4 font-mono text-[7px] text-zinc-550 uppercase tracking-widest font-bold">Goals & Desc</span>
                      <BlockEditor
                        initialContent={activePage.content}
                        onChange={(jsonContent) => saveEditorContent(activePage.id, jsonContent)}
                        statusIndicator={saveStatus}
                      />
                    </div>

                    {/* Bottom Kanban boards */}
                    <div className="pt-4">
                      <KanbanBoard
                        tasks={tasks}
                        pageId={activePage.id}
                        onReorder={handleReorderTasks}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                      />
                    </div>
                  </div>
                )}

                {/* BOOKMARKS LISTING VIEWS */}
                {activePage.type === "bookmark-collection" && (
                  <BookmarkGrid
                    bookmarks={bookmarks}
                    pageId={activePage.id}
                    onAddBookmark={handleAddBookmark}
                    onUpdateBookmark={handleUpdateBookmark}
                    onDeleteBookmark={handleDeleteBookmark}
                  />
                )}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center font-mono select-none">
                <FiGrid className="h-8 w-8 text-zinc-700 mb-2 animate-pulse" />
                <h4 className="text-zinc-500 uppercase text-[10px] tracking-widest font-bold">Workspace dashboard</h4>
                <p className="text-zinc-650 text-[9px] mt-1">Select or create a workspace file from the sidebar browser</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Global Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        projects={projectPages}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSave={handleQuickCaptureSave}
      />
    </div>
  );
}

// React ref cache helper
import { useRef } from "react";
