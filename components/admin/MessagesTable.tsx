"use client";

/**
 * @file components/admin/MessagesTable.tsx
 * @description React component for MessagesTable.tsx under the admin category.
 * 
 * @exports
 * - AdminMessageRow: Type/Interface definition
 * - MessagesTable (default): Main React component or function
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteMessageAction, markMessageReadAction } from "@/lib/actions";
import { formatDate, cn } from "@/lib/utils";

export interface AdminMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function MessagesTable({ messages }: { messages: AdminMessageRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<AdminMessageRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = (msg: AdminMessageRow): void => {
    setSelected(msg);
    if (!msg.read) {
      startTransition(async () => {
        await markMessageReadAction(msg.id, true);
        router.refresh();
      });
    }
  };

  const onDelete = (id: string): void => {
    if (!window.confirm("Delete this message?")) return;
    startTransition(async () => {
      const res = await deleteMessageAction(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Message deleted");
        setSelected(null);
        router.refresh();
      }
    });
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <ul className="divide-y divide-white/5">
          {messages.map((msg) => (
            <li key={msg.id}>
              <button type="button" onClick={() => open(msg)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-white/[0.03]">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", msg.read ? "bg-zinc-700" : "bg-cyan-400")} />
                <span className="w-40 shrink-0 truncate text-sm font-medium text-zinc-200">{msg.name}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-400">{msg.subject}</span>
                <span className="shrink-0 text-xs text-zinc-600">{formatDate(msg.createdAt)}</span>
              </button>
            </li>
          ))}
          {messages.length === 0 ? <li className="px-4 py-10 text-center text-sm text-zinc-600">No messages yet.</li> : null}
        </ul>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#15151f] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{selected.subject}</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {selected.name} ·{" "}
                  <a href={`mailto:${selected.email}`} className="text-cyan-400 hover:underline">
                    {selected.email}
                  </a>
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">{formatDate(selected.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white">
                ✕
              </button>
            </div>
            <p className="max-h-72 overflow-y-auto text-sm leading-relaxed whitespace-pre-line text-zinc-300">{selected.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await markMessageReadAction(selected.id, !selected.read);
                    setSelected({ ...selected, read: !selected.read });
                    router.refresh();
                  });
                }}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50"
              >
                Mark as {selected.read ? "unread" : "read"}
              </button>
              <button type="button" disabled={isPending} onClick={() => onDelete(selected.id)} className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
