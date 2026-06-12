import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import MessagesTable from "@/components/admin/MessagesTable";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Messages" crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Messages" }]} />
      <MessagesTable
        messages={messages.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          subject: m.subject,
          message: m.message,
          read: m.read,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
