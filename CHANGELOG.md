# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Standardized JSDoc file headers to all TypeScript and TSX files in `lib/`, `components/`, and `app/` (over 100 files).
- Created AI-friendly `llms.txt` file in the root to help crawler and agent tools index the codebase.
- Created `CHANGELOG.md` and `docs/adr/ADR-001-codebase-cleanup.md` to trace project improvements.

### Changed
- Relocated specification and task markdown files from the repository root to the `.agents/memory/` directory to clean up the workspace:
  - `admin-crud-skills-experience.md` -> `.agents/memory/admin-crud-skills-experience.md`
  - `analytics-system.md` -> `.agents/memory/analytics-system.md`
  - `homepage-skills-experience.md` -> `.agents/memory/homepage-skills-experience.md`
  - `portfolio-redesign.md` -> `.agents/memory/portfolio-redesign.md`
  - `skeleton-loading-integration.md` -> `.agents/memory/skeleton-loading-integration.md`
- Restructured `README.md` at the root using standard scannable templates with updated directories and quickstart guides.

### Removed
- Deleted the unused development scratch script `scratch/check-settings.js`.
