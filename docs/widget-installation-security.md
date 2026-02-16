# Widget Installation & Security Model

## Overview

The n.codes widget (`@ncodes/widget`) is an embeddable SDK that adds an AI-powered prompt UI to any web application. It runs inside a **Shadow DOM** boundary, providing CSS and DOM isolation from the host application.

## Installation Flow

### Two-Step Integration

**Step 1: Load the bundle**

Add a single `<script>` tag that loads `ncodes-widget.js` (UMD format). This creates a global `NCodes` object on `window`.

```html
<script src="/ncodes-widget.js"></script>
```

**Step 2: Initialize**

Call `NCodes.init()` with your configuration:

```js
NCodes.init({
  user: { id: '1', name: 'Demo User' },
  theme: 'dark',        // 'dark' | 'light' | 'auto'
  position: 'bottom-center',   // 'bottom-center' | 'bottom-right' | 'bottom-left'
});
```

### Framework-Specific Integration

The CLI command `n.codes install` auto-detects the host framework via `detect-framework.js` and generates tailored instructions from templates in `cli/lib/templates/`.

| Framework | Script Loading | Entry Point |
|-----------|---------------|-------------|
| **Next.js (App Router)** | `<Script strategy="beforeInteractive">` | `app/layout.tsx` |
| **Next.js (Pages)** | `<Script strategy="beforeInteractive">` | `pages/_app.tsx` |
| **Express** | `<script>` tag in EJS/Pug layout | Layout template |
| **Vue (Vite)** | Dynamic `<script>` in `onMounted()` | `App.vue` |
| **SvelteKit** | `<svelte:head>` + `onMount()` | `+layout.svelte` |
| **Generic** | `<script>` tag before `</body>` | HTML template |

#### Next.js Example (App Router)

```tsx
// app/layout.tsx
import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="/ncodes-widget.js" strategy="beforeInteractive" />
        <Script id="ncodes-init" strategy="afterInteractive">{`
          NCodes.init({
            user: { id: '1', name: 'Demo User' },
            theme: 'dark',
          });
        `}</Script>
      </body>
    </html>
  );
}
```

> **Important**: The bundle must use `strategy="beforeInteractive"` (loads in `<head>`) while the init script uses `strategy="afterInteractive"`. This ensures `NCodes` is defined before `init()` is called.

#### Express Example

```html
<!-- views/layout.ejs -->
<body>
  <%- body %>
  <script src="/ncodes-widget.js"></script>
  <script>
    NCodes.init({
      user: { id: '<%= user.id %>', name: '<%= user.name %>' },
      theme: 'dark',
    });
  </script>
</body>
```

## Security Model

### Shadow DOM Isolation

When `NCodes.init()` is called, the widget creates its entire UI inside a Shadow DOM:

```
document.body
  └── <div id="ncodes-root">
        └── #shadow-root (open)
              ├── <style>...</style>         ← Encapsulated CSS
              ├── .ncodes-trigger            ← Floating button
              └── .ncodes-panel              ← Panel with prompt/history/results
                   └── (generated UI)        ← Rendered in a sandboxed iframe
```

This provides three layers of isolation:

#### 1. CSS Encapsulation

The host app's CSS cannot leak into the widget, and vice versa. All widget styles are injected into the shadow root's own `<style>` element. This is why the widget looks identical across Express, Next.js, Vue, SvelteKit, etc. — it's immune to the host's stylesheet.

#### 2. DOM Isolation

The host app's `document.querySelector()` cannot accidentally reach into the widget's DOM. The widget's elements are hidden behind `shadowRoot`. Only code that explicitly accesses `host.shadowRoot` can interact with widget internals.

#### 3. Event Containment

Events inside the shadow DOM don't propagate to the host app in ways that expose widget internals. The widget handles its own click, keydown, and escape events internally via `wireEvents()`.

### Trust Boundaries

| Boundary | Protection |
|----------|-----------|
| **Network access is scoped** | Live generation calls the configured API endpoint; the sandboxed iframe can only reach whitelisted endpoints via API bindings. |
| **No host app state access** | The widget only receives what's explicitly passed via `NCodes.init({ user })`. It does not read cookies, session tokens, or the host app's DOM. |
| **Namespaced localStorage** | History is stored under the `ncodes:history` key, avoiding collisions with the host app's storage. |
| **Sandboxed rendering** | Generated UI runs inside an iframe with `sandbox="allow-scripts"`, preventing DOM access to the host app. |

### Auth Gate

If no `user` is provided to `init()`, the widget stays completely hidden — no DOM is mounted:

```js
if (!config.user) {
  _state = { config, mounted: false };
  return; // No DOM mounted, widget invisible
}
```

The host app controls when the widget appears based on its own authentication state.

## Public API

```js
NCodes.init(config)   // Initialize the widget
NCodes.open()         // Programmatically open the panel
NCodes.close()        // Programmatically close the panel
NCodes.destroy()      // Remove the widget entirely and clean up event listeners
```

## Widget Features

### Feature History

Generated features are persisted in `localStorage` under `ncodes:history`. Users can:
- See previously generated features in a "Recent Features" list
- Click a history item to instantly re-render the result (no generation delay)
- Delete individual history items
- History persists across page reloads and sessions

Storage format:
```json
[
  {
    "id": "1707350400000",
    "prompt": "Show overdue invoices over $500",
    "timestamp": 1707350400000,
    "generated": {
      "html": "<div>...</div>",
      "css": ".card { ... }",
      "js": "console.log('loaded')",
      "apiBindings": []
    }
  }
]
```

History is capped at 20 entries (FIFO).

### Inline Result Rendering

Generated UI renders inside an expanded panel (80% viewport, centered dialog) rather than a separate overlay. Users can:
- View results inline within the widget
- Click "Back" to return to the prompt view
- Press Escape to navigate back or close the panel

### Animated Glow Border

The panel features a Siri-inspired animated border effect:
- **Rotating conic-gradient**: Green, blue, and purple gradient that continuously rotates around the panel edge
- **Breathing glow**: Pulsing box-shadow that fades in and out on a 3-second cycle
- Uses `CSS.registerProperty()` for smooth angle interpolation (registered at document level for Shadow DOM compatibility)
