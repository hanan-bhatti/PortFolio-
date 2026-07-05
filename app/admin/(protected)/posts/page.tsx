/**
 * @file app/admin/(protected)/posts/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - AdminPostsPage (default): Main React component or function
 * - dynamic: Constant / Helper
 */

import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import PostsTable from "@/components/admin/PostsTable";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader
        title="Posts"
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Posts" }]}
        action={
          <Link data-tour="create-post-btn" href="/admin/posts/new" className="border border-amber bg-amber px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-amber/90 transition-all">
            + New Post
          </Link>
        }
      />
      <Suspense fallback={<div className="font-mono text-xs text-zinc-500">Loading posts...</div>}>
        <PostsTable
          posts={posts.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            published: p.published,
            views: p.views,
            createdAt: p.createdAt.toISOString(),
          }))}
        />
      </Suspense>
    </div>
  );
}
