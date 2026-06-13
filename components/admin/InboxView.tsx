"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteThreadAction, markThreadReadAction, sendReplyAction } from "@/lib/actions";
import { formatDate, cn } from "@/lib/utils";
import { FiMail, FiTrash2, FiSend, FiArrowLeft, FiUser } from "react-icons/fi";
import EditorialModal from "./EditorialModal";

export interface ThreadMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  isAdminReply: boolean;
  createdAt: Date | string;
}

export interface MessageThread {
  email: string;
  name: string;
  lastMessageAt: Date | string;
  hasUnread: boolean;
  messages: ThreadMessage[];
}

export default function InboxView({ initialThreads }: { initialThreads: MessageThread[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selected Thread
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  // Reply message
  const [replyMessage, setReplyMessage] = useState("");

  // Modal State for thread deletion
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of message thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedThread = initialThreads.find((t) => t.email.toLowerCase() === selectedEmail?.toLowerCase());

  // Mark thread read when opened
  useEffect(() => {
    if (selectedThread && selectedThread.hasUnread) {
      startTransition(async () => {
        await markThreadReadAction(selectedThread.email);
        router.refresh();
      });
    }
    scrollToBottom();
  }, [selectedEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedThread?.messages.length]);

  // Filter threads
  const filteredThreads = initialThreads.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.email.toLowerCase().includes(term) ||
      t.messages.some((m) => m.subject.toLowerCase().includes(term) || m.message.toLowerCase().includes(term))
    );
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail || !replyMessage.trim()) return;

    const toastId = toast.loading("Sending email reply...");
    const res = await sendReplyAction(selectedEmail, replyMessage);
    if (res.error) {
      toast.error(res.error, { id: toastId });
    } else {
      toast.success("Reply sent and emailed successfully", { id: toastId });
      setReplyMessage("");
      router.refresh();
    }
  };

  const handleDeleteThread = async () => {
    if (!selectedEmail) return;
    const toastId = toast.loading("Deleting conversation...");
    const res = await deleteThreadAction(selectedEmail);
    setIsDeleteModalOpen(false);
    setSelectedEmail(null);
    if (res.error) {
      toast.error(res.error, { id: toastId });
    } else {
      toast.success("Conversation deleted", { id: toastId });
      router.refresh();
    }
  };

  const inputClass =
    "w-full border border-[#262626] bg-black/45 px-3 py-2.5 font-mono text-xs text-white placeholder-zinc-650 outline-none focus:border-[#F59E0B] transition-colors";

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[500px] border border-[#262626] bg-[#0c0c0c]">
      {/* THREADS LIST SIDEBAR */}
      <div className={cn(
        "flex w-full md:w-80 shrink-0 flex-col border-r border-[#262626] bg-black/20",
        selectedEmail ? "hidden md:flex" : "flex"
      )}>
        {/* Search */}
        <div className="p-4 border-b border-[#262626]">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#262626]/60">
          {filteredThreads.map((thread) => {
            const isActive = thread.email === selectedEmail;
            const lastMsg = thread.messages[thread.messages.length - 1];
            return (
              <button
                key={thread.email}
                type="button"
                onClick={() => setSelectedEmail(thread.email)}
                className={cn(
                  "flex w-full flex-col p-4 text-left font-mono text-xs transition-colors border-l-2",
                  isActive
                    ? "border-[#F59E0B] bg-[#F59E0B]/5"
                    : "border-transparent hover:bg-white/[0.01]"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[150px]">{thread.name}</span>
                  <span className="text-[9px] text-zinc-600">{formatDate(thread.lastMessageAt)}</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{thread.email}</div>
                <div className="mt-2 text-zinc-400 truncate w-full text-[11px]">
                  {lastMsg?.isAdminReply ? (
                    <span className="text-[#F59E0B] mr-1">You:</span>
                  ) : null}
                  {lastMsg?.message}
                </div>
                {thread.hasUnread && (
                  <div className="mt-2 flex items-center gap-1.5 self-start">
                    <span className="h-1.5 w-1.5 bg-[#10B981]" />
                    <span className="text-[8px] font-bold text-[#10B981] uppercase tracking-wider">Unread</span>
                  </div>
                )}
              </button>
            );
          })}
          {filteredThreads.length === 0 && (
            <div className="py-12 text-center font-mono text-xs text-zinc-650 uppercase">No conversations found</div>
          )}
        </div>
      </div>

      {/* CONVERSATION THREAD */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#080808]/40",
        selectedEmail ? "flex" : "hidden md:flex"
      )}>
        {selectedThread ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#262626] bg-[#0c0c0c] px-6 py-4">
              <div className="flex items-center gap-4">
                {/* Back button on mobile */}
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="md:hidden text-zinc-400 hover:text-white border border-[#262626] p-1.5"
                >
                  <FiArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">{selectedThread.name}</h3>
                  <a
                    href={`mailto:${selectedThread.email}`}
                    className="font-mono text-[10px] text-zinc-500 hover:text-[#F59E0B] hover:underline"
                  >
                    {selectedThread.email}
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="border border-red-500 bg-red-500/10 p-2 font-mono text-[9px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/25 transition-all"
                title="Delete Conversation"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Scrollable Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
              {selectedThread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%] font-mono text-xs",
                    msg.isAdminReply ? "self-end items-end" : "self-start items-start"
                  )}
                >
                  <div className="mb-1 text-[9px] text-zinc-600">
                    {msg.isAdminReply ? "Admin Reply" : msg.name} • {formatDate(msg.createdAt)}
                  </div>
                  <div className={cn(
                    "border p-4 whitespace-pre-line leading-relaxed",
                    msg.isAdminReply
                      ? "border-[#F59E0B] bg-[#F59E0B]/5 text-white"
                      : "border-[#262626] bg-black/30 text-zinc-350"
                  )}>
                    {!msg.isAdminReply && (
                      <div className="mb-2 font-bold text-white border-b border-[#262626] pb-1 uppercase text-[10px] tracking-wide">
                        Subject: {msg.subject}
                      </div>
                    )}
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Composer */}
            <form onSubmit={handleSendReply} className="border-t border-[#262626] bg-[#0c0c0c] p-4 flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  rows={3}
                  placeholder={`Write an email reply to ${selectedThread.name}...`}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !replyMessage.trim()}
                className="border border-[#10B981] bg-[#10B981]/15 px-4 py-6 font-mono text-xs font-bold uppercase tracking-widest text-[#10B981] hover:bg-[#10B981]/30 disabled:opacity-30 transition-all flex flex-col items-center justify-center gap-1.5 h-[72px] shrink-0"
              >
                <FiSend className="h-4 w-4" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          /* Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <FiMail className="h-10 w-10 text-zinc-700 mb-3" />
            <h3 className="font-mono text-xs font-bold text-zinc-550 uppercase tracking-widest">Select a Conversation</h3>
            <p className="font-sans text-xs text-zinc-650 max-w-xs mt-1 leading-relaxed">
              Choose an active email thread from the left pane to view message history and send responses.
            </p>
          </div>
        )}

        {/* Terminate Conversation Modal */}
        <EditorialModal
          isOpen={isDeleteModalOpen}
          type="danger"
          title="Delete Conversation?"
          description="Are you sure you want to delete this message thread? This will permanently delete all messages in this conversation from the database."
          confirmLabel="Delete Thread"
          cancelLabel="Keep Thread"
          onConfirm={handleDeleteThread}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      </div>
    </div>
  );
}
