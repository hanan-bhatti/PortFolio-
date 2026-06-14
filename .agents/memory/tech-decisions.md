---
type: project
created: 2026-06-13
updated: 2026-06-14
---

# Technical Decisions

## Two-Factor Authentication (2FA)
- Generate standard 16-character Base32 secrets (80 bits of entropy) to ensure standard authenticator app compatibility.
- Counter buffers for TOTP HMAC hashing must allocate exactly 8 bytes and write the counter in big-endian format to the lower 4 bytes (`buffer.writeUInt32BE(0, 0)` and `buffer.writeUInt32BE(counter, 4)`) to avoid JavaScript 32-bit shift wrap duplicate value errors.

## React Query & Next.js Router Performance
- Wrap any Client Components utilizing `useSearchParams` (like tab controllers or layout filters) in a `<Suspense>` boundary to prevent client-side routing de-optimization and render warnings.

## Version Control & Hosting
- Set primary repository remote (`origin`) to GitHub (`git@github.com:hanan-bhatti/PortFolio-.git`).
- Renamed the GitLab remote to `gitlab` for archive purposes.

## Client-Side PDF Generation (Resume)
- Generate the resume PDF entirely client-side using a dynamic import of `html2pdf.js` to avoid browser binary (Chromium) execution overhead and cold starts in Vercel serverless functions.
- Format the PDF output canvas size as A3 portrait (`format: "a3"` in jsPDF) to allow comprehensive multi-section resume content to fit on exactly one page.
- Avoid inline flex gaps on structural layout containers; use CSS classes (e.g. `.resume-col`) to easily reset gaps (`gap: 0 !important`) and tighten margins/paddings when printing or generating PDFs.

## Analytics Network Request Caching
- Cache the visitor ID in memory and check `sessionStorage` inside `initAnalytics` before triggering `/api/analytics/identify` POST requests. This prevents duplicate identify calls on initial page load caused by multiple concurrent client providers mounting.

## Codebase Clean Up & AI Indexing
- Maintain a clean repository root by moving all feature/task-specific planning and specification markdown files to the `.agents/memory/` directory, leaving only `README.md`, `LICENSE`, `llms.txt`, and `CHANGELOG.md` at the root.
- Keep the `proxy.ts` file at the root exactly as is for custom routing/middleware integrations.
- Maintain an AI-friendly `llms.txt` file at the root to summarize key files and concepts for crawler/developer agent reference.

