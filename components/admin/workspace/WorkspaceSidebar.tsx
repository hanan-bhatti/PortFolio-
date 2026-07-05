"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiChevronDown,
  FiChevronRight,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiFolder,
  FiFileText,
  FiBookmark,
  FiLayout,
  FiSettings,
  FiTerminal,
  FiArrowLeft
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { ICON_MAP } from "./IconPicker";

interface PageItem {
  id: string;
  title: string;
  emoji: string;
  type: string; // note | project | blog-idea | snippet | bookmark-collection
  parentId: string | null;
}

interface WorkspaceSidebarProps {
  pages: PageItem[];
  activePageId: string | null;
  onSelectPage: (id: string | null) => void;
  onCreatePage: (type: string, parentId?: string | null) => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, newTitle: string) => void;
  onTriggerQuickCapture: () => void;
  collapsed: boolean;
}

const CATEGORIES = [
  { type: "note", label: "Notes", icon: <FiFileText className="h-3.5 w-3.5 text-zinc-550 shrink-0" /> },
  { type: "project", label: "Projects", icon: <FiFolder className="h-3.5 w-3.5 text-[#F59E0B] shrink-0" /> },
  { type: "blog-idea", label: "Blog Ideas", icon: <FiEdit className="h-3.5 w-3.5 text-sky-500 shrink-0" /> },
  { type: "snippet", label: "Snippets", icon: <FiTerminal className="h-3.5 w-3.5 text-[#16A34A] shrink-0" /> },
  { type: "bookmark-collection", label: "Bookmarks", icon: <FiBookmark className="h-3.5 w-3.5 text-pink-500 shrink-0" /> }
];

