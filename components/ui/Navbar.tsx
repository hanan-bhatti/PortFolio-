"use client";

/**
 * @file components/ui/Navbar.tsx
 * @description React component for Navbar.tsx under the ui category.
 * 
 * @exports
 * - Navbar (default): Main React component or function
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatDate } from "@/lib/utils";
import dynamic from "next/dynamic";
import ResumeDownloadButton from "@/components/resume/ResumeDownloadButton";

import { FiHome, FiFolder, FiUser, FiCamera, FiEdit3, FiMail, FiFileText } from "react-icons/fi";

const LiquidNavbarBackground = dynamic(() => import("../3d/LiquidNavbarBackground"), {
  ssr: false,
  loading: () => null,
});

const MobileIcon = ({ label, size, isActive }: { label: string; size: number; isActive?: boolean }) => {
  const strokeWidth = isActive ? 2.5 : 2;
  const color = "currentColor";
  const state = isActive ? "active" : "inactive";

  const transition = { type: "spring", stiffness: 400, damping: 25 };

  switch (label) {
    case "Home": 
      return (
        <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" animate={state}>
          {/* House Base */}
          <motion.path 
            d="M5 12V22H19V12" 
            variants={{ inactive: { pathLength: 1 }, active: { pathLength: [0, 1] } }}
            transition={transition}
          />
          {/* Roof */}
          <motion.path 
            d="M3 10l9-7 9 7" 
            variants={{ inactive: { y: 0 }, active: { y: [ -2, 0 ] } }}
            transition={transition}
          />
          {/* Door */}
          <motion.path 
            d="M9 22V12H15V22" 
            variants={{ inactive: { opacity: 1 }, active: { opacity: [0, 1] } }}
            transition={{ delay: 0.1 }}
          />
        </motion.svg>
      );
    case "Projects": 
      return (
        <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" animate={state}>
          {/* Folder Back */}
          <motion.path 
            d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" 
            variants={{ inactive: { pathLength: 1 }, active: { pathLength: [0, 1] } }}
            transition={transition}
          />
          <motion.line x1="12" y1="11" x2="12" y2="17" variants={{ inactive: { scale: 1 }, active: { scale: [0, 1] } }} transition={{ delay: 0.1 }} />
          <motion.line x1="9" y1="14" x2="15" y2="14" variants={{ inactive: { scale: 1 }, active: { scale: [0, 1] } }} transition={{ delay: 0.1 }} />
        </motion.svg>
      );
    case "About": 
      return (
        <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" animate={state}>
          {/* Terminal Window */}
          <motion.rect x="2" y="4" width="20" height="16" rx="2" variants={{ inactive: { pathLength: 1 }, active: { pathLength: [0, 1] } }} transition={transition} />
          <motion.path d="M6 8l4 4-4 4" variants={{ inactive: { opacity: 1, x: 0 }, active: { opacity: [0, 1], x: [-5, 0] } }} transition={{ delay: 0.1 }} />
          <motion.line x1="12" y1="16" x2="16" y2="16" variants={{ inactive: { opacity: 1 }, active: { opacity: [0, 1, 0, 1] } }} transition={{ delay: 0.2, duration: 0.5 }} />
        </motion.svg>
      );
    case "Photography": 
      return (
        <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" animate={state}>
          <motion.path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" variants={{ inactive: { pathLength: 1 }, active: { pathLength: [0, 1] } }} transition={transition} />
          <motion.circle cx="12" cy="13" r="4" variants={{ inactive: { scale: 1 }, active: { scale: [0, 1.2, 1] } }} transition={{ delay: 0.1 }} />
        </motion.svg>
      );
    case "Blog": 
      return (
        <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" animate={state}>
          {/* Open Book */}
          <motion.path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" variants={{ inactive: { pathLength: 1 }, active: { pathLength: [0, 1] } }} transition={transition} />
          <motion.path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" variants={{ inactive: { pathLength: 1 }, active: { pathLength: [0, 1] } }} transition={transition} />
        </motion.svg>
      );
    case "Contact": 
      return (
        <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" animate={state}>
          <motion.path d="M22 2L11 13" variants={{ inactive: { pathLength: 1 }, active: { pathLength: [0, 1] } }} transition={transition} />
          <motion.path d="M22 2L15 22 11 13 2 9l20-7z" variants={{ inactive: { pathLength: 1, x: 0, y: 0 }, active: { pathLength: [0, 1], x: [-2, 0], y: [2, 0] } }} transition={transition} />
        </motion.svg>
      );
    case "Resume": 
      return (
        <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" animate={state}>
          <motion.path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" variants={{ inactive: { pathLength: 1 }, active: { pathLength: [0, 1] } }} transition={transition} />
          <motion.polyline points="14 2 14 8 20 8" variants={{ inactive: { opacity: 1 }, active: { opacity: [0, 1] } }} transition={{ delay: 0.1 }} />
          <motion.line x1="16" y1="13" x2="8" y2="13" variants={{ inactive: { x: 0 }, active: { x: [-5, 0] } }} />
          <motion.line x1="16" y1="17" x2="8" y2="17" variants={{ inactive: { x: 0 }, active: { x: [-5, 0] } }} transition={{ delay: 0.1 }} />
        </motion.svg>
      );
    case "More":
      return (
        <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" animate={state}>
          <motion.circle cx="12" cy="12" r="2" fill={isActive ? "currentColor" : "none"} variants={{ inactive: { y: 0 }, active: { y: [-3, 0] } }} transition={{ delay: 0.05 }} />
          <motion.circle cx="19" cy="12" r="2" fill={isActive ? "currentColor" : "none"} variants={{ inactive: { y: 0 }, active: { y: [-3, 0] } }} transition={{ delay: 0.1 }} />
          <motion.circle cx="5" cy="12" r="2" fill={isActive ? "currentColor" : "none"} variants={{ inactive: { y: 0 }, active: { y: [-3, 0] } }} transition={{ delay: 0 }} />
        </motion.svg>
      );
    default: return null;
  }
};

