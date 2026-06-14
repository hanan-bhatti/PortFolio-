/**
 * @file app/admin/(protected)/settings/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - AdminSettingsPage (default): Main React component or function
 * - dynamic: Constant / Helper
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSiteSettings } from "@/lib/settings";
import PageHeader from "@/components/admin/PageHeader";
import SettingsForm from "@/components/admin/SettingsForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTwoFactorSecret } from "@/lib/twofactor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/admin/login");
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    include: {
      sessions: {
        orderBy: { lastUsedAt: "desc" },
      },
    },
  });

  const twoFactorEnabled = user?.twoFactorEnabled || false;
  const new2faSecret = generateTwoFactorSecret();

  return (
    <div>
      <PageHeader title="Site Settings" crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Settings" }]} />
      <Suspense fallback={<div className="font-mono text-xs text-zinc-500">Loading settings...</div>}>
        <SettingsForm
          initial={settings}
          twoFactorEnabled={twoFactorEnabled}
          new2faSecret={new2faSecret}
          activeSessions={user?.sessions || []}
          currentSessionToken={session.sessionToken || ""}
        />
      </Suspense>
    </div>
  );
}
