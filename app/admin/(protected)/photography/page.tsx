/**
 * @file app/admin/(protected)/photography/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - AdminPhotographyPage (default): Main React component or function
 * - dynamic: Constant / Helper
 */

import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import PageHeader from "@/components/admin/PageHeader";
import PhotographyAdmin from "@/components/admin/PhotographyAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPhotographyPage() {
  const settings = await getSiteSettings();
  const photos = await prisma.photo.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  // Query recent photo interactions
  const rawInteractions = await prisma.photoInteraction.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      photo: {
        select: {
          title: true,
          imageUrl: true,
        },
      },
    },
  });

  // Fetch visitor geo-location/browser telemetry
  const visitorIds = Array.from(new Set(rawInteractions.map((i) => i.visitorId)));
  const visitors = await prisma.visitor.findMany({
    where: {
      id: { in: visitorIds },
    },
    select: {
      id: true,
      country: true,
      city: true,
      device: true,
      browser: true,
    },
  });

  const visitorMap = new Map(visitors.map((v) => [v.id, v]));

  const interactions = rawInteractions.map((item) => {
    const visitor = visitorMap.get(item.visitorId);
    return {
      id: item.id,
      photoId: item.photoId,
      photoTitle: item.photo.title || "Untitled Photo",
      photoImageUrl: item.photo.imageUrl,
      visitorId: item.visitorId,
      type: item.type,
      createdAt: item.createdAt.toISOString(),
      geo: visitor
        ? {
            country: visitor.country || "Unknown",
            city: visitor.city || "Unknown",
            device: visitor.device || "Unknown",
            browser: visitor.browser || "Unknown",
          }
        : null,
    };
  });

  return (
    <div>
      <PageHeader
        title="Photography CMS"
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Photography" }]}
      />
      <PhotographyAdmin
        initialPhotos={photos.map((p) => ({
          id: p.id,
          title: p.title,
          imageUrl: p.imageUrl,
          order: p.order,
          visible: p.visible,
          exif_data: p.exif_data,
          likes: p.likes,
          downloads: p.downloads,
          shares: p.shares,
        }))}
        interactions={interactions}
        initialEnabled={settings.photography_enabled}
        initialTitle={settings.photography_title}
        initialDescription={settings.photography_description}
      />
    </div>
  );
}
