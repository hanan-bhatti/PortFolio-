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
        }))}
        initialEnabled={settings.photography_enabled}
        initialTitle={settings.photography_title}
        initialDescription={settings.photography_description}
      />
    </div>
  );
}
