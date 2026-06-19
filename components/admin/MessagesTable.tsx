"use client";

/**
 * @file components/admin/MessagesTable.tsx
 * @description React component for MessagesTable.tsx under the admin category.
 * Supports mobile layouts, custom accent colors, and sharp borders.
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
      <div className="overflow-hidden border border-[#262626] bg-[#0c0c0c] rounded-none">
        <ul className="divide-y divide-[#262626]">
          {messages.map((msg) => (
            <li key={msg.id}>
              <button
                type="button"
                onClick={() => open(msg)}
                className="flex w-full items-start sm:items-center gap-3 sm:gap-4 px-4 py-3 text-left hover:bg-white/[0.02]"
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-none mt-1.5 sm:mt-0", msg.read ? "bg-zinc-700" : "bg-[#F59E0B]")} />
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                  <span className="w-full sm:w-40 shrink-0 truncate text-sm font-medium text-zinc-200">{msg.name}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-400">{msg.subject}</span>
                  <span className="shrink-0 text-[10px] sm:text-xs text-zinc-500 sm:text-zinc-600 font-mono mt-0.5 sm:mt-0">{formatDate(msg.createdAt)}</span>
                </div>
              </button>
            </li>
          ))}
          {messages.length === 0 ? <li className="px-4 py-10 text-center text-sm text-zinc-600">No messages yet.</li> : null}
        </ul>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg border border-[#262626] bg-[#0c0c0c] p-6 rounded-none" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{selected.subject}</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {selected.name} ·{" "}
                  <a href={`mailto:${selected.email}`} className="text-[#F59E0B] hover:underline">
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
                className="border border-[#262626] px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50 rounded-none transition-colors"
              >
                Mark as {selected.read ? "unread" : "read"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onDelete(selected.id)}
                className="bg-red-950/40 border border-red-800 text-red-400 px-4 py-2 text-sm font-medium hover:bg-red-900/40 disabled:opacity-50 rounded-none transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
