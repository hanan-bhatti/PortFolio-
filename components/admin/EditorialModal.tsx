"use client";

/**
 * @file components/admin/EditorialModal.tsx
 * @description React component for EditorialModal.tsx under the admin category.
 * 
 * @exports
 * - EditorialModal (default): Main React component or function
 */

import { useEffect } from "react";
import { FiAlertTriangle, FiInfo, FiTrash2 } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface EditorialModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "info" | "warning" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function EditorialModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = "info",
  onConfirm,
  onCancel,
}: EditorialModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeStyles = {
    info: {
      border: "border-[#10B981]",
      bg: "bg-[#10B981]/5",
      text: "text-[#10B981]",
      btnBg: "bg-[#10B981] hover:bg-[#10B981]/80 text-black",
      icon: FiInfo,
    },
    warning: {
      border: "border-[#F59E0B]",
      bg: "bg-[#F59E0B]/5",
      text: "text-[#F59E0B]",
      btnBg: "bg-[#F59E0B] hover:bg-[#F59E0B]/80 text-black",
      icon: FiAlertTriangle,
    },
    danger: {
      border: "border-red-500",
      bg: "bg-red-500/5",
      text: "text-red-500",
      btnBg: "bg-red-500 hover:bg-red-600 text-white",
      icon: FiTrash2,
    },
  };

  const styles = typeStyles[type];
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm transition-all duration-200">
      <div className={cn("w-full max-w-md border bg-[#0a0a0a] p-6 shadow-2xl transition-all", styles.border)}>
        {/* Title / Icon */}
        <div className="flex items-start gap-4">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center border", styles.border, styles.bg)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              {title}
            </h3>
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3 font-mono text-[10px] font-bold uppercase tracking-widest">
          <button
            type="button"
            onClick={onCancel}
            className="border border-zinc-850 bg-black/40 px-4 py-2.5 text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn("px-4 py-2.5 transition-colors", styles.btnBg)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
