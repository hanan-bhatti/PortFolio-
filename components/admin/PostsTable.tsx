"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deletePostAction } from "@/lib/actions";
import { formatDate } from "@/lib/utils";
import PublishToggle from "@/components/admin/PublishToggle";

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
  const [isPending, startTransition] = useTransition();

  const onDelete = (id: string, title: string): void => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deletePostAction(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Post deleted");
        router.refresh();
      }
    });
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.03] text-xs text-zinc-500 uppercase">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Views</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-white/[0.02]">
              <td className="max-w-xs px-4 py-3">
                <p className="truncate font-medium text-zinc-200">{post.title}</p>
                <p className="truncate text-xs text-zinc-600">/{post.slug}</p>
              </td>
              <td className="px-4 py-3">
                <PublishToggle id={post.id} published={post.published} />
              </td>
              <td className="px-4 py-3 text-zinc-400">{formatDate(post.createdAt)}</td>
              <td className="px-4 py-3 font-mono text-zinc-400">{post.views}</td>
              <td className="px-4 py-3 text-right">
                <Link href={`/admin/posts/${post.id}/edit`} className="mr-3 text-indigo-400 hover:underline">
                  Edit
                </Link>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onDelete(post.id, post.title)}
                  className="text-red-400 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {posts.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-zinc-600">
                No posts yet. Create your first one!
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
