# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-05

### Added
- **Dynamic Creation Celebrations**: Added an interactive, database-backed celebration system. When the user successfully publishes their first post, project, photography item, skill, or career experience, a canvas-confetti blast triggers alongside a congratulatory popover.
- **Onboarding Self-Healing element detection**: Upgraded the interactive onboarding tours to poll for target DOM elements rather than utilizing static timeouts. This resolves race conditions and positioning errors caused by React Suspense hydration delay during router transitions.
- **Granular Help Coverage**: Audited and completed InfoTooltip coverage across every single input field on all admin forms, including Settings tabs (General, Hero & Bio, Social, Security & 2FA, Devices, Help & Tours) and certifications forms.
- **Slash Commands Menu**: Implemented a fully keyboard-navigable and search-filterable slash commands popover inside both the Workspace block editor and the Blog Post TipTap editor. Users can filter block options reactively by typing, with automatic range replacement.

### Fixed
- **driver.js Popover Alignment**: Fixed an issue where the onboarding tour popover would sometimes hover in the center of the viewport due to premature initialization prior to hydration.
- **driver.js Selector Syntax**: Fixed invalid jQuery-style `:contains()` css selector syntax that caused JS errors in driver.js engine.
- **Celebration State Persistence**: Replaced the fragile local-storage state tracking with secure, postgres-backed boolean columns on the `AdminUser` model, maintaining state consistency across different browsers and active sessions.

---

## [1.0.0] - 2026-07-05

### Added
- **Open-Source Repository Preparation**:
  - Re-licensed codebase under the **GNU Affero General Public License version 3 (AGPL-3.0-or-later)**.
  - Formulated a standard licensing header notice in `app/layout.tsx` and mapped `"license": "AGPL-3.0-or-later"` inside `package.json`.
  - Added a comprehensive documentation suite to orient self-hosters and open-source contributors:
    - [README.md](file://./README.md): Primary system overview, setup, and navigation map.
    - [SETUP.md](file://./SETUP.md): Step-by-step developer installation guide.
    - [ARCHITECTURE.md](file://./ARCHITECTURE.md): Structural analysis including schema diagrams and authentication sequences.
    - [DEPLOYMENT.md](file://./DEPLOYMENT.md): VPS container guidelines (Coolify + Traefik).
    - [CONTRIBUTING.md](file://./CONTRIBUTING.md): Git commit formatting rules and coding standards.
    - [SECURITY.md](file://./SECURITY.md): Private vulnerability disclosure procedures.
  - Implemented **in-app interactive onboarding tours** powered by `driver.js` that automatically guide first-time self-hosters through all 13 admin panel routes.
  - Integrated inline help indicators next to form labels in Settings and Biography layouts to clarify configurations.
  - Added an "Onboarding Reset" controller inside Settings to allow users to trigger walkthrough tours again.
  - Added secure database-backed seen state fields (`hasSeenAdminTour`, `seenPageTours`) on the `AdminUser` model.
  
- **Visual Design & Interactive Features**:
  - Designed a dark-mode, neo-brutalist flat theme (`#0a0a0a`) with high-contrast amber highlights and sharp terminal-styled grid layouts.
  - Added an interactive cursor spotlight mask over landing page headings.
  - Integrated an interactive canvas-rendered pixelation portrait on the landing page that adjusts visual resolution based on cursor proximity.
  - Implemented WebGL-based custom liquid-glass shader active on navigation highlights.
  
- **Admin CMS & Content Platforms**:
  - Built an administrative portal (`/admin`) protecting access using NextAuth v5 credentials with optional TOTP-based 2FA verification.
  - Formulated a rich-text blog post editor utilizing TipTap with markdown, code highlights, and inline image uploads.
  - Added dynamic session logging tracking active browser sessions, countries, IP addresses, and enabling immediate token-level session revocation.
  - Designed inline markdown timeline managers to catalog portfolio work experience, dynamic skills, and certification achievements.
  
- **Analytics & Engagement System**:
  - Formulated first-party, cookie-backed visitor telemetry tracking page views, search queries, UTM campaigns, and resume downloads.
  - Added user-engagement analytics showing post emoji reactions, star ratings, exit-intent prompts, and section heatmaps.
  - Built a newsletter system supporting markdown campaigns dispatched through Resend.

### Fixed
- **Analytics Bot Filter**: Fixed a regular expression bot filter issue that classified standard user agents (containing the substring "Mozilla") as crawlers and skipped logging session telemetry.
- **Analytics Salt Integrity**: Hardened session security by removing the insecure fallback default value for `FINGERPRINT_SALT` to ensure the tracking engine fails loudly if unconfigured in production.
- **Sidebar Layouts**: Fixed overflow issues on small devices and added drawer toggle behaviors for mobile viewports.

---

## [Unreleased]

### Planned / Roadmap
- *See open issues and project boards for active roadmap details.*
