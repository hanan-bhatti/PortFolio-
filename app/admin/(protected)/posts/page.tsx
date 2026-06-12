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
          <Link href="/admin/posts/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            + New Post
          </Link>
        }
      />
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
    </div>
  );
}
