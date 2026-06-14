---
type: project
created: 2026-05-25
updated: 2026-06-14
---

# Project Conventions

## Git Workflow
- Always create a new dedicated branch for major code changes.
- Branch name format should follow: `feature/[task-slug]` or `fix/[bug-slug]`.

## Admin Design System
- Admin panel uses a sharp-edged, flat-accented theme.
- Rounded corners are forbidden (`rounded-none`).
- Strict compliance with the Purple Ban: do not use violet, indigo, or purple. Use `#F59E0B` (amber) and `#16A34A` (green) for accents and buttons.
- Input styling: use custom input classes (sharp border `#262626` and focus border `focus:border-amber`).
- Consent verification: use `<EditorialModal />` before performing deletion or critical destructive actions.
- Text selection: text highlighting uses a solid amber background (`var(--amber)`) and black text (`#000000`).
- Scrollbars: custom sharp, thin (8px) dark scrollbar that transitions to amber on hover.

## Code Documentation Standard
- Every TypeScript/TSX source file under `lib/`, `components/`, and `app/` must include a standard file-level JSDoc header comment listing:
  - `@file`: Relative path to the file.
  - `@description`: Brief, clear description of the file's responsibility.
  - `@exports`: Listing of exports/methods with brief explanations of what they do.

