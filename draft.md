# What If Users Could Build Their Own UI In Your App With Just a Prompt?

*January 11, 2026 · 3 min read*
Original post at https://note.lolodex.com/public/11/what-if-users-could

Here's a thought experiment I can't stop thinking about.

## The Problem

Every SaaS company has the same bottleneck: feature requests.

When I started my last company, the only thing I wanted was to hit Product-Market-Fit. Once we hit product-market fit, we were overwhelmed by feature requests. It was the most intense 2 years of my life. Users never seem to run out of problems they want to solve urgently with our product. We just could not hire fast enough to build. Even after we 10x'ed our development throughput with AI development tools and doubled our engineering bandwidth, users just wanted more. Their expectation kept going up.

Sometimes a Fortune 100 customer offers serious money for a feature only 10% of users need.

- Customer wants a custom dashboard? Gets added to the backlog.
- Needs a different view of their data? Wait 6 months.
- Need an urgent data export in a specific way? Have an engineer context-switch for 20 minutes to write a script.
- Wants to combine two features in a new way? "We'll consider it for the roadmap."

Meanwhile, the backend API can already do most of what they're asking for. The bottleneck isn't capability—it's UI.

## The Idea

“Let customers build the UI they need on top of your existing product capabilities, without waiting for your team.”

Users could just describe what they want to LLM. If there are enough APIs to solve the problem, an interface can be created on demand.

> "Show me a table of all orders from last week, with a button to mark each as shipped."

And the system builds it. Right there. Using your existing API. 

It's agentic UI. Like Lovable, Replit, etc, but tightly integrated into the app, with access to the app's backend APIs, and keeps a consistent style.

The world seems to be moving this way already, and there isn't a good framework for it.

## Why This Might Actually Work Now

**Most CRUD UIs are predictable.** 80% of any software is just a combination of tables, forms, filters, buttons, and charts.

**API schemas already describe what's possible.** n.codes can create a 'capability map' from _whatever exists_(docs & code), then let users generate a UI/solution.

**We have sandboxing now.** iframes, WASM, secure runtimes. User-generated UI doesn't have to be a security nightmare.

## The Flow

```
┌─────────────────────────────────────────────────────────┐
│  Simple Flow.                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │ API Schema   │───▶│ LLM + UI Gen │───▶│ Sandboxed │  │
│  │              │    │ (system      │    │ Runtime   │  │
│  │              │    │  prompt +    │    │ (iframe/  │  │
│  │              │    │  user input) │    │  WASM)    │  │
│  └──────────────┘    └──────────────┘    └───────────┘  │
│         │                                      │        │
│         └──────────────────────────────────────┘        │
│                    API calls go here                    │
└─────────────────────────────────────────────────────────┘
```

That's it. The LLM doesn't write arbitrary code. It can assemble pre-built components (tables, forms, charts) and wire them to your API. Or it can create a new UI specifically for the user.

## What This Enables

**For SaaS companies:** Stop building one-off dashboards. Let users self-serve.

**For platform companies:** Let your ecosystem build UIs on your API without hiring frontend devs.

**For internal tools:** Backend teams ship APIs. UI generates itself.

## What I'm Trying to Figure Out

Is this an SDK? A framework? A SaaS product?

Probably all three:

- **SDK** for schema introspection and component rendering
- **Framework** for mapping prompts to UI patterns
- **SaaS** for hosted LLM orchestration and a template library

**What is a capability map?**
An agent can learn about your system and normalize the registry:
- Entities (Order, Customer, Ticket…)
- Actions (markShipped, refund, assignOwner…)
- Queries (listOrders, searchCustomers…)
- Constraints (auth/RBAC, rate limits, validation, side effects)

## Governing Principles

**Safety/control**
- No arbitrary code execution
- Allowlisted components + allowlisted actions
- Permission-aware (RBAC scoped)
- Audit trail of generated UIs + actions taken

**Product boundaries**
- It’s for the 90%: CRUD + analytics + workflows
- Not for pixel-perfect marketing pages
- Not for bypassing business logic

**Ownership**
Generated UIs can be:
- private per user
- shared with a team
- promoted to “official” UI by admins

## The Bigger Picture

App stores work because developers build niche solutions on top of platform APIs. But what if users could skip the "wait for a developer" step entirely?

Not for everything. But for the 80% of UIs that are just different arrangements of the same building blocks? That feels solvable.

---

I'd love feedback:

- Does this resonate with a problem you've experienced?
- What would break this idea?
- Anyone building something similar?
