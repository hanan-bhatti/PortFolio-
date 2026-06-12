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
        "rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
        published ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-500/15 text-zinc-400"
      )}
    >
      {published ? "Published" : "Draft"}
    </button>
  );
}
