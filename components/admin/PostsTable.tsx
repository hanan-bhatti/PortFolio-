"use client";

/**
 * @file components/admin/PostsTable.tsx
 * @description React component for PostsTable.tsx under the admin category.
 * 
 * @exports
 * - AdminPostRow: Type/Interface definition
 * - PostsTable (default): Main React component or function
 */

import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { deletePostAction } from "@/lib/actions";
import { formatDate, cn } from "@/lib/utils";
import PublishToggle from "@/components/admin/PublishToggle";
import { FiGrid, FiList, FiTrash2, FiEdit3, FiEye } from "react-icons/fi";
import EditorialModal from "./EditorialModal";

export interface AdminPostRow {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  views: number;
  createdAt: string;
}

export default function PostsTable({ posts }: { posts: AdminPostRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Layout state (list vs grid)
  const [activeLayout, setActiveLayoutState] = useState<string>("list");

  useEffect(() => {
    const saved = localStorage.getItem("admin_posts_layout");
    const urlParam = searchParams.get("layout");
    if (urlParam) {
      setActiveLayoutState(urlParam);
      localStorage.setItem("admin_posts_layout", urlParam);
    } else if (saved) {
      setActiveLayoutState(saved);
      const params = new URLSearchParams(window.location.search);
      params.set("layout", saved);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname, router]);

  const setLayout = (layout: string) => {
    setActiveLayoutState(layout);
    localStorage.setItem("admin_posts_layout", layout);
    const params = new URLSearchParams(searchParams.toString());
    params.set("layout", layout);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id, title } = deleteTarget;
    const toastId = toast.loading(`Deleting post "${title}"...`);
    startTransition(async () => {
      const res = await deletePostAction(id);
      setDeleteTarget(null);
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success("Post deleted successfully", { id: toastId });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Layout Toggle Bar */}
      <div className="flex justify-between items-center bg-[#0c0c0c] border border-[#262626] p-4 font-mono text-[10px] font-bold uppercase tracking-wider">
        <span className="text-zinc-500">
          {activeLayout === "list" ? "Overview of publishing posts" : "Grid overview of blog posts"}
        </span>
        <div className="flex gap-px bg-[#262626]">
          <button
            type="button"
            onClick={() => setLayout("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 transition-colors",
              activeLayout === "list"
                ? "bg-[#F59E0B] text-black"
                : "bg-[#080808]/80 text-zinc-500 hover:text-white"
            )}
          >
            <FiList className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => setLayout("grid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 transition-colors",
              activeLayout === "grid"
                ? "bg-[#F59E0B] text-black"
                : "bg-[#080808]/80 text-zinc-500 hover:text-white"
            )}
          >
            <FiGrid className="h-3.5 w-3.5" />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* LIST VIEW (Table) */}
      {activeLayout === "list" && (
        <div className="overflow-x-auto border border-[#262626]">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0c0c0c] border-b border-[#262626] text-[9px] text-zinc-500 uppercase font-bold tracking-widest">
              <tr>
                <th className="px-4 py-3">Title & Path</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] bg-[#080808]/20">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-white/[0.01]">
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate font-medium text-white">{post.title}</p>
                    <p className="truncate text-[10px] text-zinc-500 mt-0.5">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <PublishToggle id={post.id} published={post.published} />
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(post.createdAt)}</td>
                  <td className="px-4 py-3 text-zinc-400 font-bold">{post.views}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 font-bold uppercase tracking-wider text-[10px]">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="border border-[#262626] bg-black/30 px-2.5 py-1 text-zinc-350 hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                        className="border border-red-500/30 bg-red-500/5 px-2.5 py-1 text-red-400 hover:border-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-zinc-600">
                    No posts found. Create your first post!
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {/* GRID VIEW */}
      {activeLayout === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border border-[#262626] bg-[#0c0c0c] p-5 flex flex-col justify-between font-mono text-xs hover:-translate-y-1 hover:border-amber/50 hover:shadow-[0_4px_20px_-4px_rgba(245,158,11,0.08)] transition-all duration-300 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 border-b border-[#262626]/60 pb-2.5">
                  <h4 className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-amber transition-colors">
                    {post.title}
                  </h4>
                  <PublishToggle id={post.id} published={post.published} />
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span className="text-amber">/{post.slug}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 text-[8px] font-bold border uppercase shrink-0",
                    post.published ? "border-[#10B981] bg-[#10B981]/5 text-[#10B981]" : "border-zinc-700 bg-zinc-800/40 text-zinc-400"
                  )}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1">
                  <span>{formatDate(post.createdAt)}</span>
                  <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 border border-[#262626] text-white">
                    <FiEye className="h-3 w-3 text-amber shrink-0 animate-pulse" />
                    <span className="font-bold">{post.views} views</span>
                  </span>
                </div>
              </div>
 
              <div className="mt-6 grid grid-cols-2 gap-2 font-bold uppercase tracking-wider text-[10px] text-center">
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="flex items-center justify-center gap-1.5 border border-[#262626] bg-black/30 py-2 text-zinc-300 hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors"
                >
                  <FiEdit3 className="h-3 w-3 shrink-0" />
                  <span>Edit</span>
                </Link>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                  className="flex items-center justify-center gap-1.5 border border-red-500/30 bg-red-500/5 py-2 text-red-400 hover:border-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                >
                  <FiTrash2 className="h-3 w-3 shrink-0" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 ? (
            <div className="col-span-full border border-[#262626] bg-[#0c0c0c] py-12 text-center font-mono text-xs text-zinc-650 uppercase">
              No posts found. Create your first post!
            </div>
          ) : null}
        </div>
      )}

      {/* Editorial Delete Confirmation Modal */}
      <EditorialModal
        isOpen={deleteTarget !== null}
        type="danger"
        title="Delete Post?"
        description={`Are you sure you want to permanently delete the post "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete Post"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
