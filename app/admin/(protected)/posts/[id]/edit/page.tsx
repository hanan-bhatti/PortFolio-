/**
 * @file app/admin/(protected)/posts/[id]/edit/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - EditPostPage (default): Main React component or function
 * - dynamic: Constant / Helper
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import PostEditor from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div>
      <PageHeader
        title="Edit Post"
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Posts", href: "/admin/posts" },
          { label: post.title },
        ]}
      />
      <PostEditor
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          tags: post.tags,
          published: post.published,
        }}
      />
    </div>
  );
}
