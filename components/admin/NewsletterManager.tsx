"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FiMail, FiTrash2, FiSend, FiUsers, FiActivity, FiEye } from "react-icons/fi";
import { dispatchCampaignAction, deleteSubscriberAction } from "@/lib/actions";
import EditorialModal from "./EditorialModal";

interface PostItem {
  id: string;
  title: string;
}

interface SubscriberItem {
  id: string;
  email: string;
  confirmed: boolean;
  createdAt: string;
}

interface CampaignItem {
  id: string;
  subject: string;
  sentCount: number;
  createdAt: string;
  postTitle: string;
  clicksCount: number;
  opensCount: number;
}

interface NewsletterManagerProps {
  posts: PostItem[];
  subscribers: SubscriberItem[];
  campaigns: CampaignItem[];
  stats: {
    totalSubscribers: number;
    totalCampaigns: number;
    totalSent: number;
    totalOpens: number;
    totalClicks: number;
  };
}

export default function NewsletterManager({
  posts,
  subscribers,
  campaigns,
  stats,
}: NewsletterManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPost, setSelectedPost] = useState("");
  const [subject, setSubject] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SubscriberItem | null>(null);

  const handleSendCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !subject.trim()) {
      toast.error("Please select a post and enter a subject.");
      return;
    }

    const toastId = toast.loading("Dispatching campaign to all subscribers...");
    startTransition(async () => {
      const res = await dispatchCampaignAction(selectedPost, subject.trim());
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success("Campaign dispatched successfully!", { id: toastId });
        setSelectedPost("");
        setSubject("");
      }
    });
  };

  const handleDeleteSubscriber = async () => {
    if (!deleteTarget) return;
    const toastId = toast.loading(`Removing subscriber "${deleteTarget.email}"...`);
    startTransition(async () => {
      const res = await deleteSubscriberAction(deleteTarget.id);
      setDeleteTarget(null);
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success("Subscriber removed successfully", { id: toastId });
      }
    });
  };

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="border border-[#262626] bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="uppercase text-[9px] font-bold tracking-wider">Subscribers</span>
            <FiUsers className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.totalSubscribers}</p>
        </div>
        <div className="border border-[#262626] bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="uppercase text-[9px] font-bold tracking-wider">Campaigns</span>
            <FiSend className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.totalCampaigns}</p>
        </div>
        <div className="border border-[#262626] bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="uppercase text-[9px] font-bold tracking-wider">Emails Sent</span>
            <FiMail className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.totalSent}</p>
        </div>
        <div className="border border-[#262626] bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="uppercase text-[9px] font-bold tracking-wider">Email Opens</span>
            <FiEye className="h-4 w-4 text-green" />
          </div>
          <p className="mt-2 text-2xl font-bold text-green">
            {stats.totalOpens}{" "}
            <span className="text-[10px] text-zinc-500 font-normal">
              ({stats.totalSent > 0 ? Math.round((stats.totalOpens / stats.totalSent) * 100) : 0}%)
            </span>
          </p>
        </div>
        <div className="border border-[#262626] bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="uppercase text-[9px] font-bold tracking-wider">Link Clicks</span>
            <FiActivity className="h-4 w-4 text-amber" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber">
            {stats.totalClicks}{" "}
            <span className="text-[10px] text-zinc-500 font-normal">
              ({stats.totalSent > 0 ? Math.round((stats.totalClicks / stats.totalSent) * 100) : 0}%)
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Dispatcher Form */}
        <div className="lg:col-span-1 border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
          <h2 className="text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
            New Email Campaign
          </h2>
          <form onSubmit={handleSendCampaign} className="space-y-4">
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-550">
                Select Blog Post
              </label>
              <select
                value={selectedPost}
                onChange={(e) => setSelectedPost(e.target.value)}
                className="w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-3 py-2 text-xs text-white outline-none focus:border-amber"
              >
                <option value="">-- Choose a published post --</option>
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-550">
                Email Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Fresh Out! Read our latest thoughts..."
                className="w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-3 py-2 text-xs text-white placeholder-zinc-650 outline-none focus:border-amber"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full border border-amber bg-amber py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Sending Campaign..." : "Dispatch Campaign →"}
            </button>
          </form>
        </div>

        {/* Right Column: Subscribers List */}
        <div className="lg:col-span-2 border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
          <h2 className="text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
            Subscribers ({subscribers.length})
          </h2>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Joined</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="text-zinc-300 hover:bg-white/[0.01]">
                    <td className="py-2.5 font-bold text-white">{sub.email}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 border text-[9px] uppercase font-bold ${
                        sub.confirmed 
                          ? "border-green/20 bg-green/5 text-green" 
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                      }`}>
                        {sub.confirmed ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td className="py-2.5 text-zinc-500">{new Date(sub.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(sub)}
                        className="text-red-400 hover:text-red-500 p-1 cursor-pointer"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-550 uppercase">
                      No subscribers found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Row: Campaigns History */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
        <h2 className="text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
          Campaigns History & Metrics
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#262626] text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="pb-2">Subject</th>
                <th className="pb-2">Blog Post</th>
                <th className="pb-2">Date Sent</th>
                <th className="pb-2">Receivers</th>
                <th className="pb-2">Opens (Rate)</th>
                <th className="pb-2">Clicks (Rate)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {campaigns.map((camp) => {
                const openRate = camp.sentCount > 0 ? Math.round((camp.opensCount / camp.sentCount) * 100) : 0;
                const clickRate = camp.sentCount > 0 ? Math.round((camp.clicksCount / camp.sentCount) * 100) : 0;

                return (
                  <tr key={camp.id} className="text-zinc-300 hover:bg-white/[0.01]">
                    <td className="py-3 font-bold text-white">{camp.subject}</td>
                    <td className="py-3 text-zinc-400">{camp.postTitle}</td>
                    <td className="py-3 text-zinc-500">{new Date(camp.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-zinc-400">{camp.sentCount}</td>
                    <td className="py-3 text-green font-bold">
                      {camp.opensCount}{" "}
                      <span className="text-[10px] text-zinc-550 font-normal">({openRate}%)</span>
                    </td>
                    <td className="py-3 text-amber font-bold">
                      {camp.clicksCount}{" "}
                      <span className="text-[10px] text-zinc-550 font-normal">({clickRate}%)</span>
                    </td>
                  </tr>
                );
              })}
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-550 uppercase">
                    No campaigns sent yet
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <EditorialModal
        isOpen={deleteTarget !== null}
        type="danger"
        title="Remove Subscriber?"
        description={`Are you sure you want to remove the subscriber "${deleteTarget?.email}"? They will no longer receive any updates.`}
        confirmLabel="Remove Subscriber"
        cancelLabel="Cancel"
        onConfirm={handleDeleteSubscriber}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
