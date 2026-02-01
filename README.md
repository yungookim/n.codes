![CLI Tests](https://github.com/yungookim/n.codes/actions/workflows/coverage.yml/badge.svg)
[![Coverage](https://codecov.io/gh/yungookim/n.codes/branch/main/graph/badge.svg)](https://codecov.io/gh/yungookim/n.codes)
![License](https://img.shields.io/github/license/yungookim/n.codes)
![Stars](https://img.shields.io/github/stars/yungookim/n.codes)
![Issues](https://img.shields.io/github/issues/yungookim/n.codes)
![Last Commit](https://img.shields.io/github/last-commit/yungookim/n.codes)
![Top Language](https://img.shields.io/github/languages/top/yungookim/n.codes)

> ⚠️ **Early Access**: n.codes is in active development. Star ⭐️ to follow along!

If you like n.codes, please star the repo: https://github.com/yungookim/n.codes

## Demo

Let users generate their own solutions within your app without waiting for your backlog to clear. It's like having a forward-deployed engineer for every user. Users ask for what they need, agents build it instantly.

[Try the interactive demo](https://n.codes/demo/)

## The Problem

Every SaaS company has the same bottleneck: feature requests. Customers want more all the time. They provide great feedback and ideas, but it's hard to keep up fast enough. Sometimes, they'd ask for something that'd solve their problem, but it's not a priority for the company. This leads to frustration and dissatisfaction.

When I started my last company, the only thing I wanted was to hit Product-Market-Fit. Once we hit product-market fit, we were overwhelmed by feature requests. It was the most intense 2 years of my life, and still is.  

Users never run out of problems they want to solve with our product. We just could not hire fast enough to build. Even after we 10x'ed our development throughput with AI development tools and doubled our engineering bandwidth, users just kept wanting more. 

These were Fortune 500 company customers paying serious money to solve multi-hundred-million-dollar problems, and we just did not have the bandwidth to build. Interestingly, many of the requests were not that complicated.

*Examples:*
* Need a custom dashboard, but you can use the same charts you already have. We just want to organize them in a specific way for our executives.
* We need data export formatted in a specific way for our accounting team.
* We need a bulk action to archive 1000s of records at once.

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

1. It reads through your frontend components to understand the capabilities of your app and styles. It then uses that knowledge to build the UI that the user asks for. It keeps a consistent style.

2. It reads through your backend APIs, docs, and schemas to create a *"capability map"* of your app. This includes entities, actions, queries, and constraints.

3. Given the user's prompt, it uses the capability map to build the UI that the user asks for, and creates a private component for that user in a sandboxed runtime.

n.codes is like a forward-deployed engineer for the user. It's Cloud Code that lives in your app for the user.


## Rules
### Safety/control
* No arbitrary code execution
* Permission-aware (RBAC scoped)
* Audit trail of generated UIs + actions taken

### Product boundaries
* It’s for the 90%: CRUD + analytics + workflows
* Not for pixel-perfect marketing pages
* Not for bypassing business logic

### Ownership
Generated UIs can be:
* Private per user
* Shared with a team
* Promoted to “official” UI by admins
