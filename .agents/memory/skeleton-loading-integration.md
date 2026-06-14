# Skeleton Loading Integration

## Goal
Integrate `boneyard-js` skeletons into the Projects page, Blog page, and Home page to deliver a pixel-perfect, cohesive loading experience.

## Tasks
- [x] Task 1: Add/Verify `boneyard-js` in `package.json` → Verify: Run `npm install boneyard-js` and confirm it is listed in `package.json`.
- [x] Task 2: Update Projects page skeleton loading → Verify: Wrap `ProjectsGrid` component with `<Skeleton name="projects-grid">`, create `app/(public)/projects/loading.tsx` wrapping a dummy grid.
- [x] Task 3: Update Blog page skeleton loading → Verify: Wrap `BlogIndex` component with `<Skeleton name="blog-index">`, create `app/(public)/blog/loading.tsx` wrapping a dummy layout.
- [x] Task 4: Update Home/Hero bento section skeleton loading → Verify: Wrap Bento Grid components in `<Skeleton name="hero-section">` on the home page.
- [x] Task 5: Start local dev server and compile bones → Verify: Run `npx boneyard-js build` and check that `app/bones/` is populated with `.bones.json` files and the registry.
- [x] Task 6: Run verification scripts → Verify: Run `python3 .agents/scripts/checklist.py .` to ensure linting, styling, and basic checks pass.

## Done When
- [x] Skeletons render seamlessly for Projects, Blog, and Home routes.
- [x] The `boneyard-js` build script succeeds and generates correct coordinates.
- [x] No React hydration, TypeScript, or next lint errors.
