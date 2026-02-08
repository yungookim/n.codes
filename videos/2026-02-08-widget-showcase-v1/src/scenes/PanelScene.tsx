import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { theme } from "../styles/theme";

const promptText = "Show overdue invoices over $500";
const statusMessages = [
  "Analyzing request...",
  "Mapping to capabilities...",
  "Generating UI...",
  "Done!",
];

export const PanelScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel slides up
  const panelSpring = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const panelY = interpolate(panelSpring, [0, 1], [100, 0]);
  const panelOpacity = panelSpring;

  // Typewriter for prompt
  const typeStartFrame = 30;
  const charFrames = 2;
  const typedLength = Math.min(
    promptText.length,
    Math.max(0, Math.floor((frame - typeStartFrame) / charFrames))
  );
  const displayPrompt = promptText.slice(0, typedLength);
  const cursorVisible = frame >= typeStartFrame && frame % 16 < 10;

  // Status messages appear after typing completes
  const typeEndFrame = typeStartFrame + promptText.length * charFrames;
  const generateStartFrame = typeEndFrame + 15;

  // Dim overlay
  const dimOpacity = interpolate(panelSpring, [0, 1], [0, 0.5]);

  // Glow border rotation
  const glowAngle = (frame * 3) % 360;

  return (
    <AbsoluteFill>
      {/* Dim overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000",
          opacity: dimOpacity,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: `translateX(-50%) translateY(${panelY}px)`,
          width: 400,
          background: theme.colors.panelBg,
          borderRadius: 16,
          border: "1.5px solid transparent",
          backgroundImage: `
            linear-gradient(${theme.colors.panelBg}, ${theme.colors.panelBg}),
            conic-gradient(
              from ${glowAngle}deg,
              ${theme.colors.primary},
              rgba(74, 222, 128, 0.15),
              ${theme.colors.blue},
              ${theme.colors.purple},
              ${theme.colors.primary},
              rgba(74, 222, 128, 0.15),
              ${theme.colors.primary}
            )
          `,
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          boxShadow: `
            0 20px 60px rgba(0,0,0,0.5),
            0 0 40px rgba(74, 222, 128, ${0.1 + Math.sin(frame * 0.07) * 0.08}),
            0 0 80px rgba(74, 222, 128, ${0.05 + Math.sin(frame * 0.07) * 0.04})
          `,
          opacity: panelOpacity,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${theme.colors.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: theme.colors.primary,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#000",
              fontSize: 16,
              fontFamily: theme.fonts.mono,
            }}
          >
            n
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
            }}
          >
            n.codes
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {/* Intro text */}
          <p
            style={{
              fontSize: 14,
              color: theme.colors.textSecondary,
              lineHeight: 1.5,
              marginBottom: 20,
              fontFamily: theme.fonts.heading,
            }}
          >
            Describe the UI you need and it will be generated instantly.
          </p>

          {/* Prompt input */}
          <div
            style={{
              background: theme.colors.background,
              border: `1px solid ${
                frame >= typeStartFrame ? theme.colors.primary : theme.colors.border
              }`,
              borderRadius: 10,
              padding: "14px 16px",
              minHeight: 48,
              marginBottom: 12,
              fontSize: 14,
              color: displayPrompt
                ? theme.colors.text
                : theme.colors.textDim,
              fontFamily: theme.fonts.heading,
            }}
          >
            {displayPrompt || "e.g., Show me overdue invoices..."}
            {cursorVisible && (
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 16,
                  background: theme.colors.primary,
                  marginLeft: 1,
                  verticalAlign: "middle",
                }}
              />
            )}
          </div>

          {/* Generate button */}
          <div
            style={{
              width: "100%",
              padding: "12px 20px",
              background: theme.colors.primary,
              borderRadius: 10,
              textAlign: "center",
              fontSize: 14,
              fontWeight: 600,
              color: "#000",
              fontFamily: theme.fonts.heading,
              marginBottom: frame >= generateStartFrame ? 16 : 0,
            }}
          >
            Generate
          </div>

          {/* Status messages */}
          {frame >= generateStartFrame && (
            <div
              style={{
                background: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 10,
                padding: 16,
              }}
            >
              {statusMessages.map((msg, i) => {
                const msgStart = generateStartFrame + i * 15;
                const msgOpacity = interpolate(
                  frame,
                  [msgStart, msgStart + 8],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
                if (frame < msgStart) return null;
                const isDone = i === statusMessages.length - 1;
                const isActive = i === statusMessages.length - 1
                  ? false
                  : frame < msgStart + 15;
                return (
                  <div
                    key={msg}
                    style={{
                      opacity: msgOpacity,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      color: isDone
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                      marginBottom: i < statusMessages.length - 1 ? 8 : 0,
                      fontFamily: theme.fonts.heading,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>
                      {isDone ? "\u2713" : isActive ? "\u27F3" : "\u2713"}
                    </span>
                    {msg}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
