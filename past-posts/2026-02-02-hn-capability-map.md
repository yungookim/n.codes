Title: Show HN: n.codes Capability Map — guardrails for LLMs in production
Tags: show-hn, llm, developer-tools, guardrails, agents, product-update

Just released Capability Map, the guardrails layer for n.codes.

It auto-maps what your app can do (APIs, schemas, components) and tells the LLM exactly what is allowed to generate in production. The map merges APIs, schemas, UI components, constraints, and RBAC into a single "allowed actions" set, so agents can safely generate new features within your app's boundaries from your user's prompt.

We call out four capability types: Entities, Actions, Queries, and Components.

How it differs from MCP or API docs:
- MCP is a protocol to access tools/resources, not app-specific boundaries or UI affordances.
- API docs describe endpoints for humans; they don't capture permissions, product constraints, or frontend components.

Changelog: https://n.codes/changelog.html

Would love your feedback
