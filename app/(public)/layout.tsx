import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import CookieBanner from "@/components/ui/CookieBanner";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { getSiteSettings } from "@/lib/settings";

const getLatestProjects = unstable_cache(
  async () => {
    try {
      return await prisma.project.findMany({
        orderBy: [
          { featured: "desc" },
          { order: "asc" },
          { createdAt: "desc" },
        ],
        take: 3,
        select: {
          slug: true,
          title: true,
          coverImage: true,
          techStack: true,
        },
      });
    } catch (error) {
      console.error("Failed to fetch latest projects for mega menu:", error);
      return null;
    }
  },
  ["latest-projects-mega-menu"],
  { revalidate: 60, tags: ["projects"] }
);

const getLatestPosts = unstable_cache(
  async () => {
    try {
      return await prisma.post.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          slug: true,
          title: true,
          coverImage: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.error("Failed to fetch latest posts for mega menu:", error);
      return null;
    }
  },
  ["latest-posts-mega-menu"],
  { revalidate: 60, tags: ["posts"] }
);

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [projects, postsRaw, settings, resumeRow] = await Promise.all([
    getLatestProjects(),
    getLatestPosts(),
    getSiteSettings(),
    prisma.resumeSettings.findFirst({ where: { key: "resume_enabled" } }),
  ]);
  const posts = postsRaw
    ? postsRaw.map((post) => ({
        slug: post.slug,
        title: post.title,
        coverImage: post.coverImage,
        createdAt: new Date(post.createdAt).toISOString(),
      }))
    : null;

  const analyticsEnabled = settings.analytics_enabled !== "false";

  return (
    <>
      <Navbar
        initialProjects={projects}
        initialPosts={posts}
        photographyEnabled={settings.photography_enabled === "true"}
        resumeEnabled={resumeRow?.value !== "false"}
      />
      <main className="relative z-10 min-h-screen">{children}</main>
      <Footer />
      {analyticsEnabled && <AnalyticsProvider />}
      {analyticsEnabled && <CookieBanner text={settings.cookie_consent_text} />}
    </>
  );
}
