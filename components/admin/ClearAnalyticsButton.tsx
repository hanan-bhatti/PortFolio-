"use client";

/**
 * @file components/admin/ClearAnalyticsButton.tsx
 * @description React component for ClearAnalyticsButton.tsx under the admin category.
 * 
 * @exports
 * - ClearAnalyticsButton (default): Main React component or function
 */

import { useTransition, useState } from "react";
import EditorialModal from "./EditorialModal";

interface ClearAnalyticsButtonProps {
  clearAction: () => Promise<void>;
}

export default function ClearAnalyticsButton({ clearAction }: ClearAnalyticsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleClear = () => {
    startTransition(async () => {
      try {
        await clearAction();
        setIsOpen(false);
      } catch (error) {
        console.error("Failed to clear analytics:", error);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="rounded-none border border-red-500/30 bg-red-500/5 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-red-500 hover:border-red-500 hover:bg-red-500/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? "Clearing..." : "Clear Analytics Data"}
      </button>

      <EditorialModal
        isOpen={isOpen}
        type="danger"
        title="Clear Analytics?"
        description="Are you sure you want to permanently clear all analytics data from the database? This action cannot be undone."
        confirmLabel="Clear Data"
        cancelLabel="Cancel"
        onConfirm={handleClear}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
