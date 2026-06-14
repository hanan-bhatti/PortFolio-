/**
 * @file app/admin/(protected)/layout.tsx
 * @description Next.js route view page or layout component for layout.tsx.
 * 
 * @exports
 * - AdminLayout (default): Main React component or function
 * - metadata: Constant / Helper
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/admin/Sidebar";

export const metadata = { robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || !session?.sessionToken) {
    redirect("/admin/login");
  }

  const unreadCount = await prisma.contactMessage.count({ where: { read: false } });

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-200">
      <Sidebar unreadCount={unreadCount} userEmail={session.user.email ?? "admin"} />
      <div className="min-w-0 flex-1 p-8">{children}</div>
    </div>
  );
}
