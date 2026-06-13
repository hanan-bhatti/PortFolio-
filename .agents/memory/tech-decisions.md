---
type: project
created: 2026-06-13
updated: 2026-06-13
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
