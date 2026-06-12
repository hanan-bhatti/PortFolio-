import { getSiteSettings } from "@/lib/settings";
import PageHeader from "@/components/admin/PageHeader";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <PageHeader title="Site Settings" crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Settings" }]} />
      <SettingsForm initial={settings} />
    </div>
  );
}
