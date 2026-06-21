---
type: task
created: 2026-06-21
updated: 2026-06-21
status: completed
---

# Task: Analytics Interactions Tracking & Short Links

Implement click tracking for external links, copies tracking for code blocks, a share button generating short links, and an admin analytics dashboard page to display the tracking statistics.

## Phase 1: Database Design & Migration
- [x] Create Prisma models in `schema.prisma`:
  - `ShortLink`: maps alphanumeric codes to target URLs for links and shares
  - `ShortLinkClick`: logs visits/clicks on short links, including user agent, referer, and visitor ID
  - `CodeCopyEvent`: logs copy actions on inline/multiline code blocks, including code snippet and visitor ID
- [x] Update database schema using `npx prisma db push` to synchronize changes.

## Phase 2: Shortening & Redirect System
- [x] Create `lib/shortener.ts` to manage:
  - `getOrCreateShortLink()`: look up or create short links by URL/type/post
  - `shortenPostHtml()`: parse post HTML content, identify external links, and replace them with tracked `/s/[code]` short URLs
- [x] Add helper `generateShortCode()` in `lib/utils.ts`.
- [x] Implement the short link redirect handler at `app/s/[code]/route.ts`. It registers a `ShortLinkClick` with visitor context and redirects users to the destination.

## Phase 3: Event Tracking Endpoints
- [x] Create `app/api/analytics/copy/route.ts` to record code copy events.
- [x] Create `app/api/analytics/share/route.ts` to log share button usage events.

## Phase 4: Client Integration
- [x] Create `components/blog/BlogContentClient.tsx` Client Component:
  - Renders raw post content HTML.
  - Client-side hook detects `<pre>` (multiline) and `<code>` (inline) elements, injects copy buttons with unique HTML IDs (e.g., `copy-btn-pre-block-0`), and copies text.
  - Passes unique `codeBlockId` (e.g. `pre-block-0`, `inline-block-1`) to identify which block was copied.
  - Intercepts clicks on `/s/[code]` links to append local visitor ID parameter (`?v=...`) before redirecting.
- [x] Create `components/blog/ShareButton.tsx` Client Component:
  - Copies the tracked share URL to clipboard and logs share event.
- [x] Update `app/(public)/blog/[slug]/page.tsx`:
  - Run shortener logic on post HTML.
  - Retrieve/create the share link.
  - Render `ShareButton` next to post metadata and replace dangerouslySetInnerHTML with `BlogContentClient`.

## Phase 5: Dashboard View & Navigation
- [x] Create `app/admin/(protected)/analytics/clicks/page.tsx` displaying:
  - Interactive tab bar to switch between traffic overview and interactions.
  - Key counters for total copies, external link clicks, and share clicks.
  - Tabular logs of short links with click counts, types, and post titles.
  - Live log of code copies.
- [x] Add navigation link to sidebar in `components/admin/Sidebar.tsx` and prevent overlapping active states.
