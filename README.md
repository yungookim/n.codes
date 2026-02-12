![CLI Tests](https://github.com/yungookim/n.codes/actions/workflows/coverage.yml/badge.svg)
[![Coverage](https://codecov.io/gh/yungookim/n.codes/branch/main/graph/badge.svg)](https://codecov.io/gh/yungookim/n.codes)
![License](https://img.shields.io/github/license/yungookim/n.codes)
![Stars](https://img.shields.io/github/stars/yungookim/n.codes)
![Issues](https://img.shields.io/github/issues/yungookim/n.codes)
![Last Commit](https://img.shields.io/github/last-commit/yungookim/n.codes)
![Top Language](https://img.shields.io/github/languages/top/yungookim/n.codes)

> ⚠️ **Early Access**: n.codes is in active development. Star ⭐️ to follow along!

If you like n.codes, please star the repo.

https://github.com/user-attachments/assets/783ca48a-e08d-4e39-88a9-1b60a1092a8e


## Demo

Let users generate their own solutions within your app without waiting for your backlog to clear. It's like having a forward-deployed engineer for every user. Users ask for what they need, agents build it instantly.

[Try the interactive demo](https://n.codes/demo/)

## The Problem

Every SaaS company has the same bottleneck: feature requests. Customers want more all the time. They provide great feedback and ideas, but it's hard to keep up fast enough. Sometimes, they'd ask for something that'd solve their problem, but it's not a priority for the company. This leads to frustration and dissatisfaction.

When I started my last company, the only thing I wanted was to hit Product-Market-Fit. Once we hit product-market fit, we were overwhelmed by feature requests. It was the most intense 2 years of my life, and still is.  

Users never run out of problems they want to solve with our product. We just could not hire fast enough to build. Even after we 10x'ed our development throughput with AI development tools and doubled our engineering bandwidth, users just kept wanting more.

These were Fortune 500 company customers paying serious money to solve multi-hundred-million-dollar problems, and we just did not have the bandwidth to build. Interestingly, many of the requests were not that complicated.

_Examples:_

- Need a custom dashboard, but you can use the same charts you already have. We just want to organize them in a specific way for our executives.
- We need data export formatted in a specific way for our accounting team.
- We need a bulk action to archive 1000s of records at once.

Many of these requests were not that complicated. They were just different arrangements of the same building blocks.

We were so severely bottlenecked that even simple requests like the above had to be backlogged for months or risk building a Frankenstein monster of a feature that would be difficult to maintain and scale.

Meanwhile, the backend API can already do most of what they're asking for. The bottleneck isn't capability—it's UI.

## Solution

I'm creating n.codes. It's an open-source project that lets users build the feature they need with just a prompt in your app. It's agentic UI. Like Lovable, Replit, etc, but tightly integrated into your app, with access to the app's APIs/docs/whatever, and keeps a consistent style.

## How It Works

The LLM doesn't write arbitrary code.

### Local configuration

- Store local API keys in `.env.local` (not `.env`) so they stay out of version control.
- Capability map generation is LLM-based and requires a configured provider/model plus a valid API key.

### Capability map example

When you add or change a route, `n.codes sync` turns it into structured capabilities.

Input route:

```ts
// pages/api/bookings/[id].ts
export async function GET(req) {
  // fetch booking by id
}
```

Output capability map snippet:

```yaml
queries:
  getBooking:
    endpoint:
      method: "GET"
      path: "/api/bookings/:id"
    description: "Retrieves a booking by ID with its related details."
    entities:
      - "Booking"
    analysisSource: "llm"

entities:
  Booking:
    fields:
      - id
      - status
    sources:
      - "prisma"
    referencedBy:
      - getBooking
```

1. It reads through your frontend components to understand the capabilities of your app and styles. It then uses that knowledge to build the UI that the user asks for. It keeps a consistent style.

2. It reads through your backend APIs, docs, and schemas to create a _"capability map"_ of your app. This includes entities, actions, queries, and constraints.

3. Given the user's prompt, it uses the capability map to build the UI that the user asks for, and creates a private component for that user in a sandboxed runtime.

n.codes is like a forward-deployed engineer for the user. It's Cloud Code that lives in your app for the user.

## Getting Started

### For Humans

```bash
# 1. Initialize — picks your LLM provider and model
npx ncodes init

# 2. Generate capability map from your codebase
npx ncodes sync

# 3. Generate framework-specific widget installation instructions
npx ncodes install

# 4. Follow the generated instructions
cat .n.codes/INSTALL.md

# 5. Verify everything is wired up
npx ncodes verify
```

### For AI Coding Agents

Copy-paste this prompt to any LLM coding agent (Claude Code, Codex, Cursor, etc.):

~~~
Install n.codes in this project (widget + backend).

Step 1: Generate capability map
  npx ncodes init --auto
  npx ncodes sync

Step 2: Set up the backend (standalone service)
The server/ directory contains API handlers and LLM integration. Set it up as a runnable service:
  cd server
  npm install
  cp .env.example .env

server/index.js is a minimal Express server that:
- Mounts handleGenerate at POST /api/generate
- Mounts handleStreamGenerate at POST /api/generate/stream
- Uses express.json() middleware
- Enables CORS for the main app's origin (set APP_ORIGIN or MAIN_APP_ORIGIN if needed)
- Listens on port 3001 (or PORT env var)
- Imports handlers from ./api/generate.js

Ensure OPENAI_API_KEY or ANTHROPIC_API_KEY is set in server/.env

Step 3: Install and wire up the widget
  cd ..
  npm install @ncodes/widget

Copy n.codes.capabilities.json to the static directory (public/, or static/ for SvelteKit).

Add the widget to the app's root layout using a dynamic import:

  const NCodes = await import('@ncodes/widget');
  NCodes.init({
    user: { id: 'demo', name: 'Demo User' },
    capabilityMapUrl: '/n.codes.capabilities.json',
    apiUrl: 'http://localhost:3001/api/generate',
    mode: 'live',
    theme: 'auto',
  });

  Call NCodes.destroy() on cleanup/unmount.

  Framework hints:
  - Next.js App Router: 'use client' component with useEffect + dynamic import, render in app/layout.tsx
  - Next.js Pages Router: useEffect in pages/_app.tsx
  - SvelteKit: onMount/onDestroy in src/routes/+layout.svelte
  - Vue + Vite: Vue plugin with mixin in mounted/unmounted, register in main.js
  - Express/static: <script src="/ncodes-widget.js"></script> + NCodes.init() — copy dist/ncodes-widget.js to public/ first

Step 4: Verify
  npx ncodes verify — all checks must show [PASS]
  Start the backend: cd server && node index.js
  Open the app, click "Build with AI", enter a prompt, and confirm a generated UI appears.

Notes
- The user object is an auth gate. Pass null to hide the widget. Replace demo user with your auth.
- The server reads OPENAI_API_KEY or ANTHROPIC_API_KEY from environment.
- Ongoing: npx ncodes dev — watches for file changes and keeps the capability map up to date.
~~~

## Project Links

**GitHub:** https://github.com/yungookim/n.codes
**website** https://n.codes

## Rules

### Safety/control

- No arbitrary code execution
- Permission-aware (RBAC scoped)
- Audit trail of generated UIs + actions taken

### Product boundaries

- It’s for the 90%: CRUD + analytics + workflows
- Not for pixel-perfect marketing pages
- Not for bypassing business logic

### Ownership

Generated UIs can be:

- Private per user
- Shared with a team
- Promoted to “official” UI by admins
