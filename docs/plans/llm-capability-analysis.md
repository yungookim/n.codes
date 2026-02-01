# LLM-Enhanced Capability Map Analysis

**Created:** 2026-02-01
**Status:** Approved

## Overview

This design adds LLM-based semantic analysis to capability map generation. The current system uses heuristics (file paths, regex patterns) to detect routes and generate template-based descriptions. This enhancement uses LLMs to:

1. **Generate meaningful descriptions** — Understand what each API endpoint actually does
2. **Detect entities** — Identify data models/entities referenced by each route

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Code depth | Route + immediate imports | Good context without exponential cost |
| Entity detection | Hybrid (ORM + Types + Inference) | Handles diverse codebases |
| LLM provider | Vercel AI SDK | Provider abstraction, well-maintained |
| Parallelism | Concurrent with limit (default: 5) | Balances speed vs. rate limits |
| Caching | Capability-level, content-hashed | Integrates with existing cache, incremental updates |
| Error handling | Retry with backoff, then heuristic fallback | Robust, never loses progress |

## Architecture

```
collectFiles()
  → buildFileIndex()
  → inferCapabilitiesFromFiles()      # Static analysis (existing)
      ├─ detectRoutes()               # Identify route files
      ├─ resolveImports()             # Follow immediate imports (NEW)
      └─ for each route:
           ├─ buildRouteContext()     # Combine route + imports (NEW)
           ├─ analyzeWithLLM()        # Semantic analysis (NEW)
           │    ├─ generateDescription()
           │    └─ detectEntities()
           └─ cacheResult()           # Store in capability cache (NEW)
  → mergeEntities()                   # Deduplicate detected entities (NEW)
  → renderCapabilityMapYaml()
```

## New Modules

### `cli/lib/llm.js`

Wraps Vercel AI SDK for provider-agnostic LLM calls.

**Responsibilities:**
- Provider configuration (OpenAI, Claude)
- Model selection
- Retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
- Concurrency control (semaphore pattern)

**Supported models:**

| Provider | Models |
|----------|--------|
| OpenAI | `gpt-5-mini`, `gpt-5.2` |
| Claude | `claude-sonnet-4-5`, `claude-opus-4-5`, `claude-haiku-4-5` |

**Core interface:**

```javascript
async function analyzeRoute({ routeContext, config })
async function analyzeRoutes(routes, { config, concurrency = 5 })
function getModel(config)  // Returns Vercel AI SDK model instance
```

### `cli/lib/imports.js`

Parses and resolves immediate imports from route files.

**Responsibilities:**
- Parse import statements (regex-based, no AST dependency)
- Resolve path aliases (`@/`, `~/`, `@app/`) via `tsconfig.json`
- Follow relative paths to actual files
- Stop at `node_modules` boundary
- Distinguish type-only imports for entity hints

**Output structure:**

```javascript
{
  routeFile: 'pages/api/bookings/[id].ts',
  routeContent: '...actual code...',
  imports: [
    { path: 'lib/prisma.ts', content: '...', isTypeOnly: false },
    { path: 'services/booking.ts', content: '...', isTypeOnly: false },
  ],
  typeImports: ['Booking', 'User']  // Entity hints
}
```

**Token budget:** Combined content truncated to ~8K tokens.

### `cli/lib/analyzer.js`

Builds prompts and parses LLM responses.

**Responsibilities:**
- Build analysis prompts with route context
- Parse JSON responses (handle markdown code blocks)
- Validate and normalize entity data
- Merge entities across routes

**Prompt template:**

```
You are analyzing an API route to document its capabilities.

## Route Information
- Method: {method}
- Path: {path}
- File: {filePath}

## Route Code
```{language}
{routeContent}
```

## Imported Dependencies
{for each import}
### {importPath}
```{language}
{importContent}
```
{end for}

## Task
Analyze this route and respond in JSON:

{
  "description": "A 2-3 sentence description of what this endpoint does, its purpose, and key behavior",
  "entities": [
    {
      "name": "EntityName",
      "fields": ["field1", "field2"],
      "source": "prisma" | "typescript" | "inferred"
    }
  ]
}
```

