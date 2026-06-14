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

const LiquidNavbarBackground = dynamic(() => import("../3d/LiquidNavbarBackground"), {
  ssr: false,
  loading: () => null,
});

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
    <header className="fixed inset-x-0 top-0 z-50 px-4 md:px-0">
      <nav
        ref={navRef}
        className="relative mx-auto mt-4 flex max-w-5xl items-center justify-between rounded-2xl px-5 py-3 select-none border border-white/[0.03]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* WebGL background wrapper that does the overflow-hidden clipping */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden -z-10">
          {/* CSS Backdrop Blur Layer for background content */}
          <div className="absolute inset-0 bg-white/[0.01] backdrop-blur-[14px] rounded-2xl" />

          {/* WebGL Liquid Glass Background Canvas */}
          <LiquidNavbarBackground
            activeTabRect={activeTabRect}
            isHovered={isHovered}
            navbarWidth={navbarSize.width}
            navbarHeight={navbarSize.height}
          />
        </div>

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
                    "relative z-10 block rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-accent",
                    isActive 
                      ? "text-zinc-950 dark:text-zinc-50" 
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

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

        {/* Mega Menu Dropdowns (Absolute to Nav) */}
        <AnimatePresence>
          {activeMenu === "projects" && (
            <motion.div
              initial={{ opacity: 0, y: -8, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -8, x: "-50%" }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full left-1/2 z-50 min-w-[640px] bg-bg-surface border border-border border-t-2 border-t-amber p-6 rounded-none shadow-[0_20px_60px_rgba(0,0,0,0.5)] mt-3 cursor-default hidden md:block"
              onMouseEnter={() => handleMouseEnter("projects")}
              onMouseLeave={handleMouseLeave}
            >
              <div className="grid grid-cols-3 gap-4 text-left">
                <div className="col-span-3 border-b border-border pb-3 mb-2 flex justify-between items-center">
                  <span className="font-inter font-semibold text-[10px] tracking-[0.15em] text-text-muted uppercase">
                    RECENT PROJECTS
                  </span>
                </div>

                {initialProjects && initialProjects.length > 0 ? (
                  initialProjects.map((proj) => (
                    <Link
                      key={proj.slug}
                      href={`/projects/${proj.slug}`}
                      className="border border-border bg-bg-surface overflow-hidden hover:border-amber transition-colors duration-150 rounded-none group/card block"
                    >
                      <div className="relative h-[100px] w-full bg-bg-elevated overflow-hidden">
                        {proj.coverImage ? (
                          <Image
                            src={proj.coverImage}
                            alt={proj.title}
                            fill
                            className="object-cover grayscale-[30%] group-hover/card:grayscale-0 transition-all duration-300"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-bg-elevated text-xl font-bold text-white/5 uppercase font-syne">
                            {proj.title.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="p-[0.6rem]">
                        <h4 className="font-syne font-bold text-[13px] text-white line-clamp-1 group-hover/card:text-amber transition-colors duration-150">
                          {proj.title}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {proj.techStack.slice(0, 2).map((tag) => (
                            <span key={tag} className="font-inter font-medium text-[10px] text-green">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 text-text-muted font-inter text-sm">
                    Coming soon
                  </div>
                )}

                <div className="col-span-3 border-t border-border pt-3 mt-2 flex justify-end">
                  <Link
                    href="/projects"
                    className="font-inter font-medium text-[12px] text-amber hover:underline"
                  >
                    View all projects →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {activeMenu === "blog" && (
            <motion.div
              initial={{ opacity: 0, y: -8, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -8, x: "-50%" }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full left-1/2 z-50 min-w-[640px] bg-bg-surface border border-border border-t-2 border-t-amber p-6 rounded-none shadow-[0_20px_60px_rgba(0,0,0,0.5)] mt-3 cursor-default hidden md:block"
              onMouseEnter={() => handleMouseEnter("blog")}
              onMouseLeave={handleMouseLeave}
            >
              <div className="grid grid-cols-3 gap-4 text-left">
                <div className="col-span-3 border-b border-border pb-3 mb-2 flex justify-between items-center">
                  <span className="font-inter font-semibold text-[10px] tracking-[0.15em] text-text-muted uppercase">
                    RECENT WRITING
                  </span>
                </div>

                {initialPosts && initialPosts.length > 0 ? (
                  initialPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="border border-border bg-bg-surface overflow-hidden hover:border-amber transition-colors duration-150 rounded-none group/card block"
                    >
                      <div className="relative h-[100px] w-full bg-bg-elevated overflow-hidden">
                        {post.coverImage ? (
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover grayscale-[30%] group-hover/card:grayscale-0 transition-all duration-300"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-bg-elevated text-xl font-bold text-white/5 uppercase font-syne">
                            {post.title.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="p-[0.6rem]">
                        <span className="font-inter font-normal text-[10px] text-text-muted block mb-1">
                          {formatDate(post.createdAt)}
                        </span>
                        <h4 className="font-syne font-bold text-[12px] text-white line-clamp-2 leading-tight group-hover/card:text-amber transition-colors duration-150">
                          {post.title}
                        </h4>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 text-text-muted font-inter text-sm">
                    Coming soon
                  </div>
                )}

                <div className="col-span-3 border-t border-border pt-3 mt-2 flex justify-end">
                  <Link
                    href="/blog"
                    className="font-inter font-medium text-[12px] text-amber hover:underline"
                  >
                    Read all posts →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
 
      {/* Mobile drop-down menu with smooth opening/closing transitions */}
      <ul
        className={cn(
          "mx-4 mt-2 space-y-1 rounded-2xl p-4 md:hidden relative z-50 transition-all duration-300 ease-out origin-top",
          open
            ? "opacity-100 scale-y-100 max-h-[300px] visible"
            : "opacity-0 scale-y-95 max-h-0 invisible overflow-hidden pointer-events-none"
        )}
        style={{
          background: "rgba(10, 10, 10, 0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Sliding Active Background */}
        {activeIndex !== -1 && (
          <div
            className="absolute left-4 right-4 h-[40px] rounded-xl bg-amber/10 border border-amber/20 transition-all duration-300 ease-out pointer-events-none z-0"
            style={{
              top: "16px",
              transform: `translateY(${activeIndex * 44}px)`,
            }}
          />
        )}

        {LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href} className="relative">
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-300 z-10 relative active:scale-98",
                  isActive 
                    ? "text-amber" 
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </header>
  );
}
