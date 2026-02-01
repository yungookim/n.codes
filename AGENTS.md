# Repository Guidelines

## Project Structure & Module Organization
- `public/` contains the production landing page and static assets. Key files include `public/index.html` (landing page) and SEO assets like `public/og.html`, `public/robots.txt`, and icons.
- `public/demo/` holds the interactive demo (`public/demo/index.html`, `public/demo/styles.css`, `public/demo/app.js`).
- `cli/` contains the n.codes CLI tool for capability map generation.
- `docs/plans/` includes architecture or planning docs such as `docs/plans/llm-capability-analysis.md`.
- `README.md` explains the product context; `draft.md` is scratch space.

## CLI Module Organization (`cli/lib/`)

Core modules:
- `capability-map.js` — Capability map data structures, YAML serialization, heuristic inference
- `sync.js` — Full capability map generation (`n.codes sync`)
- `dev.js` — Watch mode with incremental updates (`n.codes dev`)
- `introspect.js` — File collection and indexing
- `config.js` — Configuration loading/saving (`n.codes.config.json`)
- `init.js` — Interactive setup (`n.codes init`)
- `cache.js` — File index and analysis result caching
- `validate.js` — Capability map validation (`n.codes validate`)

LLM analysis modules (see `docs/plans/llm-capability-analysis.md`):
- `llm.js` — Vercel AI SDK wrapper, provider config, retry logic, concurrency control
- `imports.js` — Parse and resolve immediate imports from route files
- `analyzer.js` — Build prompts, parse LLM responses, extract and merge entities

Supported LLM providers:
- **OpenAI:** `gpt-5-mini`, `gpt-5.2`
- **Claude:** `claude-sonnet-4-5`, `claude-opus-4-5`, `claude-haiku-4-5`

## Build, Test, and Development Commands

Landing page:
- `npm install -g live-server` — install the local static server used for development.
- `live-server` (run from `public/`) — serve the landing page with live reload at `http://127.0.0.1:8080`.
- `live-server public/demo` — serve the demo page directly when iterating on demo-only changes.

CLI:
- `npm install` — install dependencies (including Vercel AI SDK for LLM analysis).
- `node cli/index.js init` — initialize config with provider/model selection.
- `node cli/index.js sync` — generate full capability map with LLM analysis.
- `node cli/index.js sync --force` — regenerate all routes, ignoring cache.
- `node cli/index.js dev` — watch mode with incremental analysis.
- `node cli/index.js validate` — validate capability map structure.

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
- Capability map generation uses LLM analysis for semantic understanding. Configuration:
  - Provider/model stored in `n.codes.config.json`
  - API keys stored in `.env.local` (not `.env`) — keep out of version control
  - Environment variables: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- If LLM analysis fails, the system falls back to heuristic descriptions marked with `analysisSource: "heuristic"`.