export default function WorkspaceSidebar({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onRenamePage,
  onTriggerQuickCapture,
  collapsed
}: WorkspaceSidebarProps) {
  // Toggle states for categories
  const [expandedCats, setExpandedCats] = useState<{ [key: string]: boolean }>({
    note: true,
    project: true,
    "blog-idea": true,
    snippet: true,
    "bookmark-collection": true
  });

  // Track parent items showing children
  const [expandedParents, setExpandedParents] = useState<{ [key: string]: boolean }>({});
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  const toggleCategory = (type: string) => {
    setExpandedCats((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleParent = (id: string) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartRename = (e: React.MouseEvent, page: PageItem) => {
    e.stopPropagation();
    setRenamingPageId(page.id);
    setRenameText(page.title);
  };

  const handleRenameSubmit = (id: string) => {
    if (renameText.trim()) {
      onRenamePage(id, renameText);
    }
    setRenamingPageId(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "note":
        return <FiFileText className="h-3.5 w-3.5 text-zinc-550 shrink-0" />;
      case "project":
        return <FiFolder className="h-3.5 w-3.5 text-[#F59E0B] shrink-0" />;
      case "blog-idea":
        return <FiEdit className="h-3.5 w-3.5 text-sky-500 shrink-0" />;
      case "snippet":
        return <FiTerminal className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />;
      case "bookmark-collection":
        return <FiBookmark className="h-3.5 w-3.5 text-pink-500 shrink-0" />;
      default:
        return <FiFileText className="h-3.5 w-3.5 text-zinc-550 shrink-0" />;
    }
  };

  const getPageIcon = (page: PageItem) => {
    if (page.emoji && ICON_MAP[page.emoji]) {
      const CustomIcon = ICON_MAP[page.emoji];
      return <CustomIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />;
    }
    return getTypeIcon(page.type);
  };

  // Build tree client-side
  const renderPageItem = (page: PageItem, depth = 0) => {
    const hasChildren = pages.some((p) => p.parentId === page.id);
    const isExpanded = expandedParents[page.id];
    const isActive = activePageId === page.id;

    return (
      <div key={page.id} className="space-y-0.5">
        <div
          onClick={() => onSelectPage(page.id)}
          style={{ paddingLeft: `${depth * 10 + 8}px` }}
          className={cn(
            "group flex items-center justify-between py-1.5 pr-2 font-mono text-[10px] text-zinc-400 hover:text-white transition-all cursor-pointer border-l-2 select-none rounded-none",
            isActive
              ? "border-amber bg-amber/5 text-white font-bold"
              : "border-transparent hover:bg-zinc-900/40"
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleParent(page.id);
                }}
                className="text-zinc-650 hover:text-white p-0.5"
              >
                {isExpanded ? <FiChevronDown className="h-3 w-3" /> : <FiChevronRight className="h-3 w-3" />}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            {getPageIcon(page)}

            {renamingPageId === page.id ? (
              <input
                type="text"
                autoFocus
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                onBlur={() => handleRenameSubmit(page.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit(page.id);
                  if (e.key === "Escape") setRenamingPageId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-[#0c0c0c] border border-amber/40 outline-none text-white px-1 text-[9px]"
              />
            ) : (
              <span className="truncate">{page.title}</span>
            )}
          </div>

          {/* Action Hover Controls */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-1">
            {depth < 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreatePage(page.type, page.id);
                }}
                className="hover:text-amber p-0.5"
                title="Add sub-page"
              >
                <FiPlus className="h-2.5 w-2.5" />
              </button>
            )}
            <button
              onClick={(e) => handleStartRename(e, page)}
              className="hover:text-amber p-0.5"
              title="Rename page"
            >
              <FiEdit className="h-2.5 w-2.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete page "${page.title}"?`)) onDeletePage(page.id);
              }}
              className="hover:text-red-500 p-0.5"
              title="Delete page"
            >
              <FiTrash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        {/* Children items */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {pages
              .filter((p) => p.parentId === page.id)
              .map((child) => renderPageItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (collapsed) return null;

  return (
    <aside className="w-[240px] bg-[#0c0c0c] border-r border-[#262626] h-full flex flex-col justify-between shrink-0 p-4 select-none">
      <div className="space-y-5">
        {/* Back Link */}
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-zinc-550 uppercase tracking-widest hover:text-amber transition-colors outline-none pb-2 border-b border-[#262626]/60"
        >
          <FiArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>

        {/* Quick Capture Button */}
        <button
          data-tour="create-node-btn"
          onClick={onTriggerQuickCapture}
          className="w-full flex items-center justify-between border border-amber/35 hover:border-amber bg-amber/5 hover:bg-amber/10 px-3 py-2 font-mono text-[9px] font-bold text-amber uppercase tracking-wider transition-all rounded-none outline-none"
        >
          <span>⌘ Quick Capture</span>
          <span className="text-[7px] border border-amber/30 px-1 bg-black/40">⌘K</span>
        </button>

        {/* Browser File Tree */}
        <div data-tour="workspace-explorer" className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
          {CATEGORIES.map((cat) => {
            const catPages = pages.filter((p) => p.type === cat.type && p.parentId === null);
            const isCatExpanded = expandedCats[cat.type];

            return (
              <div key={cat.type} className="space-y-1">
                {/* Category Header */}
                <div className="flex items-center justify-between border-b border-[#262626]/60 pb-1 font-mono text-[9px] font-bold text-zinc-550 uppercase tracking-widest">
                  <button
                    onClick={() => toggleCategory(cat.type)}
                    className="flex items-center gap-1.5 hover:text-white"
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                  <button
                    onClick={() => onCreatePage(cat.type, null)}
                    className="hover:text-amber"
                    title={`New ${cat.label}`}
                  >
                    <FiPlus className="h-3 w-3" />
                  </button>
                </div>

                {/* Pages List */}
                {isCatExpanded && (
                  <div className="space-y-0.5">
                    {catPages.map((page) => renderPageItem(page))}
                    {catPages.length === 0 && (
                      <p className="text-[8px] font-mono text-zinc-700 italic pl-2 py-1">Empty</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-[#262626]/60 pt-3 flex justify-between font-mono text-[8px] text-zinc-650 uppercase tracking-wider">
        <span>Workspace browser</span>
        <span>{pages.length} Pages</span>
      </div>
    </aside>
  );
}
