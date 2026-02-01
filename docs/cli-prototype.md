# CLI Prototype: Capability Map Generator

*January 30, 2026*

## Purpose

This prototype implements a minimal `npx n.codes` CLI that can initialize configuration, generate a capability map, update it incrementally, and validate the result. It is designed for rapid iteration and serves as scaffolding for future production tooling.

## LLM Requirement

Capability map generation is an LLM-based feature. In production, the CLI must require a configured provider/model and a valid API key before generating or updating the map. Any heuristic-only fallback should be explicitly labeled as a non-LLM prototype mode.

## Commands

```bash
npx n.codes init       # Interactive setup wizard (provider + model)
npx n.codes dev        # Incremental updates using cached file index
npx n.codes sync       # Full re-introspection of the codebase
npx n.codes validate   # Validate capability map structure
```

## File Outputs

- `n.codes.config.json` — CLI configuration (provider, model, map path)
- `.env.local` — local API key storage (provider-specific key like `OPENAI_API_KEY`)
- `n.codes.capabilities.yaml` — capability map (YAML)
- `.n.codes.cache.json` — file index cache for incremental updates

## How It Works

1. **Init**
   - Prompts for provider (OpenAI, Claude, Grok, Gemini)
   - Captures a default model and optional project name
   - Prompts for an API key and stores it in `.env.local`
   - Writes `n.codes.config.json`

2. **Sync**
   - Walks the project directory for source files (`.js`, `.jsx`, `.ts`, `.tsx`)
   - Infers basic capabilities from file paths
   - Writes a full capability map and updates the cache

3. **Dev**
   - Compares current file index with `.n.codes.cache.json`
   - Rebuilds the capability map and records changed files in `meta.changedFiles`

4. **Validate**
   - Parses the capability map and checks required sections
   - Returns errors if keys are missing or malformed

## Prototype Data Model

The capability map is serialized as YAML using a small, deterministic serializer. The CLI reads the same YAML back when validating or updating the map.

- `actions` represent mutating REST operations inferred from API routes. Each action is documented per HTTP method with `endpoint.method`, `endpoint.path`, and a 2–3 sentence `description`.
- `queries` represent read-only REST endpoints (`GET`/`HEAD`). They include an `endpoint` plus a short `description` suitable for UI/data-fetching use cases.

## Code Map

- `cli/bin.js` — entrypoint, argument parsing and command dispatch
- `cli/lib/args.js` — CLI args parser
- `cli/lib/config.js` — configuration load/save
- `cli/lib/init.js` — interactive setup
- `cli/lib/introspect.js` — file scanning + diffing
- `cli/lib/capability-map.js` — map creation + validation helpers
- `cli/lib/dev.js` — incremental map updates
- `cli/lib/sync.js` — full map generation
- `cli/lib/validate.js` — validation command
- `cli/lib/io.js` — Node IO + memory IO (tests)
- `cli/lib/cache.js` — cache file helper

## Tests

The prototype uses Node's built-in test runner. Example:

```bash
node --test cli/tests/*.test.js
```

The tests cover all CLI functions and exercise the commands in memory where possible.

## Coverage + Enforcement

- Run coverage locally: `npm run coverage` (enforces 80% thresholds).
- Git hooks: enable with `git config core.hooksPath .githooks` to run coverage on every commit.
- CI: `.github/workflows/coverage.yml` runs `npm run coverage` on pull requests and main.

## Extension Ideas

- Swap the lightweight YAML parser for a full YAML parser when needed
- Add API spec readers (OpenAPI/GraphQL) to enrich `actions` + `queries`
- Add file watchers for a true streaming `dev` mode
- Pluggable inference rules to map company-specific conventions to capabilities
