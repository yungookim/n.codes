import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../styles/theme";

export const HookScene: React.FC<{ hookText: string }> = ({ hookText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 200 } });
  const titleOpacity = titleSpring;
  const titleScale = interpolate(titleSpring, [0, 1], [0.9, 1]);

  // Fade out as app scene approaches
  const fadeOut = interpolate(
    frame,
    [theme.timing.hook - 20, theme.timing.hook],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Background glow pulse
  const glowSize = interpolate(
    frame % 60,
    [0, 30, 60],
    [400, 500, 400]
  );

  const lines = hookText.split("\n");

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
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
          opacity: 0.4,
        }}
      />

      {/* Center glow */}
      <div
        style={{
          position: "absolute",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.colors.primary}20, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />

      {/* Hook text */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          textAlign: "center",
          zIndex: 1,
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: 72,
              fontWeight: 700,
              fontFamily: theme.fonts.heading,
              color: i === 0 ? theme.colors.text : theme.colors.primary,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
