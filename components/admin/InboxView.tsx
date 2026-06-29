"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteThreadAction, markThreadReadAction, sendReplyAction } from "@/lib/actions";
import { formatDate, cn } from "@/lib/utils";
import { FiMail, FiTrash2, FiSend, FiArrowLeft, FiUser, FiTerminal, FiSearch, FiClock, FiCheckSquare } from "react-icons/fi";
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

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[550px] border border-[#262626] bg-[#0c0c0c] font-mono">
      
      {/* THREADS LIST SIDEBAR */}
      <div className={cn(
        "flex w-full md:w-80 shrink-0 flex-col border-r border-[#262626] bg-[#090909]",
        selectedEmail ? "hidden md:flex" : "flex"
      )}>
        {/* Search */}
        <div className="p-4 border-b border-[#262626] relative">
          <span className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
            <FiSearch className="text-zinc-500 w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search threads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-[#262626] bg-black text-xs text-white placeholder-zinc-500 outline-none focus:border-amber transition-colors rounded-none"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#262626]/40">
          {filteredThreads.map((thread) => {
            const isActive = thread.email === selectedEmail;
            const lastMsg = thread.messages[thread.messages.length - 1];
            const initials = thread.name.charAt(0).toUpperCase();

            return (
              <button
                key={thread.email}
                type="button"
                onClick={() => setSelectedEmail(thread.email)}
                className={cn(
                  "flex w-full gap-3 p-4 text-left font-mono text-xs transition-colors border-l-2 cursor-pointer",
                  isActive
                    ? "border-amber bg-white/[0.02]"
                    : "border-transparent hover:bg-white/[0.01]"
                )}
              >
                {/* Avatar circle */}
                <div className={cn(
                  "h-9 w-9 border flex items-center justify-center font-bold text-xs uppercase shrink-0 transition-colors",
                  thread.hasUnread 
                    ? "border-green/30 bg-green/10 text-green" 
                    : "border-[#262626] bg-black text-zinc-500"
                )}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex w-full items-center justify-between">
                    <span className="font-bold text-white truncate max-w-[120px]">{thread.name}</span>
                    <span className="text-[8px] text-zinc-500 flex items-center gap-1">
                      <FiClock className="w-2.5 h-2.5" />
                      {formatDate(thread.lastMessageAt)}
                    </span>
                  </div>
                  <div className="text-[9px] text-zinc-550 truncate mt-0.5">{thread.email}</div>
                  <div className="mt-2 text-zinc-400 truncate w-full text-[10px] leading-relaxed">
                    {lastMsg?.isAdminReply ? (
                      <span className="text-amber font-bold mr-1">You:</span>
                    ) : null}
                    {lastMsg?.message}
                  </div>
                  {thread.hasUnread && (
                    <div className="mt-2.5 inline-flex items-center gap-1 border border-green/30 bg-green/5 px-1.5 py-0.5">
                      <span className="h-1 w-1 bg-green" />
                      <span className="text-[7.5px] font-bold text-green uppercase tracking-wider">Unread</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          {filteredThreads.length === 0 && (
            <div className="py-12 text-center text-zinc-500 uppercase text-[10px] tracking-wider italic">
              No conversations found
            </div>
          )}
        </div>
      </div>

      {/* CONVERSATION THREAD */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#070707]",
        selectedEmail ? "flex" : "hidden md:flex"
      )}>
        {selectedThread ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#262626] bg-[#0c0c0c] px-6 py-4">
              <div className="flex items-center gap-3.5">
                {/* Back button on mobile */}
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="md:hidden text-zinc-400 hover:text-white border border-[#262626] p-1.5 bg-black"
                >
                  <FiArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">{selectedThread.name}</h3>
                  <a
                    href={`mailto:${selectedThread.email}`}
                    className="text-[10px] text-zinc-500 hover:text-amber hover:underline block mt-0.5"
                  >
                    {selectedThread.email}
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="border border-red-950 text-red-400 bg-red-950/20 p-2 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                title="Delete Conversation"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Scrollable Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col bg-[#080808]/20">
              {selectedThread.messages.map((msg) => {
                const isAdmin = msg.isAdminReply;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[85%] sm:max-w-[70%]",
                      isAdmin ? "self-end items-end" : "self-start items-start"
                    )}
                  >
                    {/* Timestamp header info */}
                    <div className="mb-1 text-[8.5px] text-zinc-500 flex items-center gap-1.5">
                      {isAdmin ? (
                        <>
                          <FiTerminal className="w-2.5 h-2.5 text-amber" />
                          <span className="font-bold text-amber">Admin Response</span>
                        </>
                      ) : (
                        <>
                          <FiUser className="w-2.5 h-2.5 text-zinc-500" />
                          <span>{msg.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>

                    {/* Chat Bubble Card */}
                    <div className={cn(
                      "border p-4 whitespace-pre-line leading-relaxed text-xs shadow-sm",
                      isAdmin
                        ? "border-amber/30 bg-amber/5 text-white"
                        : "border-[#262626] bg-[#0c0c0c] text-zinc-300"
                    )}>
                      {!isAdmin && (
                        <div className="mb-2 font-bold text-white border-b border-[#262626] pb-1 uppercase text-[9px] tracking-widest flex items-center gap-1.5">
                          <FiMail className="w-3 h-3 text-zinc-500" />
                          <span>Subject: {msg.subject}</span>
                        </div>
                      )}
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Composer */}
            <form onSubmit={handleSendReply} className="border-t border-[#262626] bg-[#0c0c0c] p-4 flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  rows={3}
                  placeholder={`Send an email reply to ${selectedThread.name}... (Ctrl + Enter to send)`}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      if (replyMessage.trim() && !isPending) {
                        e.currentTarget.form?.requestSubmit();
                      }
                    }
                  }}
                  className="w-full border border-[#262626] bg-[#090909] px-3.5 py-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber transition-colors rounded-none resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !replyMessage.trim()}
                className="border border-[#10B981] bg-[#10B981]/10 px-5 py-6 text-xs font-bold uppercase tracking-widest text-[#10B981] hover:bg-[#10B981]/25 disabled:opacity-30 transition-all flex flex-col items-center justify-center gap-1.5 h-[76px] shrink-0 cursor-pointer"
              >
                <FiSend className="h-4 w-4" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          /* Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0c0c0c]/10">
            <div className="h-12 w-12 border border-[#262626] bg-[#090909] flex items-center justify-center mb-4">
              <FiMail className="h-5 w-5 text-zinc-550" />
            </div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select a Conversation</h3>
            <p className="text-[10px] text-zinc-500 max-w-xs mt-1.5 leading-relaxed font-sans">
              Choose an active email thread from the left list to review visitor questions, see message logs, and send dynamic email responses.
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
