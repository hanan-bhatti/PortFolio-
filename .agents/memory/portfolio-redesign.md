# Project Plan: Portfolio Redesign & Settings Integration

## Overview
This plan implements new fields in the site settings database, updates the admin settings form with uploader and stat fields, exposes these fields in the public API, and applies a full redesign to the hero section, stats bar, project rows, GitHub activity panel, experiments grid, and blog writing section.

- **Project Type**: WEB
- **Theme**: Dark mode only (no light mode allowed)

---

## Success Criteria
- [ ] Added `hero_photo_url`, `hero_tagline`, `stats_years`, `stats_projects`, `stats_contributions`, `stats_commits` as key-value rows in the `SiteSettings` table.
- [ ] Admin settings form includes Hero Photo uploader (using existing UploadThing setup), Hero Tagline text input, and a 2x2 grid for stats.
- [ ] Public API endpoint `/api/settings` exposes all settings including the new fields.
- [ ] Redesigned hero section with bold typography, Syne Display font, available-for-work badge, brutalist CTA buttons, amber/green accents, and optional grayscale photo.
- [ ] CSS-only scrolling marquee strip below the hero displaying skills.
- [ ] Centered Stats Bar with vertical green dividers showing data from the setting keys.
- [ ] Selected Work section showing featured projects in a responsive 4-column layout.
- [ ] GitHub Activity section with dynamically resolved username and contribution graph.
- [ ] Experiments grid displaying non-featured projects with sharp borders and experiment/discontinued badges.
- [ ] Writing section displaying the latest 2 blog posts with col-2 fallback if only 1 post exists.
- [ ] Verified build (`npm run build`) and clean typescript compilation.

---

## Tech Stack & Styling Tokens
- **Core**: Next.js (App Router), Prisma Client (PostgreSQL)
- **Fonts**: Syne (Display, weights 700/800), Inter (Body)
- **Styling**: Tailwind CSS + Custom CSS Variables in `globals.css`:
  - `--amber`: `#F59E0B`
  - `--amber-dim`: `#92400E`
  - `--green`: `#16A34A`
  - `--green-dim`: `#14532D`
  - `--bg`: `#0a0a0a`
  - `--bg-surface`: `#111111`
  - `--bg-elevated`: `#1a1a1a`
  - `--text-primary`: `#FAFAFA`
  - `--text-muted`: `#6B7280`
  - `--border`: `#262626`

---

## File Structure Changes
```plaintext
app/
├── (public)/
│   └── page.tsx                      # Update main page components & styling
├── api/
│   └── settings/
│       └── route.ts                  # NEW: settings API route
├── globals.css                       # Add CSS custom properties & Syne Font import
components/
├── admin/
│   └── SettingsForm.tsx              # Add UploadThing photo upload & stats 2x2 grid inputs
├── ui/
│   ├── HeroSection.tsx               # Redesign: available-for-work badge, brutalist CTAs, and grayscale hero photo
│   ├── ScrollingMarquee.tsx          # NEW: CSS-only marquee strip
│   ├── StatsBar.tsx                  # NEW: stats bar component
│   ├── SelectedWork.tsx              # NEW: selected work row component
│   ├── GithubActivity.tsx            # NEW: github contribution graph widget
│   ├── ExperimentsSection.tsx        # NEW: experiments grid component
│   └── WritingSection.tsx            # NEW: latest posts grid component
lib/
├── settings.ts                       # Update defaults and getSiteSettings mapping
└── validations.ts                    # Update settingsSchema with new zod properties
```

---

## Task Breakdown

### Phase 1: Database & API Foundation (Backend)
- **Task 1.1**: Update `lib/validations.ts` (`settingsSchema`) and `lib/settings.ts` (`DEFAULTS` and `getSiteSettings`) to include the new fields:
  - `heroPhotoUrl`, `heroTagline`, `statsYears`, `statsProjects`, `statsContributions`, `statsCommits`.
- **Task 1.2**: Create a public API endpoint in `app/api/settings/route.ts` that fetches settings and returns them in JSON format.
- **Task 1.3**: Validate backend integration: prove settings can be retrieved and are returned correctly.

### Phase 2: Admin settings updates (Frontend)
- **Task 2.1**: Modify `components/admin/SettingsForm.tsx` to add:
  - Hero Photo upload input (using `UploadButton` from `@/lib/uploadthing` with uploader thumbnail preview and a remove button).
  - Hero Tagline text input.
  - Stats 2x2 grid text inputs.
- **Task 2.2**: Update styles of form inputs to be consistent with admin theme. Verify saving Settings updates settings values in database.

### Phase 3: Global Styles & Font Setup
- **Task 3.1**: Update `app/globals.css` to add color variables (`--amber`, `--green`, etc.) and import the Syne Google Font.
- **Task 3.2**: Configure Syne font globally or via standard Next.js Google Fonts setup in `app/layout.tsx`.

### Phase 4: UI Redesign Implementation
- **Task 4.1**: Rewrite `components/ui/HeroSection.tsx` with:
  - LEFT SIDE (55% width): available-for-work label (pulsing green dot), Syne 800 main heading, name tagline, CTAs, and SVG social links.
  - RIGHT SIDE (45% width): relative positioned grayscale photo (bottom bleed) and HB background text.
  - Responsive stacking: image above text on mobile (<768px).
- **Task 4.2**: Create `components/ui/ScrollingMarquee.tsx` for the infinitely scrolling skills marquee.
- **Task 4.3**: Create `components/ui/StatsBar.tsx` using stats variables.
- **Task 4.4**: Create `components/ui/SelectedWork.tsx` to list featured projects in a brutalist grid.
- **Task 4.5**: Create `components/ui/GithubActivity.tsx` to fetch settings, extract GitHub username, embed Romeievsky's contribution chart with invert filter, and list commit stats.
- **Task 4.6**: Create `components/ui/ExperimentsSection.tsx` showing non-featured projects in a grid.
- **Task 4.7**: Create `components/ui/WritingSection.tsx` for latest 2 posts.
- **Task 4.8**: Assemble everything in `app/(public)/page.tsx`.

---

## Phase X: Verification Checklist
- [x] No purple/violet color hex codes.
- [x] Compile check: `npx tsc --noEmit`.
- [x] Lint check: `npm run lint`.
- [x] Build check: `npm run build`.

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-06-13
