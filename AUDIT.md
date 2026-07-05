# AUDIT.md

## 1. Environment Variables Referenced in Code

Below is the list of all environment variables referenced throughout the codebase (`process.env.X`):

| Variable Name | Reference Location(s) | Description / Purpose | Required / Optional |
|---|---|---|---|
| `DATABASE_URL` | `lib/prisma.ts` | PostgreSQL connection string | **Required** |
| `AUTH_SECRET` | Implicit (NextAuth) | NextAuth v5 session/signing secret | **Required** |
| `AUTH_URL` | Implicit (NextAuth) | Canonical NextAuth URL | **Required** (esp. in prod) |
| `ADMIN_EMAIL` | NextAuth init / Actions | Default email for first-time login (not explicitly used in login verification except to seed dynamic first user) | **Optional** (Db-driven first user registration fallback is active) |
| `ADMIN_PASSWORD_HASH` | NextAuth init | Default admin password hash | **Optional** (dynamic first user signup fallback is active if db is empty) |
| `RESEND_API_KEY` | `app/api/contact/route.ts`, `lib/email.ts` | API Key for Resend email service | **Optional** (messages are still stored in db if missing) |
| `CONTACT_EMAIL_TO` | `app/api/contact/route.ts` | Email to receive contact form submissions | **Optional** |
| `CONTACT_EMAIL_FROM` | `app/api/contact/route.ts`, `lib/email.ts` | Sender email address for contact alerts | **Optional** |
| `BLOG_EMAIL_FROM` | `lib/actions.ts` | Sender email address for newsletter campaigns | **Optional** |
| `UPLOADTHING_TOKEN` | Implicit (UploadThing) | Token authentication for UploadThing storage | **Optional** (features disabled if missing) |
| `NEXT_PUBLIC_SITE_URL` | Multiple places (blog, projects, resume page metadata, sitemap.ts, shortener.ts, actions.ts) | The public base URL of the website | **Required** |
| `GITHUB_TOKEN` | `app/api/github-stats/route.ts`, `lib/github-cache.ts` | GitHub Personal Access Token for stats query | **Optional** |
| `FINGERPRINT_SALT` | `app/api/analytics/identify/route.ts` | Hash salt for visitor fingerprint generation | **Required** (fallback "default-salt-value" is insecure) |
| `NODE_ENV` | Multiple files | Current runtime environment (dev/prod) | Set by Next.js |

---

## 2. Hardcoded Secrets and Leaks Flagged in Git History / Code

- **Hardcoded secrets found in committed `.env`:**
  - `DATABASE_URL`: Contains dynamic Neon DB credentials (`neondb_owner:npg_PY8waXvsDo2U@...`). **Security issue: Rotate Neon DB credentials.**
  - `AUTH_SECRET`: Hardcoded session token (`lAnTyTqP3jiUf5...`). **Security issue: Rotate key.**
  - `RESEND_API_KEY`: Active API key (`re_Kq5eHmGG_25CNukpHukAHayNbiZBH3Cw7`). **Security issue: Deactivate/Rotate key.**
  - `UPLOADTHING_TOKEN`: Complete UploadThing API secret token token key (`eyJhcGlLZXkiOiJza19saXZlXzQyZTgwNDY3N2I0ZjIxNmUwMWIzZmRlY2I0OThkOGRmNWJkOTQ3MjUxNDFkOWU3MWMwY2Q0M2FlODdjZGY4OTUiLCJhcHBJZCI6InpoOWVqMmhxZGYiLCJyZWdpb25zIjpbInNlYTEiXX0=`). **Security issue: Deactivate/Rotate token.**
  - `GITHUB_TOKEN`: GitHub personal access token (`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`). **Security issue: Deactivate/Rotate token.**
- **Admin Email/Password in committed `.env`:**
  - `ADMIN_EMAIL="admin@example.com"`
  - `ADMIN_PASSWORD_HASH` (bcrypt hash)
- **Hardcoded IP addresses, personal identifiers, or cloud references:**
  - `ip-api.com` integration is used for visitor geo-enrichment (free tier, no API key needed).
  - No Oracle Cloud IPs, Tailscale keys, or Coolify secrets were found in the codebase files themselves.

---

## 3. Admin-Only Routes & Exposed CMS Settings

### Admin-Only Pages (under `/admin`)
All routes under `/admin` (except `/admin/login`) are protected by NextAuth session validation middleware:
- `/admin/dashboard` - Main overview statistics, workspace highlights, dynamic lists.
- `/admin/posts` - Blog post list, draft/publish status, creation/deletion.
- `/admin/projects` - Portfolio projects list, sortable drag-and-drop order, creation.
- `/admin/skills` - Category lists and level indicators (1-100) with drag-and-drop.
- `/admin/experience` - Work experiences list and duration.
- `/admin/about` - Detailed "About Me" settings: story block, currently doing, beyond code, and avatar upload.
- `/admin/settings` - Base Site configuration, theme settings, 2FA setup, and active session manager.
- `/admin/photography` - Photography portfolio manager, visible/hidden visibility toggles, image ordering.
- `/admin/resume` - CV/Resume template preview and editor/builder.
- `/admin/messages` - Contact form inbox with replies.
- `/admin/newsletter` - Newsletter subscription manager and campaign manager.
- `/admin/engagement` - Engagement insights on blog copy clicks, vote feedback, and post surveys.
- `/admin/workspace` - Dynamic visual playground and personal dashboard manager.

### Exposed Settings in `SiteSettings`
These fields are configured in the `SettingsForm` CMS UI and stored in the database:
- `siteName` - The user's name shown in navbar and headers.
- `tagline` - Quick subtitle/tagline under the site name.
- `aboutBio` - Summary text for landing page.
- `profilePhotoUrl` - URL for the avatar profile photo.
- `socialGithub` - Link to GitHub profile.
- `socialLinkedin` - Link to LinkedIn profile.
- `socialTwitter` - Link to Twitter/X profile.
- `socialEmail` - Primary contact email.
- `heroPhotoUrl` - Image URL for the large landing page hero image.
- `heroTagline` - Title/header text on the landing page hero section.
- `statsYears` - Counter text (e.g., "3+").
- `statsProjects` - Counter text (e.g., "20+").
- `statsContributions` - Counter text (e.g., "50+").
- `statsCommits` - Counter text (e.g., "426").
- `marqueeSkills` - Comma-separated uppercase skill list for the marquee banner.
- `photography_enabled` - Boolean ("true"/"false") to display or hide the photography tab.
- `photography_title` - Title text of the photography page.
- `photography_description` - Description text of the photography page.
- `analytics_enabled` - Boolean ("true"/"false") to enable/disable self-hosted visitor tracking.
- `cookie_consent_text` - Legal disclaimer text in the cookie banner.
- `footerLocation` - Text indicating your physical city.
- `footerTimezone` - Text indicating timezone offset and sleep cycle info.
