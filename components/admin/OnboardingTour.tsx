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
                  description: "This interactive tour will show you how to manage your portfolio settings, resume, messages, and more. Let's take a quick walk.",
                  position: "mid-center"
                }
              },
              {
                element: "aside",
                popover: {
                  title: "Primary Navigation",
                  description: "Use the sidebar links to switch sections: Content (posts, projects, photography), Personal (resume, skills), System (settings, incoming messages), and Workspace.",
                  position: "right"
                }
              },
              {
                element: "a[href='/admin/dashboard']",
                popover: {
                  title: "Dashboard Overview",
                  description: "Monitor visitor counts, quick action links, and manage your tasks or ideas using the built-in Planner.",
                  position: "right"
                }
              },
              {
                element: "a[href='/admin/settings']",
                popover: {
                  title: "System Settings",
                  description: "Configure your site title, SEO tags, cookie consents, 2FA credentials, and reset onboarding tours whenever you want.",
                  position: "right"
                }
              },
              {
                popover: {
                  title: "Ready to Explore!",
                  description: "You're all set! As you visit each subpage, a brief, page-specific walkthrough will help guide you on how to use it.",
                  position: "mid-center"
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
          "/admin/dashboard": {
            id: "dashboard",
            steps: [
              {
                popover: {
                  title: "Dashboard Planner 📊",
                  description: "This page displays site highlights: visitors, page views, resume downloads, and unread messages.",
                  position: "mid-center"
                }
              },
              {
                element: ".grid.gap-4.grid-cols-2",
                popover: {
                  title: "Quick Statistics Cards",
                  description: "Monitor live counters: see your total visitors, page views, photography counts, and active resume downloads.",
                  position: "bottom"
                }
              },
              {
                element: "div.border.border-\\[\\#262626\\]:has(h2:contains('Quick Actions'))",
                popover: {
                  title: "Quick Actions Panel",
                  description: "Jump directly into creating new posts, projects, or editing about fields with these single-click shortcuts.",
                  position: "bottom"
                }
              },
              {
                element: "button:contains('Planner')",
                popover: {
                  title: "Project & Task Planner",
                  description: "Keep track of backlog items, tasks in progress, milestones, and blog post ideas right on your main dashboard.",
                  position: "top"
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
                  position: "mid-center"
                }
              },
              {
                element: "a[href='/admin/posts/new'], button:contains('New Post')",
                popover: {
                  title: "Create Post",
                  description: "Start writing a new post in the TipTap rich-text editor with support for syntax highlighting, markdown, and image uploads.",
                  position: "bottom"
                }
              },
              {
                element: "table, .border-\\[\\#262626\\]",
                popover: {
                  title: "Draft / Publish Toggles",
                  description: "View post status at a glance, toggle publish state immediately, check view count statistics, or delete old entries.",
                  position: "top"
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
                  position: "mid-center"
                }
              },
              {
                element: "a[href='/admin/projects/new'], button:contains('Create Project')",
                popover: {
                  title: "New Project",
                  description: "Add title, description, cover image, stack list, and URLs pointing to repositories or live demos.",
                  position: "bottom"
                }
              },
              {
                element: ".space-y-2, [role='list']",
                popover: {
                  title: "Drag-and-Drop Ordering",
                  description: "Click and drag projects to re-order them. The sequence here maps directly to the home page list.",
                  position: "top"
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
                  position: "mid-center"
                }
              },
              {
                element: "button:contains('Add Skill')",
                popover: {
                  title: "Create Skill Card",
                  description: "Define a skill name, proficiency level (1-100), select category (e.g. Languages, Tools), and map appropriate icons.",
                  position: "bottom"
                }
              },
              {
                element: ".space-y-4, .grid",
                popover: {
                  title: "Drag-and-Drop Sequence",
                  description: "Re-arrange skills by dragging the grab handles. Adjust hierarchy categories dynamically for clean layouts.",
                  position: "top"
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
                  position: "mid-center"
                }
              },
              {
                element: "button:contains('Add Experience')",
                popover: {
                  title: "Add Position",
                  description: "Input role title, company name, location, duration, current status, and descriptive details.",
                  position: "bottom"
                }
              },
              {
                element: ".border-\\[\\#262626\\]",
                popover: {
                  title: "Manager Timeline",
                  description: "Sort roles, update descriptions, toggle current status, or delete entries. Changes update live in the portfolio timeline.",
                  position: "top"
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
                  position: "mid-center"
                }
              },
              {
                element: "button:contains('Hero & Avatar')",
                popover: {
                  title: "Avatar & Quick Pitch",
                  description: "Upload your main profile avatar image and write a catchy quick-pitch tagline.",
                  position: "bottom"
                }
              },
              {
                element: "button:contains('Your Story')",
                popover: {
                  title: "Story Markdown Editor",
                  description: "Write your biography narrative block. Full markdown formatting is supported with preview toggle.",
                  position: "bottom"
                }
              },
              {
                element: "button:contains('Tech Stack')",
                popover: {
                  title: "Skill Domain Tags",
                  description: "Configure core category headers and add specific skill badge tags (like Node.js, C++) to display visual clusters.",
                  position: "bottom"
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
                  position: "mid-center"
                }
              },
              {
                element: "button:contains('General')",
                popover: {
                  title: "Basic Metadata",
                  description: "Change site title, primary public contact emails, footer locations, and wake offsets.",
                  position: "bottom"
                }
              },
              {
                element: "button:contains('Security & 2FA')",
                popover: {
                  title: "Account Security & TOTP 2FA",
                  description: "Update dashboard password, generate TOTP 2FA QR secrets, and enable secure dynamic sign-ins.",
                  position: "bottom"
                }
              },
              {
                element: "button:contains('Devices')",
                popover: {
                  title: "Revoke Live Sessions",
                  description: "View and manage active browser sessions: see login location, device, IP addresses, and immediately revoke unwanted connections.",
                  position: "bottom"
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
                  position: "mid-center"
                }
              },
              {
                element: ".uploadthing-component, button:contains('Upload')",
                popover: {
                  title: "Image Upload Block",
                  description: "Drag-and-drop or select images. The system auto-extracts camera tags (ISO, aperture, exposure) and applies styling tokens.",
                  position: "bottom"
                }
              },
              {
                element: ".grid, .space-y-4",
                popover: {
                  title: "Visibility & Ordering Toggles",
                  description: "Re-arrange photography order, toggle visible flags on the public page, or remove assets.",
                  position: "top"
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
                  position: "mid-center"
                }
              },
              {
                element: "button:contains('PDF preview'), button:contains('Preview')",
                popover: {
                  title: "Live Rendering Preview",
                  description: "Toggle view templates, select theme variables, and preview formatting output dynamically.",
                  position: "bottom"
                }
              },
              {
                element: "button:contains('Export'), button:contains('Download')",
                popover: {
                  title: "Export & Publish",
                  description: "Save configurations to the database and generate a PDF copy of your CV ready for download.",
                  position: "bottom"
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
                  position: "mid-center"
                }
              },
              {
                element: "table, .divide-y",
                popover: {
                  title: "Message Details",
                  description: "Check sender name, subject, dates, read/unread badge indicators, and thread history.",
                  position: "top"
                }
              },
              {
                element: "button:contains('Reply')",
                popover: {
                  title: "Direct Response Form",
                  description: "Open the rich reply editor to draft response emails, which are sent instantly via Resend.",
                  position: "bottom"
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
                  position: "mid-center"
                }
              },
              {
                element: "button:contains('Subscribers')",
                popover: {
                  title: "Subscribers Database",
                  description: "Monitor subscriber email addresses, confirm status records, and remove unsubscribed entries.",
                  position: "bottom"
                }
              },
              {
                element: "button:contains('Campaigns')",
                popover: {
                  title: "Write & Send Campaign",
                  description: "Compose update campaigns using markdown. Pushes tracking pixel embeds for open statistics.",
                  position: "bottom"
                }
              }
            ]
          },
          "/admin/engagement": {
            id: "engagement",
            steps: [
              {
                popover: {
                  title: "Blog Clicks & Star Ratings 📈",
                  description: "Analyze reader feedback and interactive engagement on your blog articles.",
                  position: "mid-center"
                }
              },
              {
                element: ".grid, .gap-6",
                popover: {
                  title: "Feedback Stats Grid",
                  description: "Review aggregate emoji reactions, average star ratings, helpful vote stats, and section reviews.",
                  position: "top"
                }
              },
              {
                element: "button:contains('Post Details')",
                popover: {
                  title: "Article Level Insights",
                  description: "Inspect specific details for each post: see exact copy events, survey feedback, and exit-intent stats.",
                  position: "bottom"
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
                  position: "mid-center"
                }
              },
              {
                element: ".flex.gap-2.border-b",
                popover: {
                  title: "Page Explorer",
                  description: "Navigate through workspace documents, notes, bookmark collections, and planner lists.",
                  position: "bottom"
                }
              },
              {
                element: "button:contains('New Node'), .hover\\:border-amber",
                popover: {
                  title: "Interactive Sandbox Board",
                  description: "Add inline check-lists, link preview cards, canvas blocks, or customize nodes.",
                  position: "bottom"
                }
              }
            ]
          }
        };

        const activeTour = pageTours[pathname];
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

          setTimeout(() => d.drive(), 1000);
        }
      } catch (error) {
        console.error("Onboarding tour failed:", error);
      }
    };

    runTours();
  }, [pathname]);

  return <>{children}</>;
}
