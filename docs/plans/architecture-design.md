# n.codes Technical Architecture Design

*January 19, 2026*

## Overview

n.codes lets users generate their own UI within a host app using natural language prompts. It's agentic UI - like having a forward-deployed engineer for every user.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Integration model | JS SDK + sandboxed iframe |
| Backend deployment | Same codebase, hosted or self-hosted |
| Capability map | Hybrid (auto-introspect + developer curation) |
| Generation output | Hybrid DSL (JSON layout + JS scripts) |
| Sandboxing | Web Worker + proxy for API calls |
| Auth/RBAC | Capability-based |
| Storage | Cloud for hosted, customer DB for self-hosted |
| Component learning | LLM reads host's component source code |
| LLM | Default hosted model, BYOM for self-hosted |
| Promotion model | Config promotion (DSL becomes blessed config) |
| Onboarding | CLI wizard (`npx n.codes init`) |

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                           Host App                                 │
│  ┌─────────────┐     ┌─────────────────────────────────────────┐   │
│  │  n.codes    │     │         Sandboxed Iframe                │   │
│  │    SDK      │◄───►│  ┌─────────────┐    ┌────────────────┐  │   │
│  │             │     │  │ Web Worker  │    │  Rendered UI   │  │   │
│  │ - trigger   │     │  │ (DSL exec)  │───►│ (host styles)  │  │   │
│  │ - auth      │     │  └─────────────┘    └────────────────┘  │   │
│  │ - bridge    │     │         │                               │   │
│  └─────────────┘     └─────────│───────────────────────────────┘   │
│         │                      │ (proxied API calls)               │
└─────────│──────────────────────│───────────────────────────────────┘
          │                      │
          ▼                      ▼
┌────────────────────────────────────────────────────────────────────┐
│                    n.codes Backend Service                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Capability   │  │     LLM      │  │      App Storage         │  │
│  │    Map       │  │ Orchestrator │  │  (generated DSL + state) │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                    │
│              [ Hosted by n.codes  OR  Self-hosted ]                │
└────────────────────────────────────────────────────────────────────┘
```

## Capability Map

The capability map defines what the LLM can use and what the runtime will allow.

**Backend capabilities:**
```yaml
entities:
  Order:
    fields: [id, customer_id, status, total, created_at]
    source: "inferred from GET /api/orders response"

actions:
  markShipped:
    endpoint:
      method: POST
      path: /api/orders/{id}/ship
    description: "Marks an order as shipped by ID and returns the updated order. Use this endpoint after confirming fulfillment details."
    params: [tracking_number]
    requires: ["orders:write"]

queries:
  listOrders:
    endpoint:
      method: GET
      path: /api/orders
    description: "Lists orders for display and reporting. Supports filters such as status or date range."
    filters: [status, customer_id, date_range]
    requires: ["orders:read"]
```

**Frontend capabilities:**
```yaml
components:
  DataTable:
    path: src/components/DataTable.tsx
    props: [columns, data, onRowClick, sortable]
    usage: "Used for listing entities with pagination"

  StatusBadge:
    path: src/components/StatusBadge.tsx
    props: [status, variant]
    usage: "Shows order/ticket status with color coding"
```

**How it's built:**
1. `npx n.codes init` runs introspection
2. LLM reads API specs and component files
3. Outputs draft capability map
4. Developer curates (hide internal APIs, add permissions)
5. Committed as `n.codes.capabilities.yaml`

### Why Capability Map Instead of MCP Server

We considered generating an MCP (Model Context Protocol) server instead of a static capability map. MCP is a standardized protocol that lets LLMs invoke external tools at runtime. Here's why we chose the capability map approach:

**Different mental models:**

| Capability Map | MCP Server |
|----------------|------------|
| Static schema — "here's what exists" | Runtime tools — "call this to do X" |
| LLM reads it as context for generation | LLM invokes tools directly |
| Sandbox executes the generated DSL | LLM executes actions immediately |

**The core distinction:** Our LLM doesn't need to *call* anything — it needs to *know* what exists so it can generate valid DSL. The sandbox executes the DSL later. MCP's mental model is "give the LLM hands to do things." Our mental model is "give the LLM knowledge to write a recipe that the sandbox will cook."

```
n.codes flow:
User prompt → LLM reads capability map → generates DSL → sandbox validates & executes

