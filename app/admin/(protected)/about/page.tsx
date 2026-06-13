import { Suspense } from "react";
import { getAboutSettings } from "@/lib/settings";
import PageHeader from "@/components/admin/PageHeader";
import AboutForm from "@/components/admin/AboutForm";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const about = await getAboutSettings();

  return (
    <div>
      <PageHeader
        title="About Page Settings"
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "About" }]}
      />
      <div className="mt-6">
        <Suspense fallback={<div className="font-mono text-xs text-zinc-500">Loading form...</div>}>
          <AboutForm initial={about} />
        </Suspense>
      </div>
    </div>
  );
}