interface MegaMenuProject {
  slug: string;
  title: string;
  coverImage: string | null;
  techStack: string[];
}

interface MegaMenuPost {
  slug: string;
  title: string;
  coverImage: string | null;
  createdAt: string;
}

interface NavbarProps {
  initialProjects?: MegaMenuProject[] | null;
  initialPosts?: MegaMenuPost[] | null;
  photographyEnabled?: boolean;
  resumeEnabled?: boolean;
}

export default function Navbar({
  initialProjects = null,
  initialPosts = null,
  photographyEnabled = false,
  resumeEnabled = true,
}: NavbarProps) {
  const pathname = usePathname();

  const LINKS = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/about", label: "About" },
    ...(photographyEnabled ? [{ href: "/photography", label: "Photography" }] : []),
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
    ...(resumeEnabled ? [{ href: "/resume", label: "Resume" }] : []),
  ];
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeTabRect, setActiveTabRect] = useState<{ left: number; width: number } | null>(null);
  const [navbarSize, setNavbarSize] = useState({ width: 0, height: 0 });
  const [windowWidth, setWindowWidth] = useState(400);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [activeMenu, setActiveMenu] = useState<"projects" | "blog" | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navRef = useRef<HTMLElement>(null);
  const activeIndex = LINKS.findIndex((link) => pathname === link.href);

  const handleMouseEnter = (menu: "projects" | "blog") => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) return;
    closeTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // ResizeObserver to track container dimensions and active tab coordinates dynamically
  useEffect(() => {
    const updateDimensions = () => {
      const nav = navRef.current;
      if (!nav) return;

      // Update navbar dimensions in state
      setNavbarSize({
        width: nav.clientWidth,
        height: nav.clientHeight,
      });

      // Find the currently active link element (desktop menu) and ensure it is visible (not display: none)
      const activeEl = nav.querySelector(`[data-active="true"]`) as HTMLElement;
      if (activeEl && activeEl.offsetParent !== null) {
        const navRect = nav.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        
        setActiveTabRect({
          left: activeRect.left - navRect.left,
          width: activeRect.width,
        });
      } else {
        setActiveTabRect(null);
      }
    };

    // Run initial calculation
    updateDimensions();

    // Observe navbar container resizing (responsive layout changes)
    const observer = new ResizeObserver(updateDimensions);
    if (navRef.current) {
      observer.observe(navRef.current);
    }

    window.addEventListener("resize", updateDimensions);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        ref={navRef}
        className="relative hidden md:flex w-full items-center justify-between px-6 py-4 md:px-10 select-none border-b border-white/[0.03]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* WebGL background wrapper that does the overflow-hidden clipping */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          {/* CSS Backdrop Blur Layer for background content */}
          <div className="absolute inset-0 bg-white/[0.01] backdrop-blur-[14px]" />

          {/* WebGL Liquid Glass Background Canvas */}
          <LiquidNavbarBackground
            activeTabRect={activeTabRect}
            isHovered={isHovered}
            navbarWidth={navbarSize.width}
            navbarHeight={navbarSize.height}
          />
        </div>

        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="relative z-10 transition-transform hover:scale-105 active:scale-95 flex items-center"
          >
            <Image
              src="/logo.svg"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain rounded-[4px]"
              priority
            />
          </Link>
          
          <ul className="hidden items-center gap-1 md:flex relative z-10">
            {LINKS.map((link) => {
              const isActive = pathname === link.href;
              const isProjects = link.label === "Projects";
              const isBlog = link.label === "Blog";

              return (
                <li
                  key={link.href}
                  onMouseEnter={() => {
                    if (isProjects) handleMouseEnter("projects");
                    else if (isBlog) handleMouseEnter("blog");
                  }}
                  onMouseLeave={() => {
                    if (isProjects || isBlog) handleMouseLeave();
                  }}
                >
                  <Link
                    href={link.href}
                    data-active={isActive}
                    className={cn(
                      "relative z-10 block rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-accent flex items-center gap-1",
                      isActive 
                        ? "text-zinc-950 dark:text-zinc-50" 
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {link.label}
                    {(isProjects || isBlog) && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 opacity-70">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center">
          {pathname === "/resume" && (
            <div className="relative z-10 md:ml-4 mr-2 md:mr-0">
              <ResumeDownloadButton />
            </div>
          )}

          <button
            type="button"
            className="relative z-10 p-2 md:hidden rounded-lg hover:bg-white/5 active:scale-95 transition-all w-10 h-10 flex flex-col items-center justify-center gap-[5px]"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={cn("block h-0.5 w-6 bg-zinc-200 transition-all duration-300 origin-center", open ? "rotate-45 translate-y-[7px]" : "")} />
            <span className={cn("block h-0.5 w-6 bg-zinc-200 transition-all duration-300", open ? "opacity-0 scale-x-0" : "")} />
            <span className={cn("block h-0.5 w-6 bg-zinc-200 transition-all duration-300 origin-center", open ? "-rotate-45 -translate-y-[7px]" : "")} />
          </button>
        </div>

        {/* Mega Menu Dropdowns (Absolute to Nav) */}
        <AnimatePresence>
          {activeMenu === "projects" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full left-0 right-0 w-full z-50 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] cursor-default hidden md:block overflow-hidden"
              style={{
                background: "rgba(10, 10, 10, 0.75)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              }}
              onMouseEnter={() => handleMouseEnter("projects")}
              onMouseLeave={handleMouseLeave}
            >
              <div className="relative z-10 max-w-7xl mx-auto">
                <div className="grid grid-cols-4 gap-6 text-left">
                  <div className="col-span-4 border-b border-white/10 pb-3 mb-2 flex justify-between items-center">
                    <span className="font-inter font-semibold text-[10px] tracking-[0.15em] text-text-muted uppercase">
                      RECENT PROJECTS
                    </span>
                  </div>

                  {initialProjects && initialProjects.length > 0 ? (
                    initialProjects.slice(0, 4).map((proj) => (
                      <Link
                        key={proj.slug}
                        href={`/projects/${proj.slug}`}
                        className="border border-white/5 bg-black/20 overflow-hidden hover:border-amber transition-colors duration-150 rounded-none group/card block"
                      >
                        <div className="relative h-[120px] w-full bg-black/40 overflow-hidden">
                          {proj.coverImage ? (
                            <Image
                              src={proj.coverImage}
                              alt={proj.title}
                              fill
                              className="object-cover grayscale-[30%] group-hover/card:grayscale-0 transition-all duration-300 opacity-80 group-hover/card:opacity-100"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-black/40 text-xl font-bold text-white/10 uppercase font-syne">
                              {proj.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="p-[0.8rem] bg-black/20">
                          <h4 className="font-syne font-bold text-[14px] text-white line-clamp-1 group-hover/card:text-amber transition-colors duration-150">
                            {proj.title}
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proj.techStack.slice(0, 3).map((tag) => (
                              <span key={tag} className="font-inter font-medium text-[10px] text-green border border-green/20 bg-green/5 px-1.5 py-0.5">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-4 text-center py-10 text-text-muted font-inter text-sm">
                      Coming soon
                    </div>
                  )}

                  <div className="col-span-4 border-t border-white/10 pt-4 mt-2 flex justify-end">
                    <Link
                      href="/projects"
                      className="font-inter font-medium text-[13px] text-amber hover:underline flex items-center gap-1"
                    >
                      View all projects <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeMenu === "blog" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full left-0 right-0 w-full z-50 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] cursor-default hidden md:block overflow-hidden"
              style={{
                background: "rgba(10, 10, 10, 0.75)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              }}
              onMouseEnter={() => handleMouseEnter("blog")}
              onMouseLeave={handleMouseLeave}
            >
              <div className="relative z-10 max-w-7xl mx-auto">
                <div className="grid grid-cols-4 gap-6 text-left">
                  <div className="col-span-4 border-b border-white/10 pb-3 mb-2 flex justify-between items-center">
                    <span className="font-inter font-semibold text-[10px] tracking-[0.15em] text-text-muted uppercase">
                      RECENT WRITING
                    </span>
                  </div>

                  {initialPosts && initialPosts.length > 0 ? (
                    initialPosts.slice(0, 4).map((post) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="border border-white/5 bg-black/20 overflow-hidden hover:border-amber transition-colors duration-150 rounded-none group/card block"
                      >
                        <div className="relative h-[120px] w-full bg-black/40 overflow-hidden">
                          {post.coverImage ? (
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover grayscale-[30%] group-hover/card:grayscale-0 transition-all duration-300 opacity-80 group-hover/card:opacity-100"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-black/40 text-xl font-bold text-white/10 uppercase font-syne">
                              {post.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="p-[0.8rem] bg-black/20">
                          <span className="font-inter font-normal text-[10px] text-text-muted block mb-1">
                            {formatDate(post.createdAt)}
                          </span>
                          <h4 className="font-syne font-bold text-[13px] text-white line-clamp-2 leading-snug group-hover/card:text-amber transition-colors duration-150">
                            {post.title}
                          </h4>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-4 text-center py-10 text-text-muted font-inter text-sm">
                      Coming soon
                    </div>
                  )}

                  <div className="col-span-4 border-t border-white/10 pt-4 mt-2 flex justify-end">
                    <Link
                      href="/blog"
                      className="font-inter font-medium text-[13px] text-amber hover:underline flex items-center gap-1"
                    >
                      Read all posts <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
 
      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 w-full md:hidden">
        {/* Dropup Menu for "More" */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-[80px] left-4 right-4 p-4 rounded-3xl"
              style={{
                background: "rgba(10, 10, 10, 0.75)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div className="flex flex-col gap-2">
                {pathname === "/resume" && (
                  <div className="mb-2 pb-2 border-b border-white/10">
                    <ResumeDownloadButton />
                  </div>
                )}
                
                {LINKS.slice(4).map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 flex items-center gap-3",
                        isActive
                          ? "bg-amber/10 text-amber"
                          : "text-zinc-300 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <MobileIcon label={link.label} size={18} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Tab Bar - Edge to Edge */}
        <div className="relative flex items-center justify-between pt-3 pb-safe-bottom" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>

          {/* Animated Background with Cutout */}
          <motion.div
            className="absolute inset-0 z-0 rounded-t-3xl"
            animate={{
              clipPath: (() => {
                const w = windowWidth;
                const activeIndex = LINKS.slice(0, 4).findIndex(l => pathname === l.href);
                const targetIndex = activeIndex !== -1 ? activeIndex : (open ? 4 : 2.5);
                const isVisible = activeIndex !== -1 || open;
                
                // Calculate center X of the active tab
                const cx = (w * ((targetIndex * 20) + 10)) / 100;
                const depth = isVisible ? 38 : 0;
                
                return `path('M 0 0 L ${cx - 48} 0 C ${cx - 30} 0 ${cx - 32} ${depth} ${cx} ${depth} C ${cx + 32} ${depth} ${cx + 30} 0 ${cx + 48} 0 L ${w} 0 L ${w} 200 L 0 200 Z')`;
              })()
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              background: "rgba(15, 15, 15, 0.85)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          />

          {/* We take first 4 links, and add a "More" button */}
          {LINKS.slice(0, 4).map((link, i) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="relative z-10 flex-1 flex flex-col items-center justify-center h-14 pb-2"
              >
                <div
                  className={cn(
                    "transition-all duration-300 flex items-center justify-center rounded-full absolute",
                    isActive
                      ? "-top-8 w-14 h-14 bg-amber text-black shadow-lg shadow-amber/20"
                      : "top-1 w-8 h-8 text-zinc-400 hover:text-white"
                  )}
                >
                  <MobileIcon label={link.label} size={isActive ? 22 : 20} isActive={isActive} />
                </div>
                <span
                  className={cn(
                    "absolute bottom-0 text-[10px] font-semibold transition-all duration-300 tracking-wide",
                    isActive ? "text-amber" : "text-zinc-500"
                  )}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setOpen(!open)}
            className="relative z-10 flex-1 flex flex-col items-center justify-center h-14 pb-2"
          >
            <div
              className={cn(
                "transition-all duration-300 flex items-center justify-center rounded-full absolute",
                (open || (LINKS.slice(4).findIndex(l => pathname === l.href) !== -1 && !open))
                  ? "-top-8 w-14 h-14 bg-amber text-black shadow-lg shadow-amber/20"
                  : "top-1 w-8 h-8 text-zinc-400 hover:text-white"
              )}
            >
              <MobileIcon label="More" size={(open || LINKS.slice(4).findIndex(l => pathname === l.href) !== -1) ? 22 : 20} isActive={open || LINKS.slice(4).findIndex(l => pathname === l.href) !== -1} />
            </div>
            <span
              className={cn(
                "absolute bottom-0 text-[10px] font-semibold transition-all duration-300 tracking-wide",
                (open || (LINKS.slice(4).findIndex(l => pathname === l.href) !== -1 && !open)) ? "text-amber" : "text-zinc-500"
              )}
            >
              More
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
