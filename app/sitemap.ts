/**
 * @file app/sitemap.ts
 * @description Next.js route view page or layout component for sitemap.ts.
 * 
 * @exports
 * - sitemap (default): Main React component or function
 */

import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let posts: Array<{ slug: string; updatedAt: Date }> = [];
  let projects: Array<{ slug: string; createdAt: Date }> = [];

  try {
    // Fetch published blog posts
    posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });

    // Fetch all projects (projects are public by default in the schema)
    projects = await prisma.project.findMany({
      select: { slug: true, createdAt: true },
    });
  } catch (err) {
    console.warn("Sitemap: Database is offline/unreachable during build. Returning static routes only.", err);
  }

  // Static routes
  const routes = [
    "",
    "/about",
    "/projects",
    "/blog",
    "/photography",
    "/resume",
    "/contact",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic blog routes
  const blogRoutes = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic project routes
  const projectRoutes = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: project.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...routes, ...blogRoutes, ...projectRoutes];
}
