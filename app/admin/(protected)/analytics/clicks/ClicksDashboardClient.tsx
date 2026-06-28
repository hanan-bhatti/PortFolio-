"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  LuGlobe, 
  LuExternalLink, 
  LuSearch, 
  LuLink, 
  LuShare2, 
  LuCopy, 
  LuFolderGit2, 
  LuSparkles,
  LuMail,
  LuPanelBottom,
  LuMessageSquare,
  LuFileText,
  LuMegaphone
} from "react-icons/lu";
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaXTwitter,
  FaFacebook,
  FaInstagram
} from "react-icons/fa6";

// Meta parser helper for quick links
function parseShortLinkMeta(display: string, targetUrl: string) {
  let brand = "globe";
  if (display.includes("LinkedIn")) brand = "linkedin";
  else if (display.includes("GitHub")) brand = "github";
  else if (display.includes("Twitter") || display.includes("X Profile")) brand = "twitter";
  else if (display.includes("Email") || targetUrl.startsWith("mailto:")) brand = "email";
  else if (targetUrl.includes("instagram.com")) brand = "instagram";
  else if (targetUrl.includes("facebook.com")) brand = "facebook";

  let placement = "other";
  const lowerDisplay = display.toLowerCase();
  if (lowerDisplay.includes("hero")) placement = "hero";
  else if (lowerDisplay.includes("footer")) placement = "footer";
  else if (lowerDisplay.includes("contact")) placement = "contact";
  else if (lowerDisplay.includes("resume")) placement = "resume";
  else if (lowerDisplay.includes("campaign") || lowerDisplay.includes("email_campaign")) placement = "campaign";

  return { brand, placement };
}

function getBrandIcon(brand: string) {
  switch (brand) {
    case "linkedin":
      return <FaLinkedin className="w-4 h-4 flex-shrink-0" style={{ color: "#0A66C2" }} />;
    case "github":
      return <FaGithub className="w-4 h-4 flex-shrink-0 text-white" />;
    case "twitter":
      return <FaTwitter className="w-4 h-4 flex-shrink-0 text-sky-400" />;
    case "email":
      return <LuMail className="w-4 h-4 flex-shrink-0 text-rose-400" />;
    case "instagram":
      return <FaInstagram className="w-4 h-4 flex-shrink-0 text-pink-500" />;
    case "facebook":
      return <FaFacebook className="w-4 h-4 flex-shrink-0 text-blue-500" />;
    default:
      return <LuGlobe className="w-4 h-4 flex-shrink-0 text-zinc-500" />;
  }
}

function getPlacementBadge(placement: string) {
  switch (placement) {
    case "hero":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase bg-sky-950/40 text-sky-400 border border-sky-900/60 rounded-none w-fit">
          <LuSparkles className="w-3 h-3 text-sky-400 flex-shrink-0" /> Hero
        </span>
      );
    case "footer":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase bg-zinc-800/40 text-zinc-400 border border-zinc-700/60 rounded-none w-fit">
          <LuPanelBottom className="w-3 h-3 text-zinc-400 flex-shrink-0" /> Footer
        </span>
      );
    case "contact":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 rounded-none w-fit">
          <LuMessageSquare className="w-3 h-3 text-emerald-400 flex-shrink-0" /> Contact
        </span>
      );
    case "resume":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase bg-amber-950/40 text-amber-400 border border-amber-900/60 rounded-none w-fit">
          <LuFileText className="w-3 h-3 text-amber-400 flex-shrink-0" /> Resume
        </span>
      );
    case "campaign":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase bg-violet-950/40 text-violet-400 border border-violet-900/60 rounded-none w-fit">
          <LuMegaphone className="w-3 h-3 text-violet-400 flex-shrink-0" /> Campaign
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase bg-zinc-800/20 text-zinc-500 border border-zinc-800/60 rounded-none w-fit">
          <LuGlobe className="w-3 h-3 text-zinc-500 flex-shrink-0" /> Other
        </span>
      );
  }
}