MCP flow:
User prompt → LLM calls MCP tools → actions happen immediately
```

**Why this matters for security:** MCP would bypass our sandboxed runtime, defeating the security/control model. With the capability map approach:
1. LLM only has read access to a schema (no execution capability)
2. Generated DSL declares its bindings explicitly
3. Sandbox validates bindings against user's RBAC permissions
4. SDK bridge proxies actual API calls with auth + audit logging

**When MCP might make sense:** If we wanted dynamic capability discovery (e.g., query live API specs at generation time), MCP could expose read-only tools like `listAvailableActions()`. But that's essentially the capability map with extra infrastructure overhead. We may revisit this if dynamic introspection becomes a requirement.

## CLI Prototype for Capability Map Creation

The CLI prototype is designed to generate, update, and validate the capability map locally. It is intentionally minimal so teams can experiment with workflows before wiring up production introspection.

**LLM requirement:** Capability map generation is an LLM-based feature. Production tooling must enforce provider/model configuration and a valid API key before generating or updating the map. Any heuristic-only pass must be labeled as a prototype fallback.

**Commands:**
```bash
npx n.codes init       # Interactive setup wizard (select provider + model)
npx n.codes dev        # Incremental map updates based on file changes
npx n.codes sync       # Full re-introspect of the codebase
npx n.codes validate   # Validate capability map structure
```

**Initialization flow (`init`):**
- Prompts for provider (OpenAI, Claude, Grok, Gemini)
- Captures a default model name
- Writes `n.codes.config.json` to the project root

**Incremental updates (`dev`):**
- Scans source files and builds a file index
- Compares against `.n.codes.cache.json`
- Updates the capability map with only changed files

**Full sync (`sync`):**
- Rebuilds the entire capability map from scratch
- Overwrites `n.codes.capabilities.yaml`

**Validation (`validate`):**
- Reads `n.codes.capabilities.yaml`
- Ensures required sections exist (`entities`, `actions`, `queries`, `components`)

**Prototype note:** The CLI writes YAML content to `n.codes.capabilities.yaml` using a small, deterministic serializer.

## DSL Format

### What is a DSL?

DSL stands for **Domain-Specific Language** — a specialized language designed for a specific problem domain rather than general-purpose programming. Unlike general languages (JavaScript, Python), a DSL is constrained to express only what's needed for its domain.

**Why use a DSL for n.codes:**
- **Constrained expressiveness** — The LLM can only generate UI structures and approved API calls, not arbitrary code
- **Validation** — We can statically analyze and validate DSL before execution
- **Security** — The sandbox interprets DSL; it doesn't eval arbitrary JavaScript
- **Portability** — DSL can be rendered by different runtimes (React, Vue, native)

**Our DSL is "hybrid"** because it combines:
- **JSON structure** — Declarative layout tree (safe, easy to validate)
- **JS expressions** — Logic for computed values and handlers (sandboxed execution)

This gives us the safety of declarative JSON with the flexibility of JavaScript where needed, while keeping all execution inside the sandbox.

### DSL Structure

Generated apps are expressed as a Hybrid DSL - JSON for structure, JS for logic:

```json
{
  "id": "overdue-invoices-view",
  "layout": {
    "type": "Stack",
    "direction": "vertical",
    "children": [
      {
        "type": "DataTable",
        "props": {
          "columns": "{{ computed.tableColumns }}",
          "data": "{{ computed.filteredInvoices }}",
          "rowActions": [
            {
              "label": "Send Reminder",
              "onClick": "{{ actions.sendReminder({ invoiceId: row.id }) }}"
            }
          ]
        }
      }
    ]
  },
  "scripts": {
    "computed": {
      "filteredInvoices": "(ctx) => { return ctx.queries.listInvoices({ status: 'overdue' }).filter(inv => inv.amount > 500); }"
    },
    "handlers": {
      "onBulkRemind": "async (ctx, selectedRows) => { for (const row of selectedRows) { await ctx.actions.sendReminder({ invoiceId: row.id }); } }"
    }
  },
  "bindings": {
    "queries": ["listInvoices"],
    "actions": ["sendReminder"]
  }
}
```

- `layout` - Declarative component tree
- `scripts.computed` - Derived values with full JS
- `scripts.handlers` - Event handlers with full JS
- `bindings` - Explicit capability requirements (enforced at runtime)

## Sandboxed Runtime

```
┌────────────────────────────────────────────────────────────────┐
│                    Sandboxed Iframe                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                     Web Worker                            │ │
│  │  - Parses DSL                                             │ │
│  │  - Executes scripts (only has access to ctx object)       │ │
│  │  - Outputs virtual DOM diffs                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                 │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                    Render Thread                          │ │
│  │  - Maps VDOM to host's actual components                  │ │
│  │  - Applies host's CSS/theme                               │ │
│  └───────────────────────────────────────────────────────────┘ │
└──────────────────────────────│─────────────────────────────────┘
                               │ postMessage
