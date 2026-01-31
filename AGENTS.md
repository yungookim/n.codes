# Repository Guidelines

## Project Structure & Module Organization
- `public/` contains the production landing page and static assets. Key files include `public/index.html` (landing page) and SEO assets like `public/og.html`, `public/robots.txt`, and icons.
- `public/demo/` holds the interactive demo (`public/demo/index.html`, `public/demo/styles.css`, `public/demo/app.js`).
- `docs/plans/` includes architecture or planning docs such as `docs/plans/architecture-design.md`.
- `README.md` explains the product context; `draft.md` is scratch space.

## Build, Test, and Development Commands
- `npm install -g live-server` — install the local static server used for development.
- `live-server` (run from `public/`) — serve the landing page with live reload at `http://127.0.0.1:8080`.
- `live-server public/demo` — serve the demo page directly when iterating on demo-only changes.

## Coding Style & Naming Conventions
- Indentation: 2 spaces in HTML/CSS/JS, as used across `public/index.html` and `public/demo/app.js`.
- JavaScript: vanilla, no build step; prefer `const`/`let`, semicolons, and small, named helper functions.
- HTML/CSS: class and id names use kebab-case (e.g., `ncodes-panel`, `quick-prompt`).
- Keep inline CSS in `public/index.html` aligned with the existing variable-driven theme (`:root` tokens).

## Testing Guidelines
- Automated tests: `node --test cli/tests/*.test.js`.
- Coverage gate: `npm run coverage` must stay at or above 80% for lines, functions, branches, and statements.
- AI agents: always run `npm run coverage` before finishing work and confirm the coverage thresholds pass.
- Smoke checks: open `public/index.html` and `public/demo/index.html`, verify layout, interactions, and responsive behavior.

## Commit & Pull Request Guidelines
- Commit messages are short and imperative (e.g., “Add interactive demo”, “Fix wording for clarity”).
- Optional scope prefixes like `docs:` are acceptable when changes are documentation-only.
- PRs should include: a clear description, linked issue (if any), and screenshots or a short recording for UI changes.

## Security & Configuration Tips
- This is a static site; avoid adding runtime secrets to the repo.
- Prefer local testing with `live-server` instead of adding new build tooling unless necessary.
