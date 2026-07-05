"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  setHasSeenAdminTourAction,
  trackSeenPageTourAction
} from "@/lib/actions";

interface TourWrapperProps {
  children: React.ReactNode;
}

export default function OnboardingTour({ children }: TourWrapperProps) {
  const pathname = usePathname();
  const hasTriggeredRef = useRef<string | null>(null);

  useEffect(() => {
    // Only run onboarding tours on admin routes (excluding login)
    if (!pathname.startsWith("/admin") || pathname === "/admin/login") return;

    // Prevent duplicate triggers in React strict mode or consecutive path changes
    if (hasTriggeredRef.current === pathname) return;
    hasTriggeredRef.current = pathname;

    const runTours = async () => {
      try {
        const res = await fetch("/api/admin/onboarding");
        if (!res.ok) return;
        const data = await res.json();

        // 1. One Overarching First-Login Tour (Dashboard/Shell)
        if (!data.hasSeenAdminTour && pathname === "/admin/dashboard") {
          const d = driver({
            showProgress: true,
            allowClose: true,
            steps: [
              {
                popover: {
                  title: "Welcome to your Admin Panel! 🚀",
                  description: "This comprehensive walk-through will introduce you to your new portfolio control center and walk you through every sidebar section. Let's start!",
                }
              },
              {
                element: "aside",
                popover: {
                  title: "Primary Dashboard Navigation Sidebar",
                  description: "This collapsible sidebar houses all your administration modules, grouped cleanly into Overview, Workspace, Content, Personal, and System sections.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="sidebar-link-admin-dashboard"]',
                popover: {
                  title: "Dashboard overview",
                  description: "Your main hub containing unread inbox notifications, quick statistics, shortcuts to write new items, and a calendar planner.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="sidebar-link-admin-analytics"]',
                popover: {
                  title: "Visitor Traffic Analytics",
                  description: "Monitor peak traffic, popular pages, geographic countries, device types, browser clients, and active sessions in detail.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="sidebar-link-admin-analytics-clicks"]',
                popover: {
                  title: "Interactions & Clicks Hub",
                  description: "Audit specific actions taken by readers: copy events on blog code snippets, clicks on social redirections, or demo link clicks.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="sidebar-link-admin-engagement"]',
                popover: {
                  title: "Reader Engagement Audit",
                  description: "Review detailed feedback metrics: helpful voting ratios, star ratings, emoji reactions, and discover search keywords that returned zero results.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="sidebar-link-admin-workspace"]',
                popover: {
                  title: "Personal Workspace Playground",
                  description: "Use the Notion-like editor to write notes, create bookmark lists, organize todo items, and visualize kanban boards.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="sidebar-link-admin-posts"]',
                popover: {
                  title: "Blog CMS and Editor",
                  description: "Write, draft, edit, and publish Markdown/TipTap blog posts with live code execution and diagram capabilities.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="sidebar-link-admin-projects"]',
                popover: {
                  title: "Portfolio Projects Showcase",
                  description: "Showcase side projects, drag-and-drop to re-order how they display, configure featured tags, or document development bullet points.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="sidebar-link-admin-messages"]',
                popover: {
                  title: "Inbox Messages Mailbox",
                  description: "Review and respond directly to messages sent by visitors through your public contact forms, with Resend integration.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="sidebar-link-admin-settings"]',
                popover: {
                  title: "Global System Settings",
                  description: "Modify site metadata, SEO tags, cookie banners, update passwords, generate 2FA TOTP QR codes, or reset onboarding tours.",
                  side: "right", align: "start"
                }
              },
              {
                popover: {
                  title: "Ready to Explore! 🌟",
                  description: "Excellent! You are now familiar with the entire structure. Page-specific tours will pop up automatically when you visit new sections for the first time.",
                }
              }
            ],
            onDestroyStarted: () => {
              setHasSeenAdminTourAction(true);
              d.destroy();
            }
          });

          // Wait a brief moment for page layout stabilization
          setTimeout(() => d.drive(), 1000);
          return;
        }

        // 2. Page Specific Onboarding Tours
        const pageTours: Record<string, { id: string; steps: any[] }> = {
          "/admin/analytics": {
            id: "analytics",
            steps: [
              {
                popover: {
                  title: "Visitor Analytics 📊",
                  description: "Welcome to the Traffic & Analytics Control Center. Monitor visitors, page views, locations, and real-time activity.",
                }
              },
              {
                element: '[data-tour="analytics-stats"]',
                popover: {
                  title: "Traffic Metric Cards",
                  description: "Review total visitor count, page views, average reading duration, and immediate bounce rates.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="analytics-visitor-chart"]',
                popover: {
                  title: "30-Day View Trend",
                  description: "Visualize traffic curves day by day. Toggle between 30 days and all-time aggregates.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="analytics-pages-table"]',
                popover: {
                  title: "Most Visited Routes",
                  description: "Monitor which blog posts, projects, or photography routes get the highest traffic on your website.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="analytics-referrers-table"]',
                popover: {
                  title: "Referrer Traffic Channels",
                  description: "See where your traffic comes from (Google, LinkedIn, GitHub, etc.) with custom search filtering.",
                  side: "left", align: "start"
                }
              },
              {
                element: '[data-tour="analytics-sources"]',
                popover: {
                  title: "Traffic Medium Sources",
                  description: "Review proportion percentages for search engines, direct links, or referral media platforms.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="analytics-demographics"]',
                popover: {
                  title: "Demographics & Hardware Breakdown",
                  description: "Check audience distributions: geographic countries, device types, and browser choices.",
                  side: "top", align: "start"
                }
              },
              {
                element: '[data-tour="analytics-recent-visitors"]',
                popover: {
                  title: "Detailed Visitor Journey Logs",
                  description: "Review chronological visitor sessions: geographic location, consent choice, duration, and click history.",
                  side: "top", align: "start"
                }
              }
            ]
          },
          "/admin/dashboard": {
            id: "dashboard",
            steps: [
              {
                popover: {
                  title: "Dashboard Planner 📊",
                  description: "This page displays site highlights: visitors, page views, resume downloads, and unread messages.",
                }
              },
              {
                element: '[data-tour="dashboard-stats"]',
                popover: {
                  title: "Quick Statistics Cards",
                  description: "Monitor live counters: see your total visitors, page views, photography counts, and active resume downloads.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="quick-actions"]',
                popover: {
                  title: "Quick Actions Panel",
                  description: "Jump directly into creating new posts, projects, or editing about fields with these single-click shortcuts.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="planner-toggle"]',
                popover: {
                  title: "Project & Task Planner",
                  description: "Keep track of backlog items, tasks in progress, milestones, and blog post ideas right on your main dashboard.",
                  side: "top", align: "start"
                }
              }
            ]
          },
          "/admin/posts": {
            id: "posts",
            steps: [
              {
                popover: {
                  title: "Blog Posts CMS ✍️",
                  description: "Manage your thoughts, tutorials, and articles. Create drafts, edit contents, and preview before publishing.",
                }
              },
              {
                element: '[data-tour="create-post-btn"]',
                popover: {
                  title: "Create Post",
                  description: "Start writing a new post in the TipTap rich-text editor with support for syntax highlighting, markdown, and image uploads.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="posts-list-container"]',
                popover: {
                  title: "Draft / Publish Toggles",
                  description: "View post status at a glance, toggle publish state immediately, check view count statistics, or delete old entries.",
                  side: "top", align: "start"
                }
              }
            ]
          },
          "/admin/posts/new": {
            id: "posts-new",
            steps: [
              {
                popover: {
                  title: "Create Blog Post 📝",
                  description: "Use the rich text TipTap editor to draft and publish your blog articles.",
                }
              },
              {
                element: '[data-tour="post-editor-title"]',
                popover: {
                  title: "Post Title",
                  description: "Write a clear, catchy title for your blog post.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="post-editor-subtitle"]',
                popover: {
                  title: "Subtitle",
                  description: "Add an optional subtitle explaining the post's context.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="post-editor-slug"]',
                popover: {
                  title: "URL Slug",
                  description: "Auto-generated from title. Controls the custom web link format.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="post-editor-excerpt"]',
                popover: {
                  title: "Post Excerpt Summary",
                  description: "Write a short 1-2 sentence description for lists and SEO descriptors.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="post-cover-image"]',
                popover: {
                  title: "Upload Cover Image",
                  description: "Drop or select hero banner graphics. Images are automatically compressed.",
                  side: "left", align: "start"
                }
              },
              {
                element: '[data-tour="post-tags"]',
                popover: {
                  title: "Taxonomy Tags",
                  description: "Group post topics using tags. Press comma or Enter to add new tags.",
                  side: "left", align: "start"
                }
              },
              {
                element: '[data-tour="post-engagement-settings"]',
                popover: {
                  title: "Feature Toggles",
                  description: "Activate star ratings, emoji reactions, email subscriptions, exit intents, or end-surveys specifically for this article.",
                  side: "left", align: "start"
                }
              },
              {
                element: '[data-tour="post-save-actions"]',
                popover: {
                  title: "Publish or Draft Save",
                  description: "Save items as a silent draft first, or publish immediately so visitors can access them on the live blog.",
                  side: "left", align: "start"
                }
              }
            ]
          },
          "/admin/projects": {
            id: "projects",
            steps: [
              {
                popover: {
                  title: "Portfolio Projects 🛠️",
                  description: "Showcase your best projects on the main site. You can create new entries, edit details, or re-order them.",
                }
              },
              {
                element: '[data-tour="create-project-btn"]',
                popover: {
                  title: "New Project",
                  description: "Add title, description, cover image, stack list, and URLs pointing to repositories or live demos.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="projects-reorder-list"]',
                popover: {
                  title: "Drag-and-Drop Ordering",
                  description: "Click and drag projects to re-order them. The sequence here maps directly to the home page list.",
                  side: "top", align: "start"
                }
              }
            ]
          },
          "/admin/skills": {
            id: "skills",
            steps: [
              {
                popover: {
                  title: "Skills Management ⚡",
                  description: "Configure dynamic skill bars and category tags displayed on your portfolio landing page.",
                }
              },
              {
                element: '[data-tour="add-skill-btn"]',
                popover: {
                  title: "Create Skill Card",
                  description: "Define a skill name, proficiency level (1-100), select category (e.g. Languages, Tools), and map appropriate icons.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="skills-reorder-grid"]',
                popover: {
                  title: "Drag-and-Drop Sequence",
                  description: "Re-arrange skills by dragging the grab handles. Adjust hierarchy categories dynamically for clean layouts.",
                  side: "top", align: "start"
                }
              }
            ]
          },
          "/admin/experience": {
            id: "experience",
            steps: [
              {
                popover: {
                  title: "Work Experience Timeline 💼",
                  description: "Document your career positions, responsibilities, dates, and companies.",
                }
              },
              {
                element: '[data-tour="add-experience-btn"]',
                popover: {
                  title: "Add Position",
                  description: "Input role title, company name, location, duration, current status, and descriptive details.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="experience-timeline-list"]',
                popover: {
                  title: "Manager Timeline",
                  description: "Sort roles, update descriptions, toggle current status, or delete entries. Changes update live in the portfolio timeline.",
                  side: "top", align: "start"
                }
              }
            ]
          },
          "/admin/about": {
            id: "about",
            steps: [
              {
                popover: {
                  title: "About Me Story Section 👤",
                  description: "Update the landing page story layout. Manage narrative text blocks, current focuses, and beyond-code items.",
                }
              },
              {
                element: '[data-tour="about-tab-hero"]',
                popover: {
                  title: "Avatar & Quick Pitch",
                  description: "Upload your main profile avatar image and write a catchy quick-pitch tagline.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="about-tab-story"]',
                popover: {
                  title: "Story Markdown Editor",
                  description: "Write your biography narrative block. Full markdown formatting is supported with preview toggle.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="about-tab-stack"]',
                popover: {
                  title: "Skill Domain Tags",
                  description: "Configure core category headers and add specific skill badge tags (like Node.js, C++) to display visual clusters.",
                  side: "bottom", align: "start"
                }
              }
            ]
          },
          "/admin/settings": {
            id: "settings",
            steps: [
              {
                popover: {
                  title: "System Config & 2FA ⚙️",
                  description: "Central configuration panel managing title fields, visitor analytics tracking, password updates, and sessions.",
                }
              },
              {
                element: '[data-tour="settings-tab-general"]',
                popover: {
                  title: "Basic Metadata",
                  description: "Change site title, primary public contact emails, footer locations, and wake offsets.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="settings-tab-hero-bio"]',
                popover: {
                  title: "Bio Narrative & Assets",
                  description: "Configure main page tags, edit biography markdown description, and update profile avatars.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="settings-tab-social"]',
                popover: {
                  title: "Social Platforms",
                  description: "Maintain reference links for GitHub, LinkedIn, Twitter/X, and social cards.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="settings-tab-security"]',
                popover: {
                  title: "Account Security & TOTP 2FA",
                  description: "Update dashboard password, generate TOTP 2FA QR secrets, and enable secure dynamic sign-ins.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="settings-tab-sessions"]',
                popover: {
                  title: "Revoke Live Sessions",
                  description: "View and manage active browser sessions: see login location, device, IP addresses, and immediately revoke unwanted connections.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="settings-tab-tours"]',
                popover: {
                  title: "Onboarding Reset Center",
                  description: "Allows restarting onboarding tours anytime to walk developers through all features again.",
                  side: "bottom", align: "start"
                }
              }
            ]
          },
          "/admin/photography": {
            id: "photography",
            steps: [
              {
                popover: {
                  title: "Photography Portfolio 📷",
                  description: "Upload and display photos captured through your devices, and read automatically parsed EXIF data.",
                }
              },
              {
                element: '[data-tour="photography-uploadzone"]',
                popover: {
                  title: "Image Upload Block",
                  description: "Drag-and-drop or select images. The system auto-extracts camera tags (ISO, aperture, exposure) and applies styling tokens.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="photography-settings"]',
                popover: {
                  title: "Visibility & Ordering Toggles",
                  description: "Re-arrange photography order, toggle visible flags on the public page, or remove assets.",
                  side: "top", align: "start"
                }
              }
            ]
          },
          "/admin/resume": {
            id: "resume",
            steps: [
              {
                popover: {
                  title: "Interactive CV Builder 📄",
                  description: "Build, configure layout options, and preview the PDF format of your developer resume.",
                }
              },
              {
                element: '[data-tour="resume-tabs-nav"]',
                popover: {
                  title: "Resume Tabs Navigation",
                  description: "Switch sections between Personal info, Experience, Education, and PDF Downloads layout options.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="resume-tab-Personal"]',
                popover: {
                  title: "Personal details",
                  description: "Configure your name, target title, professional profile photos, phone numbers, and summary description.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="resume-tab-Experience"]',
                popover: {
                  title: "Work History",
                  description: "Manage professional employment nodes: define roles, dates, descriptions, and drag-and-drop to re-order timeline presentation.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="resume-tab-Education"]',
                popover: {
                  title: "Academic Background",
                  description: "List colleges, fields of study, start/end years, and outline key university activities.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="resume-tab-Skills"]',
                popover: {
                  title: "Skill badges",
                  description: "Group skills by domain expertise and level scales. Controls the interactive metrics radar display on your public resume.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="resume-tab-Certifications"]',
                popover: {
                  title: "Professional Licenses",
                  description: "List verify URLs, issuing bodies (like AWS, GCP), and credential titles to back your claims.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="resume-tab-Downloads"]',
                popover: {
                  title: "Verify Downloads Telemetry",
                  description: "Monitor and audit who downloads your resume: logs geographical location, device browsers, and timestamp history.",
                  side: "bottom", align: "start"
                }
              }
            ]
          },
          "/admin/messages": {
            id: "messages",
            steps: [
              {
                popover: {
                  title: "Inquiry Mailbox 📬",
                  description: "Read, reply, and organize visitor contact messages sent through the landing page form.",
                }
              },
              {
                element: '[data-tour="message-list-row"]',
                popover: {
                  title: "Message Details",
                  description: "Check sender name, subject, dates, read/unread badge indicators, and thread history.",
                  side: "top", align: "start"
                }
              }
            ]
          },
          "/admin/newsletter": {
            id: "newsletter",
            steps: [
              {
                popover: {
                  title: "Newsletter Campaigns ✉️",
                  description: "Manage your subscribers list and write HTML updates to dispatch directly using Resend.",
                }
              },
              {
                element: '[data-tour="newsletter-stats-grid"]',
                popover: {
                  title: "Campaign Stats Summary",
                  description: "Monitor subscriber count, open rates, metrics history, and bounce rate tracking values.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="newsletter-campaign-creator"]',
                popover: {
                  title: "Write & Send Campaign",
                  description: "Compose update campaigns using markdown. Pushes tracking pixel embeds for open statistics.",
                  side: "bottom", align: "start"
                }
              }
            ]
          },
          "/admin/workspace": {
            id: "workspace",
            steps: [
              {
                popover: {
                  title: "Personal Workspace Playground 💻",
                  description: "Create notes, organize links, manage tasks, and configure your visual developer workspace board.",
                }
              },
              {
                element: '[data-tour="workspace-explorer"]',
                popover: {
                  title: "Page Explorer",
                  description: "Navigate through workspace documents, notes, bookmark collections, and planner lists.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="create-node-btn"]',
                popover: {
                  title: "Interactive Sandbox Board",
                  description: "Add inline check-lists, link preview cards, canvas blocks, or customize nodes.",
                  side: "bottom", align: "start"
                }
              }
            ]
          },
          "/admin/analytics/clicks": {
            id: "analytics-clicks",
            steps: [
              {
                popover: {
                  title: "Interactions & Clicks Hub 🖱️",
                  description: "Monitor specific clicks, copy events, and social redirects triggered by readers across your portfolio.",
                }
              },
              {
                element: '[data-tour="clicks-blog-table"]',
                popover: {
                  title: "Blog Post Interactions",
                  description: "Review which posts have code block copy actions, share link clicks, or external link triggers.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="clicks-redirects-table"]',
                popover: {
                  title: "Tracked Redirect Clicks",
                  description: "Track performance of shortlinks like /s/linkedin or custom newsletter campaigns redirecting to social profiles.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="clicks-projects-table"]',
                popover: {
                  title: "Outgoing Project Clicks",
                  description: "Audit outward clicks directing readers to live demonstrations or GitHub repositories.",
                  side: "top", align: "start"
                }
              }
            ]
          },
          "/admin/analytics/clicks/[id]": {
            id: "analytics-clicks-post",
            steps: [
              {
                popover: {
                  title: "Blog Post Clicks & Copies 📝",
                  description: "Deep dive into click-through-rates, custom share metrics, and code copy statistics for this specific post.",
                }
              },
              {
                element: '[data-tour="clicks-detail-log"]',
                popover: {
                  title: " chronological Interaction Logs",
                  description: "Review detailed timestamped actions, identifying which browser agents or operating systems were used.",
                  side: "top", align: "start"
                }
              }
            ]
          },
          "/admin/analytics/clicks/shortlinks/[code]": {
            id: "analytics-clicks-shortlink",
            steps: [
              {
                popover: {
                  title: "Redirection Path Details 🔗",
                  description: "Audit traffic flow performance for this shortlink, including timeline graphs and user distributions.",
                }
              },
              {
                element: '[data-tour="clicks-shortlinks-timeline"]',
                popover: {
                  title: "Clicks History Timeline",
                  description: "Track daily redirection performance curves for the last 7 days of active use.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="clicks-shortlinks-devices"]',
                popover: {
                  title: "Device Class Distribution",
                  description: "Check the proportion of traffic originating from Mobile, Tablet, and Desktop clients.",
                  side: "left", align: "start"
                }
              },
              {
                element: '[data-tour="clicks-shortlinks-browsers"]',
                popover: {
                  title: "Browser User Agents",
                  description: "See visitor browser preferences: Chrome, Safari, Firefox, and other user agents.",
                  side: "right", align: "start"
                }
              },
              {
                element: '[data-tour="clicks-shortlinks-os"]',
                popover: {
                  title: "Operating Systems",
                  description: "Analyze the OS breakdown of visitors redirecting via this link.",
                  side: "left", align: "start"
                }
              },
              {
                element: '[data-tour="clicks-shortlinks-log"]',
                popover: {
                  title: "Redirection Click Logs",
                  description: "Chronological visit records: visitor fingerprint, exact timestamp, location, device details, and referrer headers.",
                  side: "top", align: "start"
                }
              }
            ]
          },
          "/admin/engagement": {
            id: "engagement",
            steps: [
              {
                popover: {
                  title: "Post Engagement Overview 📈",
                  description: "Centralized review center for post helpful voting, star ratings, emoji clicks, and reader suggestions.",
                }
              },
              {
                element: '[data-tour="engagement-stats"]',
                popover: {
                  title: "Aggregate Feedback Metrics",
                  description: "Summary totals of all emoji reactions, site surveys, and follow-up notifications.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="engagement-filters"]',
                popover: {
                  title: "Interactive Filters & Sorts",
                  description: "Search blog titles, sort by views/ratings/scroll completion, or isolate posts with specific active features.",
                  side: "bottom", align: "start"
                }
              },
              {
                element: '[data-tour="engagement-table"]',
                popover: {
                  title: "Interactive Engagement Comparisons",
                  description: "Examine detailed post-by-post lists. Click titles to access post-specific telemetry curves.",
                  side: "top", align: "start"
                }
              },
              {
                element: '[data-tour="engagement-gaps"]',
                popover: {
                  title: "Content Gaps Identifier",
                  description: "Audit search keywords that returned zero results on your landing page. Write articles covering these gaps!",
                  side: "top", align: "start"
                }
              }
            ]
          }
        };

        let activeTour = pageTours[pathname];
        if (!activeTour) {
          if (pathname.startsWith("/admin/analytics/clicks/shortlinks/")) {
            activeTour = pageTours["/admin/analytics/clicks/shortlinks/[code]"];
          } else if (pathname.startsWith("/admin/analytics/clicks/") && !pathname.includes("/shortlinks/")) {
            activeTour = pageTours["/admin/analytics/clicks/[id]"];
          }
        }

        if (activeTour && !data.seenPageTours.includes(activeTour.id)) {
          const d = driver({
            showProgress: true,
            allowClose: true,
            steps: activeTour.steps,
            onDestroyStarted: () => {
              trackSeenPageTourAction(activeTour.id);
              d.destroy();
            }
          });

          // Wait for first step target element to be present in the DOM (self-healing for React/Suspense rendering lag)
          const firstTarget = activeTour.steps.find((s) => s.element)?.element;
          if (firstTarget) {
            let count = 0;
            const check = () => {
              if (document.querySelector(firstTarget)) {
                d.drive();
              } else if (count < 20) {
                count++;
                setTimeout(check, 150);
              } else {
                d.drive();
              }
            };
            setTimeout(check, 200);
          } else {
            setTimeout(() => d.drive(), 1000);
          }
        }
      } catch (error) {
        console.error("Onboarding tour failed:", error);
      }
    };

    runTours();
  }, [pathname]);

  return <>{children}</>;
}
