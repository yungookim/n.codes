# Testing the n.codes Installation System & Widget SDK

## Automated Tests

### CLI unit tests + coverage

```bash
npm run coverage
```

Runs 150 tests across all CLI modules (capability map, sync, install, detect-framework, etc.). Coverage must stay at or above 80% for lines, functions, branches, and statements.

### Widget unit tests

```bash
cd widget && npm test
```

Runs 28 tests covering config validation, simulation template matching, and status messages.

### Integration tests

```bash
node scripts/test-installation-flow.js
```

Runs `n.codes install` on all 5 test projects and validates:
- Framework auto-detection is correct
- `INSTALL.md` is generated with no unreplaced template variables
- Generated instructions reference `@ncodes/widget` and include verification steps

Expected: 45/45 passing.

---

## Manual End-to-End Test

Pick a test project and run the full flow. `express-tasks` is the simplest (no build step).

### 1. Install dependencies and generate artifacts

```bash
cd test-projects/express-tasks
npm install
node ../../cli/bin.js sync
node ../../cli/bin.js install
```

After this you should have:
- `n.codes.capabilities.yaml` — human-readable capability map
- `n.codes.capabilities.json` — machine-consumable capability map
- `.n.codes/INSTALL.md` — LLM-friendly installation instructions

### 2. Follow the installation instructions

The intended workflow is to give `INSTALL.md` to an AI coding assistant:

> "Follow the instructions in `.n.codes/INSTALL.md` to install n.codes"

To test manually instead, follow the steps in `INSTALL.md` yourself:

```bash
npm install ../../widget
cp n.codes.capabilities.json public/n.codes.capabilities.json
```

Then edit `views/layout.ejs` to add the widget script before `</body>`:

```html
<script src="/node_modules/@ncodes/widget/dist/ncodes-widget.js"></script>
<script>
  NCodes.init({
    user: { id: 'demo', name: 'Demo User' },
    capabilityMapUrl: '/n.codes.capabilities.json',
    mode: 'simulation',
    theme: 'auto',
  });
</script>
```

### 3. Verify in browser

```bash
npm run dev
```

Open `http://localhost:3000` and confirm:
- [ ] "Build with AI" floating button appears at bottom center
- [ ] Clicking it opens the prompt panel
- [ ] Typing "Show overdue invoices" and clicking Generate triggers the simulation
- [ ] Status messages animate through (Analyzing... → Done!)
- [ ] Generated UI appears in the panel

---

## Framework Detection

Verify each test project detects the correct framework:

| Project | Expected Framework |
|---|---|
| `next-app-crm` | `next-app-router` |
| `next-pages-invoices` | `next-pages-router` |
| `express-tasks` | `express` |
| `vue-dashboard` | `vue-vite` |
| `sveltekit-tickets` | `sveltekit` |

Quick check:

```bash
for dir in test-projects/*/; do
  echo "--- $(basename $dir) ---"
  node cli/bin.js install 2>&1 | head -1
done
```

---

## Widget Build

```bash
cd widget
npm run build
ls -lh dist/
```

Produces:
- `ncodes-widget.js` — UMD bundle (for `<script>` tags)
- `ncodes-widget.esm.js` — ESM bundle (for `import`)

---

## Test Project Overview

Each project is a minimal but real-looking SaaS app with routes, UI pages, mock API, and simulated auth.

| Project | Framework | App Type | Entities |
|---|---|---|---|
| `next-app-crm` | Next.js 14 App Router | Mini CRM | Contact, Deal |
| `next-pages-invoices` | Next.js Pages Router | Invoice tracker | Invoice, Customer |
| `express-tasks` | Express + EJS | Task manager | Task, User |
| `vue-dashboard` | Vue 3 + Vite | Project dashboard | Project, Task, Member |
| `sveltekit-tickets` | SvelteKit | Support tickets | Ticket, Comment |
