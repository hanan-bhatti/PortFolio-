import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import PageHeader from "@/components/admin/PageHeader";
import PublishToggle from "@/components/admin/PublishToggle";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalPosts, publishedPosts, totalProjects, unreadMessages, recentMessages, recentPosts] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { published: true } }),
      prisma.project.count(),
      prisma.contactMessage.count({ where: { read: false } }),
      prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  const stats = [
    { label: "Total Posts", value: totalPosts },
    { label: "Published Posts", value: publishedPosts },
    { label: "Total Projects", value: totalProjects },
    { label: "Unread Messages", value: unreadMessages },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        crumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
        action={
          <div className="flex gap-3">
            <Link href="/admin/posts/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              + New Post
            </Link>
            <Link href="/admin/projects/new" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">
              + New Project
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Messages</h2>
            <Link href="/admin/messages" className="text-xs text-indigo-400 hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-white/5">
            {recentMessages.map((msg) => (
              <li key={msg.id} className="py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-200">
                    {!msg.read ? <span className="mr-2 inline-block h-2 w-2 rounded-full bg-cyan-400" /> : null}
                    {msg.name}
                  </p>
                  <span className="text-xs text-zinc-500">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="mt-1 truncate text-xs text-zinc-500">{msg.subject}</p>
              </li>
            ))}
            {recentMessages.length === 0 ? <li className="py-6 text-center text-sm text-zinc-600">No messages yet</li> : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Posts</h2>
            <Link href="/admin/posts" className="text-xs text-indigo-400 hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-white/5">
            {recentPosts.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/admin/posts/${post.id}/edit`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200 hover:text-white">{post.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{formatDate(post.createdAt)}</p>
                </Link>
                <PublishToggle id={post.id} published={post.published} />
              </li>
            ))}
            {recentPosts.length === 0 ? <li className="py-6 text-center text-sm text-zinc-600">No posts yet</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
