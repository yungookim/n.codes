import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: interFamily } = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
});

const { fontFamily: jetbrainsFamily } = loadJetBrains("normal", {
  weights: ["400", "500"],
});

export const theme = {
  colors: {
    background: "#0a0a0a",
    primary: "#4ade80",
    primaryDim: "rgba(74, 222, 128, 0.1)",
    text: "#ffffff",
    textSecondary: "#a1a1aa",
    textDim: "#52525b",
    border: "#27272a",
    borderLight: "#1a1a1a",
    cardBg: "#0f0f0f",
    panelBg: "#0d0d0d",
    blue: "rgba(56, 189, 248, 0.6)",
    purple: "rgba(139, 92, 246, 0.5)",
    danger: "#f87171",
    warning: "#fbbf24",
  },
  fonts: {
    heading: interFamily,
    mono: jetbrainsFamily,
  },
  fps: 30,
  timing: {
    hook: 90,        // 3s - Hook text
    appReveal: 120,  // 4s - CRM app appears
    panelOpen: 120,  // 4s - Panel opens + prompt typed
    generate: 90,    // 3s - Generation animation
    result: 120,     // 4s - Result rendered inline
    glowShow: 60,    // 2s - Highlight the glow border
    cta: 90,         // 3s - CTA screen
    total: 690,      // 23s total
  },
  dimensions: {
    vertical: { width: 1080, height: 1920 },
    horizontal: { width: 1920, height: 1080 },
  },
} as const;

// Pre-computed scene start frames
export const sceneStarts = {
  hook: 0,
  appReveal: theme.timing.hook,
  panelOpen: theme.timing.hook + theme.timing.appReveal,
  generate: theme.timing.hook + theme.timing.appReveal + theme.timing.panelOpen,
  result: theme.timing.hook + theme.timing.appReveal + theme.timing.panelOpen + theme.timing.generate,
  glowShow: theme.timing.hook + theme.timing.appReveal + theme.timing.panelOpen + theme.timing.generate + theme.timing.result,
  cta: theme.timing.hook + theme.timing.appReveal + theme.timing.panelOpen + theme.timing.generate + theme.timing.result + theme.timing.glowShow,
};
