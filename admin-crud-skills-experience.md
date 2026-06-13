# Admin CRUD for Skills & Experience

## Goal
Build full admin CRUD management for Skills and Experiences, including Prisma backend endpoints, list/create/edit views in the admin panel, and integration into the admin sidebar.

## Tasks
- [x] Task 1: Create backend API endpoints for Skills (`/api/admin/skills` and `/api/admin/skills/[id]`) → Verify: `curl -I /api/admin/skills` redirects to login or returns 401 when unauthorized.
- [x] Task 2: Create backend API endpoints for Experience (`/api/admin/experience` and `/api/admin/experience/[id]`) → Verify: Endpoints handle GET/POST/PATCH/DELETE correctly.
- [x] Task 3: Implement Sidebar links under a "Content" divider in `components/admin/Sidebar.tsx` → Verify: Skills and Experience options display in the sidebar.
- [x] Task 4: Create Skills list page at `app/admin/(protected)/skills/page.tsx` with Grid/List layout toggle → Verify: Items display correctly and toggle functions.
- [x] Task 5: Create Skills create page (`/admin/skills/new`) and edit page (`/admin/skills/[id]`) with Si visual picker and custom slider preview → Verify: Creation/modification works and alerts success/failure.
- [x] Task 6: Create Experience list page at `app/admin/(protected)/experience/page.tsx` with Grid/List toggle → Verify: List renders items and correctly indicates active experiences.
- [x] Task 7: Create Experience create/edit forms with month date picker inputs and "Present" conditional disabling logic → Verify: Start/End date constraints behave as expected.
- [x] Task 8: Run project checks and typescript compiler verification → Verify: `npx tsc --noEmit && npm run lint` runs successfully.

## Done When
- [x] All database actions (Create, Read, Update, Delete) are operational for both models.
- [x] The Si visual picker correctly filters and renders icons dynamically.
- [x] TypeScript compilation checks and the linter pass without errors.
