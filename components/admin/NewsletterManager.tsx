"use client";

import Link from "next/link";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FiMail,
  FiTrash2,
  FiSend,
  FiUsers,
  FiActivity,
  FiEye,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiClock
} from "react-icons/fi";
import { dispatchCampaignAction, deleteSubscriberAction } from "@/lib/actions";
import EditorialModal from "./EditorialModal";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}${local.slice(1, -1).replace(/./g, "*")}${local[local.length - 1]}@${domain}`;
}

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPost, setSelectedPost] = useState("");
  const [subject, setSubject] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SubscriberItem | null>(null);

  // Subscribers list states
  const [subSearch, setSubSearch] = useState("");
  const [subSortField, setSubSortField] = useState<"email" | "joined">("joined");
  const [subSortOrder, setSubSortOrder] = useState<"asc" | "desc">("desc");
  const [subPage, setSubPage] = useState(1);
  const subItemsPerPage = 5;

  // Campaigns list states
  const [campSortField, setCampSortField] = useState<"subject" | "post" | "date" | "receivers" | "opens" | "clicks">("date");
  const [campSortOrder, setCampSortOrder] = useState<"asc" | "desc">("desc");
  const [campPage, setCampPage] = useState(1);
  const campItemsPerPage = 5;

  // Filter list
  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(subSearch.toLowerCase())
  );

  // Sort list
  const sortedSubscribers = [...filteredSubscribers].sort((a, b) => {
    if (subSortField === "email") {
      return subSortOrder === "asc"
        ? a.email.localeCompare(b.email)
        : b.email.localeCompare(a.email);
    } else {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return subSortOrder === "asc" ? timeA - timeB : timeB - timeA;
    }
  });

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    let valA: any = a.createdAt;
    let valB: any = b.createdAt;

    if (campSortField === "subject") {
      valA = a.subject.toLowerCase();
      valB = b.subject.toLowerCase();
    } else if (campSortField === "post") {
      valA = a.postTitle.toLowerCase();
      valB = b.postTitle.toLowerCase();
    } else if (campSortField === "receivers") {
      valA = a.sentCount;
      valB = b.sentCount;
    } else if (campSortField === "opens") {
      valA = a.opensCount;
      valB = b.opensCount;
    } else if (campSortField === "clicks") {
      valA = a.clicksCount;
      valB = b.clicksCount;
    }

    if (valA < valB) return campSortOrder === "asc" ? -1 : 1;
    if (valA > valB) return campSortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Reset page when search term changes
  useEffect(() => {
    setSubPage(1);
  }, [subSearch]);

  // Paginated chunk
  const totalSubPages = Math.ceil(sortedSubscribers.length / subItemsPerPage) || 1;
  const activeSubPage = Math.min(subPage, totalSubPages);
  const startSubIndex = (activeSubPage - 1) * subItemsPerPage;
  const paginatedSubscribers = sortedSubscribers.slice(
    startSubIndex,
    startSubIndex + subItemsPerPage
  );

  const totalCampPages = Math.ceil(sortedCampaigns.length / campItemsPerPage) || 1;
  const activeCampPage = Math.min(campPage, totalCampPages);
  const startCampIndex = (activeCampPage - 1) * campItemsPerPage;
  const paginatedCampaigns = sortedCampaigns.slice(
    startCampIndex,
    startCampIndex + campItemsPerPage
  );

  const toggleSort = (field: "email" | "joined") => {
    if (subSortField === field) {
      setSubSortOrder(subSortOrder === "asc" ? "desc" : "asc");
    } else {
      setSubSortField(field);
      setSubSortOrder("desc");
    }
  };

  const toggleCampSort = (field: typeof campSortField) => {
    if (campSortField === field) {
      setCampSortOrder(campSortOrder === "asc" ? "desc" : "asc");
    } else {
      setCampSortField(field);
      setCampSortOrder("desc");
    }
  };

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
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
              Subscribers ({filteredSubscribers.length} of {subscribers.length})
            </h2>
          </div>

          {/* Search filter */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <FiSearch className="text-zinc-500 w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              placeholder="Search subscribers by email..."
              className="w-full pl-8 pr-3 py-1.5 border border-[#262626] bg-black text-zinc-300 placeholder-zinc-650 outline-none focus:border-amber font-mono text-[11px] rounded-none"
            />
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-2">
                    <button
                      type="button"
                      onClick={() => toggleSort("email")}
                      className="flex items-center gap-1 hover:text-white uppercase tracking-wider font-bold focus:outline-none"
                    >
                      <FiMail className="w-3.5 h-3.5 text-zinc-500" /> Email {subSortField === "email" && (subSortOrder === "asc" ? "▲" : "▼")}
                    </button>
                  </th>
                  <th className="pb-2">
                    <span className="flex items-center gap-1 uppercase tracking-wider font-bold">
                      <FiActivity className="w-3.5 h-3.5 text-zinc-500" /> Status
                    </span>
                  </th>
                  <th className="pb-2">
                    <button
                      type="button"
                      onClick={() => toggleSort("joined")}
                      className="flex items-center gap-1 hover:text-white uppercase tracking-wider font-bold focus:outline-none"
                    >
                      <FiCalendar className="w-3.5 h-3.5 text-zinc-500" /> Joined {subSortField === "joined" && (subSortOrder === "asc" ? "▲" : "▼")}
                    </button>
                  </th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {paginatedSubscribers.map((sub) => (
                  <tr key={sub.id} className="text-zinc-300 hover:bg-white/[0.01]">
                    <td className="py-2.5 font-bold text-white font-mono">
                      <Link href={`/admin/newsletter/subscribers/${sub.id}`} className="hover:underline hover:text-amber">
                        {maskEmail(sub.email)}
                      </Link>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 border text-[9px] uppercase font-bold ${
                        sub.confirmed 
                          ? "border-green/20 bg-green/5 text-green" 
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                      }`}>
                        {sub.confirmed ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td className="py-2.5 text-zinc-550 font-mono">{new Date(sub.createdAt).toLocaleDateString()}</td>
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
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-555 uppercase font-mono italic">
                      No subscribers found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalSubPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#262626]/45 pt-4 mt-4 text-[10px]">
              <button
                type="button"
                disabled={activeSubPage === 1}
                onClick={() => setSubPage(activeSubPage - 1)}
                className="flex items-center gap-1 uppercase font-bold tracking-wider px-2 py-1 border border-[#262626] bg-black text-zinc-400 hover:border-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:border-[#262626] disabled:hover:text-zinc-400 transition-colors"
              >
                <FiChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="text-zinc-550 font-bold uppercase tracking-wider">
                Page {activeSubPage} of {totalSubPages}
              </span>
              <button
                type="button"
                disabled={activeSubPage === totalSubPages}
                onClick={() => setSubPage(activeSubPage + 1)}
                className="flex items-center gap-1 uppercase font-bold tracking-wider px-2 py-1 border border-[#262626] bg-black text-zinc-400 hover:border-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:border-[#262626] disabled:hover:text-zinc-400 transition-colors"
              >
                Next <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
                <th className="pb-2">
                  <button
                    type="button"
                    onClick={() => toggleCampSort("subject")}
                    className="flex items-center gap-1 hover:text-white uppercase tracking-wider font-bold focus:outline-none"
                  >
                    <FiMail className="w-3.5 h-3.5 text-zinc-500" /> Subject {campSortField === "subject" && (campSortOrder === "asc" ? "▲" : "▼")}
                  </button>
                </th>
                <th className="pb-2">
                  <button
                    type="button"
                    onClick={() => toggleCampSort("post")}
                    className="flex items-center gap-1 hover:text-white uppercase tracking-wider font-bold focus:outline-none"
                  >
                    <FiEye className="w-3.5 h-3.5 text-zinc-500" /> Blog Post {campSortField === "post" && (campSortOrder === "asc" ? "▲" : "▼")}
                  </button>
                </th>
                <th className="pb-2">
                  <button
                    type="button"
                    onClick={() => toggleCampSort("date")}
                    className="flex items-center gap-1 hover:text-white uppercase tracking-wider font-bold focus:outline-none"
                  >
                    <FiCalendar className="w-3.5 h-3.5 text-zinc-500" /> Date Sent {campSortField === "date" && (campSortOrder === "asc" ? "▲" : "▼")}
                  </button>
                </th>
                <th className="pb-2">
                  <button
                    type="button"
                    onClick={() => toggleCampSort("receivers")}
                    className="flex items-center gap-1 hover:text-white uppercase tracking-wider font-bold focus:outline-none"
                  >
                    <FiUsers className="w-3.5 h-3.5 text-zinc-500" /> Receivers {campSortField === "receivers" && (campSortOrder === "asc" ? "▲" : "▼")}
                  </button>
                </th>
                <th className="pb-2">
                  <button
                    type="button"
                    onClick={() => toggleCampSort("opens")}
                    className="flex items-center gap-1 hover:text-white uppercase tracking-wider font-bold focus:outline-none"
                  >
                    <FiActivity className="w-3.5 h-3.5 text-zinc-500" /> Opens {campSortField === "opens" && (campSortOrder === "asc" ? "▲" : "▼")}
                  </button>
                </th>
                <th className="pb-2">
                  <button
                    type="button"
                    onClick={() => toggleCampSort("clicks")}
                    className="flex items-center gap-1 hover:text-white uppercase tracking-wider font-bold focus:outline-none"
                  >
                    <FiClock className="w-3.5 h-3.5 text-zinc-500" /> Clicks {campSortField === "clicks" && (campSortOrder === "asc" ? "▲" : "▼")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {paginatedCampaigns.map((camp) => {
                const openRate = camp.sentCount > 0 ? Math.round((camp.opensCount / camp.sentCount) * 100) : 0;
                const clickRate = camp.sentCount > 0 ? Math.round((camp.clicksCount / camp.sentCount) * 100) : 0;

                return (
                  <tr 
                    key={camp.id} 
                    onClick={() => router.push(`/admin/newsletter/campaigns/${camp.id}`)}
                    className="text-zinc-300 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-bold text-white">{camp.subject}</td>
                    <td className="py-3 text-zinc-400">{camp.postTitle}</td>
                    <td className="py-3 text-zinc-500 font-mono">{new Date(camp.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-zinc-400 font-mono">{camp.sentCount}</td>
                    <td className="py-3 text-green font-bold font-mono">
                      {camp.opensCount}{" "}
                      <span className="text-[10px] text-zinc-550 font-normal">({openRate}%)</span>
                    </td>
                    <td className="py-3 text-amber font-bold font-mono">
                      {camp.clicksCount}{" "}
                      <span className="text-[10px] text-zinc-550 font-normal">({clickRate}%)</span>
                    </td>
                  </tr>
                );
              })}
              {sortedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-550 uppercase font-mono italic">
                    No campaigns sent yet
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Campaign Pagination Controls */}
        {totalCampPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#262626]/45 pt-4 mt-4 text-[10px]">
            <button
              type="button"
              disabled={activeCampPage === 1}
              onClick={() => setCampPage(activeCampPage - 1)}
              className="flex items-center gap-1 uppercase font-bold tracking-wider px-2 py-1 border border-[#262626] bg-black text-zinc-400 hover:border-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:border-[#262626] disabled:hover:text-zinc-400 transition-colors"
            >
              <FiChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="text-zinc-550 font-bold uppercase tracking-wider">
              Page {activeCampPage} of {totalCampPages}
            </span>
            <button
              type="button"
              disabled={activeCampPage === totalCampPages}
              onClick={() => setCampPage(activeCampPage + 1)}
              className="flex items-center gap-1 uppercase font-bold tracking-wider px-2 py-1 border border-[#262626] bg-black text-zinc-400 hover:border-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:border-[#262626] disabled:hover:text-zinc-400 transition-colors"
            >
              Next <FiChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>    </div>

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