interface BlogPostStat {
  id: string;
  title: string;
  slug: string;
  linkClicks: number;
  shareClicks: number;
  codeCopies: number;
  totalInteractions: number;
  lastActivity: string | null; // ISO String
}

interface ShortLinkStat {
  id: string;
  code: string;
  targetUrl: string;
  targetDisplay: string;
  clicksCount: number;
  lastClickTime: string | null; // ISO String
}

interface ProjectStat {
  id: string;
  title: string;
  slug: string;
  githubTotal: number;
  liveTotal: number;
  totalClicks: number;
  sourceBreakdown: {
    homepage_experiments: number;
    projects_list: number;
    project_detail: number;
    [key: string]: number;
  };
  lastActivity: string | null; // ISO String
}

interface ClicksDashboardClientProps {
  initialPosts: BlogPostStat[];
  initialShortLinks: ShortLinkStat[];
  initialProjects: ProjectStat[];
}

export default function ClicksDashboardClient({
  initialPosts,
  initialShortLinks,
  initialProjects,
}: ClicksDashboardClientProps) {
  // Table 1: Blog Posts states
  const [postSearch, setPostSearch] = useState("");
  const [postSortField, setPostSortField] = useState<string>("totalInteractions");
  const [postSortOrder, setPostSortOrder] = useState<"asc" | "desc">("desc");
  const [postPage, setPostPage] = useState(1);
  const postsPerPage = 5;

  // Table 2: Short Links states
  const [linkSearch, setLinkSearch] = useState("");
  const [linkSortField, setLinkSortField] = useState<string>("clicksCount");
  const [linkSortOrder, setLinkSortOrder] = useState<"asc" | "desc">("desc");
  const [linkPage, setLinkPage] = useState(1);
  const linksPerPage = 10;

  // Table 3: Projects states
  const [projectSearch, setProjectSearch] = useState("");
  const [projectSortField, setProjectSortField] = useState<string>("totalClicks");
  const [projectSortOrder, setProjectSortOrder] = useState<"asc" | "desc">("desc");
  const [projectPage, setProjectPage] = useState(1);
  const projectsPerPage = 5;

  // Formatting helper
  const formatShortDate = (dateVal: string | null) => {
    if (!dateVal) return "—";
    const d = new Date(dateVal);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ── TABLE 1: BLOG POSTS FILTER & SORT ──
  const handlePostSort = (field: string) => {
    if (postSortField === field) {
      setPostSortOrder(postSortOrder === "asc" ? "desc" : "asc");
    } else {
      setPostSortField(field);
      setPostSortOrder("desc");
    }
    setPostPage(1);
  };

  const filteredPosts = initialPosts.filter((post) =>
    post.title.toLowerCase().includes(postSearch.toLowerCase())
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    let valA = (a as any)[postSortField];
    let valB = (b as any)[postSortField];

    if (postSortField === "lastActivity") {
      const timeA = valA ? new Date(valA).getTime() : 0;
      const timeB = valB ? new Date(valB).getTime() : 0;
      return postSortOrder === "asc" ? timeA - timeB : timeB - timeA;
    }

    if (postSortField === "title") {
      return postSortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    return postSortOrder === "asc" ? valA - valB : valB - valA;
  });

  const totalPostPages = Math.ceil(sortedPosts.length / postsPerPage);
  const paginatedPosts = sortedPosts.slice(
    (postPage - 1) * postsPerPage,
    postPage * postsPerPage
  );

  // ── TABLE 2: SHORT LINKS FILTER & SORT ──
  const handleLinkSort = (field: string) => {
    if (linkSortField === field) {
      setLinkSortOrder(linkSortOrder === "asc" ? "desc" : "asc");
    } else {
      setLinkSortField(field);
      setLinkSortOrder("desc");
    }
    setLinkPage(1);
  };

  const filteredLinks = initialShortLinks.filter((link) => {
    const term = linkSearch.toLowerCase();
    return (
      link.targetDisplay.toLowerCase().includes(term) ||
      link.code.toLowerCase().includes(term)
    );
  });

  const sortedLinks = [...filteredLinks].sort((a, b) => {
    let valA = (a as any)[linkSortField];
    let valB = (b as any)[linkSortField];

    if (linkSortField === "placement") {
      valA = parseShortLinkMeta(a.targetDisplay, a.targetUrl).placement;
      valB = parseShortLinkMeta(b.targetDisplay, b.targetUrl).placement;
    }

    if (linkSortField === "lastClickTime") {
      const timeA = valA ? new Date(valA).getTime() : 0;
      const timeB = valB ? new Date(valB).getTime() : 0;
      return linkSortOrder === "asc" ? timeA - timeB : timeB - timeA;
    }

    if (linkSortField === "targetDisplay" || linkSortField === "code" || linkSortField === "placement") {
      valA = valA || "";
      valB = valB || "";
      return linkSortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    return linkSortOrder === "asc" ? valA - valB : valB - valA;
  });

  const totalLinkPages = Math.ceil(sortedLinks.length / linksPerPage);
  const paginatedLinks = sortedLinks.slice(
    (linkPage - 1) * linksPerPage,
    linkPage * linksPerPage
  );

  // ── TABLE 3: PROJECTS FILTER & SORT ──
  const handleProjectSort = (field: string) => {
    if (projectSortField === field) {
      setProjectSortOrder(projectSortOrder === "asc" ? "desc" : "asc");
    } else {
      setProjectSortField(field);
      setProjectSortOrder("desc");
    }
    setProjectPage(1);
  };

  const filteredProjects = initialProjects.filter((p) =>
    p.title.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let valA = (a as any)[projectSortField];
    let valB = (b as any)[projectSortField];

    if (projectSortField === "lastActivity") {
      const timeA = valA ? new Date(valA).getTime() : 0;
      const timeB = valB ? new Date(valB).getTime() : 0;
      return projectSortOrder === "asc" ? timeA - timeB : timeB - timeA;
    }

    if (projectSortField === "title") {
      return projectSortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    return projectSortOrder === "asc" ? valA - valB : valB - valA;
  });

  const totalProjectPages = Math.ceil(sortedProjects.length / projectsPerPage);
  const paginatedProjects = sortedProjects.slice(
    (projectPage - 1) * projectsPerPage,
    projectPage * projectsPerPage
  );

  return (
    <div className="space-y-8">
      {/* SECTION 1: BLOG POST INTERACTIONS */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="font-syne text-md font-bold text-white tracking-tight flex items-center gap-2 uppercase text-xs">
                <LuFolderGit2 className="w-4 h-4 text-amber" /> Blog Post Interactions
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">Aggregated statistics for reader actions and copy events</p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search blog posts..."
                value={postSearch}
                onChange={(e) => {
                  setPostSearch(e.target.value);
                  setPostPage(1);
                }}
                className="w-full sm:w-60 bg-[#121212] border border-[#262626] pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
              />
              <LuSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-600" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500">
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handlePostSort("title")}
                  >
                    Post Title {postSortField === "title" && (postSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handlePostSort("linkClicks")}
                  >
                    <span className="flex items-center gap-1"><LuLink className="w-3.5 h-3.5" /> Link Clicks</span> {postSortField === "linkClicks" && (postSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handlePostSort("shareClicks")}
                  >
                    <span className="flex items-center gap-1"><LuShare2 className="w-3.5 h-3.5" /> Share Clicks</span> {postSortField === "shareClicks" && (postSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handlePostSort("codeCopies")}
                  >
                    <span className="flex items-center gap-1"><LuCopy className="w-3.5 h-3.5" /> Code Copies</span> {postSortField === "codeCopies" && (postSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handlePostSort("totalInteractions")}
                  >
                    Total {postSortField === "totalInteractions" && (postSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handlePostSort("lastActivity")}
                  >
                    Last Activity {postSortField === "lastActivity" && (postSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="pb-3 text-right font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {paginatedPosts.map((post) => (
                  <tr key={post.id} className="text-zinc-300 hover:bg-white/[0.01]">
                    <td className="py-3.5 max-w-[280px] truncate font-bold text-white">
                      <Link href={`/admin/analytics/clicks/${post.id}`} className="hover:text-amber hover:underline">
                        {post.title}
                      </Link>
                    </td>
                    <td className="py-3.5 text-zinc-400 font-semibold">{post.linkClicks}</td>
                    <td className="py-3.5 text-zinc-400 font-semibold">{post.shareClicks}</td>
                    <td className="py-3.5 text-zinc-400 font-semibold">{post.codeCopies}</td>
                    <td className="py-3.5 font-bold text-amber">{post.totalInteractions}</td>
                    <td className="py-3.5 text-zinc-500">{formatShortDate(post.lastActivity)}</td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/admin/analytics/clicks/${post.id}`}
                        className="border border-[#262626] bg-black/40 px-2.5 py-1 text-[10px] font-bold text-zinc-400 hover:border-amber hover:text-amber transition-colors rounded-none cursor-pointer"
                      >
                        VIEW DETAILS →
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredPosts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-600">No blog post interactions match search query</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {totalPostPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#262626] pt-4 mt-6">
            <button
              onClick={() => setPostPage((p) => Math.max(p - 1, 1))}
              disabled={postPage === 1}
              className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
            >
              PREV
            </button>
            <span className="text-[11px] font-mono text-zinc-500">
              PAGE {postPage} OF {totalPostPages}
            </span>
            <button
              onClick={() => setPostPage((p) => Math.min(p + 1, totalPostPages))}
              disabled={postPage === totalPostPages}
              className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
            >
              NEXT
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: SHORTLINKS REDIRECTS SUMMARY */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="font-syne text-md font-bold text-white tracking-tight flex items-center gap-2 uppercase text-xs">
                <LuLink className="w-4 h-4 text-emerald-400" /> Tracked Short Redirects
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">Clicks on profile redirects, headers, and campaign links</p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search short links..."
                value={linkSearch}
                onChange={(e) => {
                  setLinkSearch(e.target.value);
                  setLinkPage(1);
                }}
                className="w-full sm:w-60 bg-[#121212] border border-[#262626] pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
              />
              <LuSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-600" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500">
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleLinkSort("targetDisplay")}
                  >
                    Short Link Label {linkSortField === "targetDisplay" && (linkSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleLinkSort("placement")}
                  >
                    Placement {linkSortField === "placement" && (linkSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleLinkSort("code")}
                  >
                    Code Path {linkSortField === "code" && (linkSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleLinkSort("clicksCount")}
                  >
                    Clicks {linkSortField === "clicksCount" && (linkSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleLinkSort("lastClickTime")}
                  >
                    Last Click {linkSortField === "lastClickTime" && (linkSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="pb-3 text-right font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {paginatedLinks.map((link) => {
                  const meta = parseShortLinkMeta(link.targetDisplay, link.targetUrl);
                  const cleanName = link.targetDisplay.replace(/\s*\([^)]+\)\s*$/, "");
                  return (
                    <tr key={link.id} className="text-zinc-300 hover:bg-white/[0.01]">
                      <td className="py-3.5 max-w-[240px] truncate font-bold text-white">
                        <div className="flex items-center gap-2.5">
                          {getBrandIcon(meta.brand)}
                          <span className="truncate" title={cleanName}>{cleanName}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        {getPlacementBadge(meta.placement)}
                      </td>
                      <td className="py-3.5 text-zinc-400 font-semibold font-mono">/s/{link.code}</td>
                      <td className="py-3.5 font-bold text-amber">{link.clicksCount}</td>
                      <td className="py-3.5 text-zinc-500">{formatShortDate(link.lastClickTime)}</td>
                      <td className="py-3.5 text-right">
                        <a
                          href={link.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-[#262626] bg-black/40 px-2.5 py-1 text-[10px] font-bold text-zinc-400 hover:border-amber hover:text-amber transition-colors rounded-none cursor-pointer inline-flex items-center gap-1"
                        >
                          VISIT LINK <LuExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
                {filteredLinks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-600">No short redirects match search query</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalLinkPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#262626] pt-4 mt-6">
            <button
              onClick={() => setLinkPage((p) => Math.max(p - 1, 1))}
              disabled={linkPage === 1}
              className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
            >
              PREV
            </button>
            <span className="text-[11px] font-mono text-zinc-500">
              PAGE {linkPage} OF {totalLinkPages}
            </span>
            <button
              onClick={() => setLinkPage((p) => Math.min(p + 1, totalLinkPages))}
              disabled={linkPage === totalLinkPages}
              className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
            >
              NEXT
            </button>
          </div>
        )}
      </div>

      {/* SECTION 3: PROJECT LINK CLICKS */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="font-syne text-md font-bold text-white tracking-tight flex items-center gap-2 uppercase text-xs">
                <LuSparkles className="w-4 h-4 text-violet-400" /> Outgoing Project Clicks
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">Reader clicks directing to project live demos or GitHub code</p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                value={projectSearch}
                onChange={(e) => {
                  setProjectSearch(e.target.value);
                  setProjectPage(1);
                }}
                className="w-full sm:w-60 bg-[#121212] border border-[#262626] pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
              />
              <LuSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-600" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500">
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleProjectSort("title")}
                  >
                    Project {projectSortField === "title" && (projectSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleProjectSort("githubTotal")}
                  >
                    GitHub Clicks {projectSortField === "githubTotal" && (projectSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleProjectSort("liveTotal")}
                  >
                    Live Clicks {projectSortField === "liveTotal" && (projectSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Placement Breakdown</th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleProjectSort("totalClicks")}
                  >
                    Total {projectSortField === "totalClicks" && (projectSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th 
                    className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleProjectSort("lastActivity")}
                  >
                    Last Click {projectSortField === "lastActivity" && (projectSortOrder === "asc" ? "▲" : "▼")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {paginatedProjects.map((proj) => (
                  <tr key={proj.id} className="text-zinc-300 hover:bg-white/[0.01]">
                    <td className="py-3.5 font-bold text-white">{proj.title}</td>
                    <td className="py-3.5 text-zinc-400">{proj.githubTotal}</td>
                    <td className="py-3.5 text-zinc-400">{proj.liveTotal}</td>
                    <td className="py-3.5">
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 rounded-none w-fit">
                          <LuSparkles className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" /> Home: {proj.sourceBreakdown.homepage_experiments || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase bg-sky-950/40 text-sky-400 border border-sky-900/60 rounded-none w-fit">
                          <LuPanelBottom className="w-2.5 h-2.5 text-sky-400 flex-shrink-0" /> List: {proj.sourceBreakdown.projects_list || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase bg-violet-950/40 text-violet-400 border border-violet-900/60 rounded-none w-fit">
                          <LuMessageSquare className="w-2.5 h-2.5 text-violet-400 flex-shrink-0" /> Detail: {proj.sourceBreakdown.project_detail || 0}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 font-bold text-amber">{proj.totalClicks}</td>
                    <td className="py-3.5 text-zinc-500">{formatShortDate(proj.lastActivity)}</td>
                  </tr>
                ))}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-600">No project clicks match search query</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalProjectPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#262626] pt-4 mt-6">
            <button
              onClick={() => setProjectPage((p) => Math.max(p - 1, 1))}
              disabled={projectPage === 1}
              className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
            >
              PREV
            </button>
            <span className="text-[11px] font-mono text-zinc-500">
              PAGE {projectPage} OF {totalProjectPages}
            </span>
            <button
              onClick={() => setProjectPage((p) => Math.min(p + 1, totalProjectPages))}
              disabled={projectPage === totalProjectPages}
              className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
            >
              NEXT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
