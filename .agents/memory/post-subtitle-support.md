---
type: task
created: 2026-06-21
updated: 2026-06-21
status: completed
---

# Task: Post Subtitle Support

Add optional subtitle support to blog posts, including Prisma schema update, database migration, admin editing controls (sharp theme compliance), and rendering on the public post page.

## Phase 1: Environment & Schema Preparation
- [x] Create git branch `feature/post-subtitle-support`
- [x] Update `prisma/schema.prisma` to add optional `subtitle String?` field to `Post` model
- [x] Update database schema: since migrations are not set up on this existing database, we ran `npx prisma db push` to synchronize it without data loss. The database schema has been successfully updated and Prisma client generated!

## Phase 2: Schema & Type Definitions
- [x] Update Zod validation `postSchema` in `lib/validations.ts` to include optional `subtitle` field (nullable, max 200 chars)
- [x] Update `PostEditorData` interface in `components/admin/PostEditor.tsx` to include `subtitle: string | null`
- [x] Ensure standard JSDoc headers are present and correct in modified files:
  - `lib/validations.ts`
  - `components/admin/PostEditor.tsx`

## Phase 3: Admin UI Implementation
- [x] In `components/admin/PostEditor.tsx`:
  - Add React state hook for `subtitle` initialized to `post?.subtitle ?? ""`
  - Add subtitle input field below the title input. Ensure strict compliance with the Admin Design System (`rounded-none`, border `#262626`, focus border `focus:border-amber`).
  - Include `subtitle` in the payload passed to actions inside the `save` function.
- [x] In `app/admin/(protected)/posts/[id]/edit/page.tsx`:
  - Pass the retrieved post's `subtitle` field into the `<PostEditor>` component.
  - Check/add file-level JSDoc header comment.

## Phase 4: Public View Implementation
- [x] In `app/(public)/blog/[slug]/page.tsx`:
  - Retrieve the optional `subtitle` field.
  - Render the subtitle directly below the main title. Use an `h2` tag styled with text color `text-amber` (no purple ban violation), font weight `font-medium`, and margin.
  - Ensure that if `subtitle` is not provided/empty, spacing collapses completely (no padding/margin).
  - Ensure standard JSDoc header is updated/present.

## Phase 5: Verification & Quality Assurance
- [x] Run validation commands: `npm run lint` and `npx tsc --noEmit`
- [x] Confirm everything compiles and runs correctly.
