// Theme constants for n.codes demo video
export const theme = {
  colors: {
    // Core palette (from landing page)
    background: "#0a0a0a",
    backgroundAlt: "#1a1a1a",
    primary: "#4ade80",
    primaryGlow: "rgba(74, 222, 128, 0.3)",
    primaryDim: "rgba(74, 222, 128, 0.1)",
    text: "#ffffff",
    textSecondary: "#a1a1aa",
    textDim: "#52525b",
    border: "#27272a",
    borderLight: "#1a1a1a",
    // Demo-specific (from public/demo/styles.css)
    appBg: "#050505",
    cardBg: "#0f0f0f",
    sidebarBg: "#0a0a0a",
    panelBg: "#0d0d0d",
    danger: "#f87171",
    dangerDim: "rgba(248, 113, 113, 0.1)",
    warning: "#fbbf24",
    warningDim: "rgba(251, 191, 36, 0.1)",
  },
  fonts: {
    heading: "Inter",
    mono: "JetBrains Mono",
  },
  timing: {
    // Scene durations in frames (at 30fps)
    fps: 30,
    hook: 120,   // 4s
    app: 150,    // 5s
    panel: 300,  // 10s
    result: 180, // 6s
    cta: 150,    // 5s
    total: 900,  // 30s
  },
  dimensions: {
    width: 1080,
    height: 1920,
  },
} as const;

// Scene start frames (cumulative)
export const sceneStarts = {
  hook: 0,
  app: theme.timing.hook,
  panel: theme.timing.hook + theme.timing.app,
  result: theme.timing.hook + theme.timing.app + theme.timing.panel,
  cta: theme.timing.hook + theme.timing.app + theme.timing.panel + theme.timing.result,
} as const;
