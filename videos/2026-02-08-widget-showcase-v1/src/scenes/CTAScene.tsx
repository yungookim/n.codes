import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { theme } from "../styles/theme";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo spring
  const logoSpring = spring({ frame, fps, config: { damping: 200 } });

  // Tagline fade
  const taglineOpacity = interpolate(
    frame,
    [15, 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const taglineY = interpolate(
    frame,
    [15, 30],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // URL fade
  const urlOpacity = interpolate(
    frame,
    [30, 45],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Background glow
  const glowSize = interpolate(frame % 60, [0, 30, 60], [300, 400, 300]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: theme.colors.background,
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${theme.colors.border}33 1px, transparent 1px),
            linear-gradient(90deg, ${theme.colors.border}33 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.3,
        }}
      />

      {/* Center glow */}
      <div
        style={{
          position: "absolute",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.colors.primary}18, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: logoSpring,
            transform: `scale(${interpolate(logoSpring, [0, 1], [0.8, 1])})`,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: theme.colors.primary,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#000",
              fontSize: 28,
              fontFamily: theme.fonts.mono,
            }}
          >
            n
          </div>
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
            }}
          >
            n.codes
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            fontSize: 20,
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.heading,
            textAlign: "center",
          }}
        >
          Add agentic UI to your app
        </div>

        {/* URL */}
        <div
          style={{
            opacity: urlOpacity,
            fontSize: 18,
            color: theme.colors.primary,
            fontFamily: theme.fonts.mono,
            fontWeight: 500,
            padding: "10px 24px",
            background: theme.colors.primaryDim,
            borderRadius: 99,
            border: `1px solid ${theme.colors.primary}40`,
          }}
        >
          n.codes
        </div>
      </div>
    </AbsoluteFill>
  );
};
