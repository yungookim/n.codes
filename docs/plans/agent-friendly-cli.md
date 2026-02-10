# Agent-Friendly ncodes CLI

**Created:** 2026-02-08
**Status:** Implemented (branch: `feat/widget-sdk`)

## Overview

LLM coding agents (Claude Code, Codex, Cursor) cannot use the n.codes CLI because `init` is fully interactive (readline prompts), there is no `bin` field for `npx` resolution, and there is no post-installation verification command. This design adds non-interactive init, a `verify` command, and agent-copy-paste instructions in the README.

## Problem

| Issue | Impact |
|-------|--------|
| `init` requires readline prompts | Agents can't navigate interactive menus |
| No `bin` field in `package.json` | `npx ncodes` doesn't resolve |
| No verification command | Agents can't confirm installation succeeded |
| README has no agent instructions | No copy-paste prompt for agent-driven setup |

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Provider detection | Auto-detect from env vars | Agents already have `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` set |
| Non-interactive error handling | Throw immediately (no prompt) | Agents can't type into readline |
| Verify output format | `[PASS]`/`[FAIL]` per check | Machine-readable, agents can parse and act on failures |
| README agent prompt | Tells agent to read `.n.codes/INSTALL.md` | Keeps prompt short and framework-agnostic |
| Model defaults | First model in `PROVIDER_MODELS` list | Sensible default without requiring model knowledge |

## Approach

### 1. Non-interactive init (`--provider`, `--model`, `--auto`)

Three new flags on the `init` command:

- `--provider <openai|claude>` — Explicit provider selection
- `--model <name>` — Explicit model selection (defaults to first available)
- `--auto` — Auto-detect provider from environment variables (`OPENAI_API_KEY` -> openai, `ANTHROPIC_API_KEY` -> claude)

When any of these flags are present, `runInitNonInteractive()` is called instead of the interactive `runInit()`. It skips all readline prompts and errors immediately if a required value (provider, API key) can't be resolved.

**Detection priority:** explicit `--provider` flag > `--auto` env detection > error.

### 2. Verify command (`npx ncodes verify`)

Runs 7 sequential checks that reuse existing modules:

| # | Check | Reuses | Pass condition |
|---|-------|--------|----------------|
| 1 | Config exists | `loadConfig()` | `n.codes.config.json` found |
| 2 | Capability map exists | `resolveCapabilityMapPath()` | YAML file exists |
| 3 | Capability map valid | `parseCapabilityMapYaml()` + `validateCapabilityMap()` | Passes structural validation |
| 4 | JSON capability map exists | `resolveCapabilityMapPath()` | `.json` sibling exists |
| 5 | Widget package installed | — | `node_modules/@ncodes/widget` exists |
| 6 | INSTALL.md exists | — | `.n.codes/INSTALL.md` exists |
| 7 | Widget integration code | `detectFramework()` | Layout files contain `NCodes.init(` or `@ncodes/widget` |

Each check outputs `[PASS]` or `[FAIL]` with a remediation command. Returns exit code 0 if all pass, 1 otherwise.

### 3. `npx ncodes` resolution

Added `"bin": { "ncodes": "cli/bin.js" }` to `package.json`. The `private: true` flag stays for now (removed when publishing to npm).

### 4. Agent-friendly README

The README "Getting Started" section has two subsections:

- **For Humans** — Standard 5-step guide with interactive init
- **For AI Coding Agents** — A fenced copy-paste prompt block with 3 phases (CLI setup, widget install, verify)

The agent prompt tells agents to read `.n.codes/INSTALL.md` rather than inlining framework-specific steps. This keeps the prompt under 10 lines and works for any framework.

## Agent workflow

```
npx ncodes init --auto          # Phase 1: auto-detect provider, create config
npx ncodes sync                 # Phase 1: generate capability map
npx ncodes install              # Phase 2: generate INSTALL.md
# Agent reads and follows .n.codes/INSTALL.md
npx ncodes verify               # Phase 3: confirm all 7 checks pass
npx ncodes dev                  # Ongoing: watch mode
```

## Files changed

| File | Action |
|------|--------|
| `cli/lib/args.js` | Added `verify` command + 3 flags |
| `cli/lib/init.js` | Added `detectProviderFromEnv`, `resolveDefaultModel`, `runInitNonInteractive` |
| `cli/lib/verify.js` | **New** — 7 checks + `runVerify` |
| `cli/bin.js` | Wired non-interactive init + verify handler |
| `cli/lib/usage.js` | Updated help text with new flags + agent examples |
| `package.json` | Added `bin` field |
| `README.md` | Replaced WIP section with human + agent instructions |

## Test coverage

- 186 tests, all passing
- New test files: `verify.test.js` (19 tests)
- Appended tests: `args.test.js` (+6), `init.test.js` (+8), `bin.test.js` (+3)
- Coverage: Statements 87%, Branches 80%, Functions 96%, Lines 87%
