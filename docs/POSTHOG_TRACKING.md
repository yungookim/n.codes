# PostHog Analytics Integration

## Overview

n.codes now includes **optional analytics** via PostHog to help us understand usage patterns and improve the tool.

## What We Track

We track the following events:

- **Command execution** - Which commands users run (`init`, `dev`, `sync`, `validate`, `reset`)
- **Command flags** - Key flags used (e.g., `--force`, `--sample`)
- **Errors** - When commands fail, we track error messages (no stack traces with user data)
- **Environment** - Your Node.js version, OS, and architecture (no personal data)

## What We Don't Track

- Your code or files
- Your API keys
- Your project names or paths
- Any personally identifiable information
- Your command arguments or values

## How It Works

- **Anonymous by default** - We use a machine-specific anonymous ID (stored in `~/.n-codes-id`)
- **Non-blocking** - Analytics collection has a 5-second timeout and never blocks CLI execution
- **Batched** - Events are batched and sent every 30 seconds
- **Offline-safe** - If your network is down, the CLI works normally

## Opting Out

To disable analytics, set the environment variable:

```bash
export N_CODES_DISABLE_ANALYTICS=1
```

Or add it to your shell profile to disable permanently.

## Why This Helps

We use this data to:
- Understand which features are most valuable
- Identify pain points and bugs
- Prioritize development efforts
- Monitor for critical errors

## Questions?

If you have concerns about privacy, please open an issue on GitHub. We take user privacy seriously and are happy to discuss our practices.
