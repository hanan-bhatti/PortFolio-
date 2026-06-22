# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Blog Post Engagement & Reader-Intent System:
  - Added new models to `prisma/schema.prisma` (`PostEngagementConfig`, `PostEmojiReaction`, `PostHelpfulVote`, `PostStarRating`, `PostSectionReaction`, `PostEndSurveyResponse`, `PostNotifyRequest`, `PostAnalyticsEvent`, `SiteSearchQuery`).
  - Implemented client-side unified `PostEngagementWrapper.tsx` containing emoji reactions bar, helpful votes pill pairs, 5-star rating selectors, post suggestions survey form, notify subscription form, exit intent popup modal, and passive analytics tracking.
  - Refactored `components/blog/BlogContentClient.tsx` to dynamically inject hover section reaction triggers next to headings and code blocks.
  - Modified heading ID generation in `lib/tiptap-html.ts` to use deduplicated slug strings instead of absolute array indices, preventing ID drift across post content edits.
  - Added server-side initial aggregation query pre-fetch block in `app/(public)/blog/[slug]/page.tsx` to pass initial summary data to client components and avoid layout shifts.
- Engagement Analytics Admin UI:
  - Added new navigation link in the admin sidebar pointing to the Overview dashboard (`/admin/engagement`).
  - Implemented the `EngagementOverviewClient` overview dashboard supporting custom table listings, engagement feature badges, and zero-result search content gaps logs.
  - Implemented `PostEngagementDrilldownClient` and server routing for per-post statistics deep-dives (emoji splits, rating histograms, section heatmaps, copy counters, UTM breakdowns, difficulty splits, and subscriber notifications).
  - Configured custom positioning rules on `html` and `body` in `app/globals.css` to prevent Framer Motion scroll calculations layout warnings.
- Security & Session Identification Migration:
  - Migrated first-party `visitorId` session tracking from insecure `localStorage` storage to secure, cookie-backed storage.
  - Refactored `BlogContentClient.tsx`, `ShareButton.tsx`, and `lib/analytics.ts` to retrieve visitor session identifier from cookies.
  - Configured response headers in POST `/api/analytics/identify` route to set 1-year expiration cookie.
- Toggleable responsive Sidebar with backdrop overlay, mobile drawer layout, and hamburger menu.
- Standardized JSDoc file headers to all TypeScript and TSX files in `lib/`, `components/`, and `app/` (over 100 files).
- Created AI-friendly `llms.txt` file in the root to help crawler and agent tools index the codebase.
- Created `CHANGELOG.md` and `docs/adr/ADR-001-codebase-cleanup.md` to trace project improvements.

### Fixed
- Fixed bot-detection regular expression (`BOT_PATTERN` in `app/api/analytics/identify/route.ts`) incorrectly matching `"Mozilla"` user agent substring (via case-insensitive `moz` keyword), which previously classified all standard browser user agents as bots and skipped visitor session identification.

### Changed
- Consolidated conflicting dynamic routes `/api/posts/[slug]` and `/api/posts/[id]` into a single unified `/api/posts/[id]` routing tree, supporting retrievals by both slug strings and ID keys.
- Refactored protected admin layout (`app/admin/(protected)/layout.tsx`) to support responsive flow (`flex-col md:flex-row`) and dynamic padding.
- Made `PageHeader` responsive to prevent overflow on mobile, and forced inline action placement to prevent wrapping.
- Refactored `MessagesTable`, `ProjectsManager`, `ExperienceManager`, and `SkillsManager` to support stacked layouts on mobile and sharp, flat-accented theme styling.
- Refactored `DashboardPage` (`app/admin/(protected)/dashboard/page.tsx`) grid column flows, stats card width spans, sparkline scaling, and text truncation bounds to be fully mobile friendly:
  - Fixed stats card heights to a consistent `h-[115px]` and resolved Activity Card spans to prevent layout gaps.
  - Placed the "Live Site ↗" action inline with the main title header.
  - Converted Quick Actions to a horizontally scrollable list on mobile, using a new `.scrollbar-none` CSS utility class in `globals.css`.
  - Added `min-w-0 overflow-hidden` to all four Panels Grid sections to prevent grid items from stretching and causing horizontal page scrolling on long texts.
  - Refined stats card headings text color to `text-zinc-400` for improved contrast and visual comfort.
- Refactored `AnalyticsDashboardPage` (`app/admin/(protected)/analytics/page.tsx`) to comply with the flat-accented theme and prevent mobile horizontal overflows:
  - Replaced all rounded corners (`rounded-2xl`, `rounded-full`, and `rounded`) with sharp corners (`rounded-none`) to adhere to the Admin design system.
  - Updated the 4 stats cards to match the dashboard's design token sizing, dark background (`bg-[#0c0c0c]`), height (`h-[115px]`), and uppercase monospace fonts.
  - Wrapped all cards, grids, and horizontal-scrolling tables (recent visitors, traffic sources, UTM campaigns) with `min-w-0 overflow-hidden` to prevent layout boundaries from stretching on small screen sizes.
  - Implemented cell-level span truncation for long page paths, referrers, and campaign names.
  - Placed the "Clear Analytics Data" button inline with the "Analytics" title in the header, using a smaller responsive layout.
  - Wrapped the 30-day page views chart in a horizontally scrollable container (`overflow-x-auto`) with a minimum width on mobile to ensure bars are touch/tap optimized.
  - Restructured the Recent Visitors and UTM Campaigns tables to dynamically hide non-essential columns on mobile and tablet viewports to prevent layout overflows.
- Relocated specification and task markdown files from the repository root to the `.agents/memory/` directory to clean up the workspace:
  - `admin-crud-skills-experience.md` -> `.agents/memory/admin-crud-skills-experience.md`
  - `analytics-system.md` -> `.agents/memory/analytics-system.md`
  - `homepage-skills-experience.md` -> `.agents/memory/homepage-skills-experience.md`
  - `portfolio-redesign.md` -> `.agents/memory/portfolio-redesign.md`
  - `skeleton-loading-integration.md` -> `.agents/memory/skeleton-loading-integration.md`
- Restructured `README.md` at the root using standard scannable templates with updated directories and quickstart guides.

### Removed
- Deleted the unused development scratch script `scratch/check-settings.js`.
