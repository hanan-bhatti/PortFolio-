# Performance Optimization Plan

## Goal
Optimize site page loads, remove rendering bottlenecks, prevent page switches from feeling "stuck", ensure image asset optimization, and refine search engine optimization (SEO).

## Tasks

### 1. Global Page-Transition Progress Bar
- [x] Add `<NextTopLoader />` to the root layout [app/layout.tsx](file:///home/hanan-bhatti/Downloads/portfolio/app/layout.tsx) with a custom amber accent (`#F59E0B`) to provide instant visual feedback on all page transitions.

### 2. Cache DB Configuration and Settings
- [x] Wrap `getSiteSettings()` and `getAboutSettings()` in [lib/settings.ts](file:///home/hanan-bhatti/Downloads/portfolio/lib/settings.ts) with `unstable_cache` to avoid repeated database hits on layout renders and metadata compilation.
- [x] Wrap `getResumeSettings()` in [lib/resume.ts](file:///home/hanan-bhatti/Downloads/portfolio/lib/resume.ts) with `unstable_cache` to speed up resume checks.
- [x] Implement `revalidateTag` in [lib/actions.ts](file:///home/hanan-bhatti/Downloads/portfolio/lib/actions.ts) and [app/api/admin/resume/settings/route.ts](file:///home/hanan-bhatti/Downloads/portfolio/app/api/admin/resume/settings/route.ts) to invalidate settings and resume caches immediately upon modification.

### 3. Add Skeleton Loading fallbacks (loading.tsx)
- [x] Create `loading.tsx` loaders for routes experiencing heavy database fetching, utilizing `boneyard-js` skeletons or custom styled loading components to ensure immediate rendering on page switch:
  - `app/(public)/about/loading.tsx`
  - `app/(public)/resume/loading.tsx`
  - `app/(public)/photography/loading.tsx`

### 4. Image Performance & SEO Auditing
- [x] Inspect public pages to ensure all images use Next.js `next/image` rather than raw HTML `<img>` tags (which cause slower LCP and layout shifts).
- [x] Ensure descriptive alt texts are present on all images to maximize SEO indexing and accessibility.

### 5. Layout & Stacking Context Fixes
- [x] Fix photography page lightbox being rendered beneath the footer by removing `z-10` stacking context from `<main>` inside [app/(public)/layout.tsx](file:///home/hanan-bhatti/Downloads/portfolio/app/(public)/layout.tsx).

## Verification
- Run TypeScript compilation checks: `npx tsc --noEmit`
- Run linter runner: `npm run lint`
- Run master validation checklist: `python3 .agents/scripts/checklist.py .`
