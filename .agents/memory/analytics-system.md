# First-Party Analytics System Plan

## Goal
Build a complete first-party analytics system from scratch, including visitor identification, pageview tracking, admin analytics dashboard with custom CSS charts, cookie consent banner, privacy policy, and linking contact messages to visitors.

## Tasks
- [x] Task 1: Update `prisma/schema.prisma` with `Visitor` and `PageView` models, and update `ContactMessage`. Add key-value rows to `SiteSettings` (via a database script or seed). Run `prisma db push` → Verify: DB schema updated and push succeeds.
- [x] Task 2: Implement `app/api/analytics/identify/route.ts` API route with SHA-256 fingerprinting and geolocation API fallback → Verify: POST request returns a valid `visitorId`.
- [x] Task 3: Implement `app/api/analytics/pageview/route.ts` API route supporting POST and PATCH (for duration tracking) → Verify: POST/PATCH requests return 200.
- [x] Task 4: Implement `app/api/admin/analytics/route.ts` API route to return structured dashboard stats → Verify: GET request returns 200 with JSON stats.
- [x] Task 5: Create `components/ui/CookieBanner.tsx` and add it to the public layout page (`app/(public)/layout.tsx`) → Verify: Banner animates in after 1s on fresh visit, saves cookie, and animates out.
- [x] Task 6: Create `lib/analytics.ts` client-side tracking library and `components/AnalyticsProvider.tsx` React provider → Verify: Page views and page durations are logged.
- [x] Task 7: Update `components/forms/ContactForm.tsx` and `app/api/contact/route.ts` to link messages to `visitorId`, and add Terms/Privacy policy link text → Verify: Submitted contact messages are linked to a visitor in the DB.
- [x] Task 8: Create Brutalist layout privacy policy (`app/(public)/privacy/page.tsx`) and terms (`app/(public)/terms/page.tsx`) pages → Verify: Accessible at `/privacy` and `/terms`.
- [x] Task 9: Create admin analytics dashboard `app/admin/(protected)/analytics/page.tsx` and add it to `components/admin/Sidebar.tsx` → Verify: Sidebar link displays, dashboard renders CSS chart, visitor list with contact badge, and breakdowns.
- [x] Task 10: Generate `FINGERPRINT_SALT` using OpenSSL, update `.env` and `.env.example` → Verify: Analytics code reads fingerprint salt correctly.

## Done When
- Analytics DB tables exist and API routes function without breaking.
- Session duration and page views are tracked.
- Cookie banner manages consent states correctly.
- Admin analytics dashboard is fully responsive, styled with Tailwind/Vanilla CSS, and displays charts, tables, and recent visitors accurately.
- Contact form submissions are linked to visitor IDs in the database.
- Verification checklist scripts run successfully.

## Notes
- Never store raw IP addresses.
- All analytics must fail silently.
- Ensure TypeScript strict type checking passes.
- Do not use external chart libraries for the dashboard.
