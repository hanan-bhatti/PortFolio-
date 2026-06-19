# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Toggleable responsive Sidebar with backdrop overlay, mobile drawer layout, and hamburger menu.
- Standardized JSDoc file headers to all TypeScript and TSX files in `lib/`, `components/`, and `app/` (over 100 files).
- Created AI-friendly `llms.txt` file in the root to help crawler and agent tools index the codebase.
- Created `CHANGELOG.md` and `docs/adr/ADR-001-codebase-cleanup.md` to trace project improvements.

### Changed
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
