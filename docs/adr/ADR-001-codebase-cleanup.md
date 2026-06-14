# ADR-001: Codebase Cleanup and Documentation Standardization

## Status
Accepted

## Context
The repository had accumulated several planning and specification `.md` files at the root level, which cluttered the workspace. Additionally, the source code files (under `lib/`, `components/`, and `app/`) lacked unified file-level JSDoc headers detailing their names, purposes, and list of exports/methods. Unused development scratch files were also left in the repository.

To improve project readability for humans and optimization for agent-based development workflows, we needed a systematic way to clean the repository and standardise file header comments.

## Decision
We decided to:
1. **Relocate Specification Files**: Move all root-level task and spec markdown files into the `.agents/memory/` directory to preserve historical planning context without cluttering the root folder.
2. **Standardise Code Documentation**: Add standard JSDoc header comments to the top of all `.ts` and `.tsx` source files inside `lib/`, `components/`, and `app/`.
3. **Remove Dead Assets**: Delete the obsolete scratch script `scratch/check-settings.js`.
4. **Keep Custom Infrastructure**: Retain the root level `proxy.ts` file exactly as is to respect existing configurations.
5. **Establish AI and Human Readme Indexes**: Establish a clean, updated `README.md` and an AI-focused `llms.txt` entry point at the root level.

## Consequences
- **Cleaner Workspace**: The repository root folder is clear of ad-hoc task specifications, highlighting only standard configuration files (`package.json`, `next.config.ts`, etc.).
- **Self-Documenting Code**: Standard JSDoc blocks allow developer tools, compilers, and AI context parsers to instantly extract the roles and exports of over 100 files without scanning complete function bodies.
- **Traceable History**: Changes are catalogued inside `CHANGELOG.md` and this Architecture Decision Record for long-term auditability.