┌──────────────────────────────▼──────────────────────────────────┐
│                         SDK Bridge                              │
│  - Validates calls against capability bindings                  │
│  - Attaches user's auth token                                   │
│  - Audit logs                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Security layers:**
1. Web Worker - No DOM, no cookies, no localStorage
2. ctx object only - Scripts can't access anything else
3. Capability binding enforcement - Bridge rejects unauthorized calls
4. Auth attachment - Token added by bridge, invisible to scripts

## SDK (Framework-Agnostic)

**Core package:**
```ts
import { NCodes } from '@n.codes/core';

const ncodes = new NCodes({
  config: '/n.codes.capabilities.yaml',
  apiBase: 'https://api.n.codes',
  auth: () => getAuthToken(),
  user: { id: 'user_123', role: 'manager' },
  components: componentRegistry,
  renderTarget: document.getElementById('ncodes-container'),
});

ncodes.open();
ncodes.render('app_abc123');
```

**Framework adapters:**
```bash
npm install @n.codes/core    # Core JS/TS
npm install @n.codes/react   # React adapter
npm install @n.codes/vue     # Vue adapter
```

**Component registry:**
```ts
const componentRegistry = {
  DataTable: {
    component: MyDataTable,
    framework: 'react',
  },
  StatusBadge: {
    component: MyStatusBadge,
    framework: 'react',
  }
};
```

## Backend Service

```
┌─────────────────────────────────────────────────────────────────┐
│                    n.codes Backend Service                      │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │   API Gateway   │  │  LLM Orchestrator│  │   App Storage   │ │
│  │ - /generate     │  │ - Prompt builder │  │ - Generated DSL │ │
│  │ - /apps/:id     │  │ - Model router   │  │ - Versions      │ │
│  │ - /capabilities │  │ - BYOM support   │  │ - Ownership     │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘ │
│                               │                                 │
│                     ┌─────────▼─────────┐                       │
│                     │  Storage Adapter  │                       │
│                     │ (Postgres/SQLite) │                       │
│                     └───────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

**Deployment modes:**
- Hosted: n.codes runs it, Postgres, our LLM keys
- Self-hosted: Same Docker image, customer's DB and LLM keys

## CLI / Developer Experience

```bash
npx n.codes init       # Interactive setup wizard
npx n.codes dev        # Local dev server
npx n.codes sync       # Re-introspect codebase
npx n.codes validate   # Check capability map
npx n.codes deploy     # Push to cloud (hosted mode)
```

**Goal:** Working demo in under 5 minutes.

## End-to-End Flow

1. **User prompts** - SDK sends to backend with user context
2. **Backend** - Loads capability map, filters by RBAC, builds LLM prompt
3. **LLM generates** - Streams DSL back, saves to storage
4. **SDK receives** - Validates bindings, spins up iframe
5. **Iframe executes** - Worker parses DSL, renders via host components
6. **API calls** - Proxied through SDK Bridge with auth + validation
7. **User interacts** - Actions flow through same secure path

---

*This is a rough architectural sketch, not a detailed spec.*