## Extended Cache Structure

Located in `.n.codes.cache.json`:

```javascript
{
  fileIndex: { /* existing file metadata */ },

  analysis: {
    "pages/api/v1/bookings/index.ts": {
      contentHash: "sha256:abc123...",
      analyzedAt: "2026-02-01T12:00:00Z",
      result: {
        description: "Creates a new booking...",
        entities: [{ name: "Booking", fields: [...], source: "prisma" }]
      }
    }
  },

  entities: {
    "Booking": {
      fields: ["id", "userId", "startTime", "endTime", "status"],
      sources: ["prisma", "typescript"],
      referencedBy: ["pages/api/v1/bookings/index.ts"]
    }
  }
}
```

**Cache invalidation:**

| Scenario | Action |
|----------|--------|
| Route file changed | Re-analyze that route |
| Import file changed | Re-analyze all routes that import it |
| Route deleted | Remove from cache, update entity references |
| `--force` flag | Re-analyze all routes |

## Output Format

Updated `n.codes.capabilities.yaml`:

```yaml
version: 1
generatedAt: "2026-02-01T12:00:00Z"
projectName: "cal.com"

entities:
  Booking:
    fields:
      - id
      - userId
      - eventTypeId
      - startTime
      - endTime
      - status
    sources:
      - prisma
    referencedBy:
      - postBookings
      - getBooking
      - patchBooking

actions:
  postBookings:
    endpoint:
      method: "POST"
      path: "/api/v1/bookings"
    description: "Creates a new booking for a calendar event. Validates availability, checks for conflicts, sends confirmation emails, and triggers webhooks."
    entities:
      - Booking
      - User
    analysisSource: "llm"

queries:
  getBooking:
    endpoint:
      method: "GET"
      path: "/api/v1/bookings/:id"
    description: "Retrieves a booking by ID including attendee details and event configuration."
    entities:
      - Booking
    analysisSource: "llm"
```

**Key additions:**
- `entities` section with fields, sources, and references
- `entities` array on each action/query
- `analysisSource` field (`llm` or `heuristic`)

## Dependencies

```json
{
  "dependencies": {
    "ai": "^3.0.0",
    "@ai-sdk/openai": "^0.0.40",
    "@ai-sdk/anthropic": "^0.0.30"
  }
}
```

## Error Handling

1. **Retry:** 3 attempts with exponential backoff (1s, 2s, 4s)
2. **Fallback:** On final failure, use heuristic description, mark `analysisSource: "heuristic"`
3. **Reporting:** Log failed routes at end of sync, suggest `--force` to retry

## CLI Changes

### `n.codes sync`

- Requires valid API key in `.env.local`
- Shows progress: `Analyzing routes... [15/47]`
- Reports: `47 routes analyzed (45 LLM, 2 heuristic fallback)`
- New flag: `--force` to re-analyze all routes (ignore cache)

### `n.codes dev`

- Incremental analysis on file change
- Only re-analyzes changed routes and routes importing changed files

### `n.codes init`

- Prompts for provider and model selection
- Validates API key before saving config

## Implementation Order

1. Add dependencies (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
2. Implement `cli/lib/imports.js` (import resolution)
3. Implement `cli/lib/llm.js` (LLM wrapper)
4. Implement `cli/lib/analyzer.js` (prompts, parsing)
5. Extend `cli/lib/cache.js` (analysis caching)
6. Update `cli/lib/capability-map.js` (entity merging, new output format)
7. Update `cli/lib/sync.js` (integrate LLM analysis)
8. Update `cli/lib/dev.js` (incremental LLM analysis)
9. Add tests for each new module
10. Update sample outputs
