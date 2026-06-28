import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import NewsletterManager from "@/components/admin/NewsletterManager";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const [posts, rawSubscribers, campaigns, totalOpens] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.postNotifyRequest.findMany({
      select: { id: true, email: true, confirmed: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.emailCampaign.findMany({
      include: {
        post: { select: { title: true } },
        opens: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.emailOpen.count(),
  ]);

  // Map subscribers, converting dates to strings for client components
  const subscribers = rawSubscribers.map((s) => ({
    id: s.id,
    email: s.email,
    confirmed: s.confirmed,
    createdAt: s.createdAt.toISOString(),
  }));

  // Fetch campaign clicks in parallel
  const campaignsWithStats = await Promise.all(
    campaigns.map(async (camp) => {
      const shortLink = await prisma.shortLink.findFirst({
        where: {
          targetUrl: {
            contains: camp.id,
          },
        },
        include: { clicks: true },
      });
      const clicksCount = shortLink ? shortLink.clicks.length : 0;
      return {
        id: camp.id,
        subject: camp.subject,
        sentCount: camp.sentCount,
        createdAt: camp.createdAt.toISOString(),
        postTitle: camp.post.title,
        opensCount: camp.opens.length,
        clicksCount,
      };
    })
  );

  // Compute stats aggregates
  const totalSubscribers = subscribers.length;
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalClicks = campaignsWithStats.reduce((sum, c) => sum + c.clicksCount, 0);

  const stats = {
    totalSubscribers,
    totalCampaigns,
    totalSent,
    totalOpens,
    totalClicks,
  };

  return (
    <div>
      <PageHeader
        title="Newsletter & Campaigns"
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Newsletter" }]}
      />
      <Suspense fallback={<div className="font-mono text-xs text-zinc-550">Loading metrics...</div>}>
        <NewsletterManager
          posts={posts}
          subscribers={subscribers}
          campaigns={campaignsWithStats}
          stats={stats}
        />
      </Suspense>
    </div>
  );
}
