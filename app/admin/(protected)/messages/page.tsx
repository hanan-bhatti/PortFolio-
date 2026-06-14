/**
 * @file app/admin/(protected)/messages/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - AdminMessagesPage (default): Main React component or function
 * - dynamic: Constant / Helper
 */

import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import InboxView from "@/components/admin/InboxView";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Group messages by email
  const threadsMap: { [email: string]: any } = {};

  messages.forEach((m) => {
    const email = m.email.toLowerCase();
    if (!threadsMap[email]) {
      threadsMap[email] = {
        email: m.email,
        name: m.name,
        lastMessageAt: m.createdAt,
        hasUnread: false,
        messages: [],
      };
    }

    threadsMap[email].messages.push({
      id: m.id,
      name: m.name,
      email: m.email,
      subject: m.subject,
      message: m.message,
      read: m.read,
      isAdminReply: m.isAdminReply,
      createdAt: m.createdAt.toISOString(),
    });

    if (m.createdAt > threadsMap[email].lastMessageAt) {
      threadsMap[email].lastMessageAt = m.createdAt;
    }

    if (!m.isAdminReply && !m.read) {
      threadsMap[email].hasUnread = true;
    }

    if (!m.isAdminReply) {
      threadsMap[email].name = m.name;
    }
  });

  // Convert to array and sort by lastMessageAt descending
  const threads = Object.values(threadsMap)
    .map((t: any) => ({
      ...t,
      lastMessageAt: t.lastMessageAt.toISOString(),
    }))
    .sort((a: any, b: any) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return (
    <div>
      <PageHeader title="Inbox Messages" crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Messages" }]} />
      <InboxView initialThreads={threads} />
    </div>
  );
}
