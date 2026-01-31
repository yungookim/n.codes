# CLI Prototype: Capability Map Generator

*January 30, 2026*

## Purpose

This prototype implements a minimal `npx n.codes` CLI that can initialize configuration, generate a capability map, update it incrementally, and validate the result. It is designed for rapid iteration and serves as scaffolding for future production tooling.

## Commands

```bash
npx n.codes init       # Interactive setup wizard (provider + model)
npx n.codes dev        # Incremental updates using cached file index
npx n.codes sync       # Full re-introspection of the codebase
npx n.codes validate   # Validate capability map structure
```

## File Outputs

- `n.codes.config.json` — CLI configuration (provider, model, map path)
- `n.codes.capabilities.yaml` — capability map (JSON content, valid YAML 1.2)
- `.n.codes.cache.json` — file index cache for incremental updates

## How It Works

1. **Init**
   - Prompts for provider (OpenAI, Claude, Grok, Gemini)
   - Captures a default model and optional project name
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

The capability map is JSON serialized to `n.codes.capabilities.yaml` for simple parsing. JSON is valid YAML 1.2, so this stays interoperable while avoiding a YAML parser dependency in the prototype.

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

- Swap JSON-in-YAML for a real YAML parser when needed
- Add API spec readers (OpenAPI/GraphQL) to enrich `actions` + `queries`
- Add file watchers for a true streaming `dev` mode
- Pluggable inference rules to map company-specific conventions to capabilities
