# CONTRIBUTING.md - Open Source Contributions

Thank you for your interest in contributing to this project! To ensure clean integration, please review our contribution process.

---

## ⚖️ License Agreement

By contributing to this repository, you agree that your contributions will be licensed under the terms of the **GNU Affero General Public License version 3 (AGPL-3.0-or-later)**. 

---

## 🛠️ Code Quality & Style Expectations

### 1. Linting & Core Rules
We enforce standard code validation via ESLint. The configuration extends Next.js core rules:
* **Config File**: [.eslintrc.json](file://./.eslintrc.json) which extends `"next/core-web-vitals"`.
* **Verification Command**:
  ```bash
  npm run lint
  ```
  Ensure your workspace checks return no warnings or errors before pushing.

### 2. Type System Guidelines
This project enforces strict TypeScript formatting.
* Avoid the use of `any` types. Provide explicit type definitions or interfaces.
* Validate all external API payloads and inputs utilizing **Zod schemas** in `lib/validations.ts`.

---

## 📝 Commit Conventions

We enforce the **Conventional Commits** standard to organize changes and build clear changelogs. Format your commit messages as follows:

* **`feat:`**: A new feature (e.g. `feat: implement interactive onboarding tours`)
* **`fix:`**: A bug fix (e.g. `fix: resolve dashboard scroll calculations fallback`)
* **`docs:`**: Documentation improvements (e.g. `docs: update deployment guidelines`)
* **`style:`**: Styling adjustments not affecting logic (e.g. `style: adjust settings layout padding`)
* **`chore:`**: Housekeeping/dependency updates (e.g. `chore: bump driver.js dependency version`)

---

## 🔄 Pull Request Process

1. **Create a Branch**: Create a descriptive feature branch from the main branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Commit Changes**: Author your modifications following clean code guidelines and commit conventions.
3. **Verify Lint & Build**: Make sure everything compiles and builds cleanly:
   ```bash
   npm run lint
   npm run build
   ```
4. **Push & Open PR**: Push changes to your fork and submit a Pull Request targeting the `main` branch. Provide a clear summary outlining the context, adjustments, and test coverage proof.
