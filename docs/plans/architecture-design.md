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
    endpoint: POST /api/orders/{id}/ship
    params: [tracking_number]
    requires: ["orders:write"]

queries:
  listOrders:
    endpoint: GET /api/orders
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

## CLI Prototype for Capability Map Creation

The CLI prototype is designed to generate, update, and validate the capability map locally. It is intentionally minimal so teams can experiment with workflows before wiring up production introspection.

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

**Prototype note:** The CLI writes JSON content to `n.codes.capabilities.yaml` (JSON is valid YAML 1.2), keeping parsing simple in this prototype.

## DSL Format

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
