"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { togglePublishAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

export default function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await togglePublishAction(id);
          if (res.error) toast.error(res.error);
          else router.refresh();
        })
      }
      className={cn(
        "border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50",
        published
          ? "border-[#10B981] bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20"
          : "border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800"
      )}
    >
      {published ? "Published" : "Draft"}
    </button>
  );
}
