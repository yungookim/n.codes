import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { theme } from "../styles/theme";

const invoices = [
  { customer: "Sarah Chen", email: "sarah@acme.co", invoice: "INV-2847", amount: "$12,500", days: "15 days", severity: "mild" },
  { customer: "Marcus Johnson", email: "marcus@globex.io", invoice: "INV-2831", amount: "$8,750", days: "32 days", severity: "moderate" },
  { customer: "Emily Park", email: "emily@stark.dev", invoice: "INV-2819", amount: "$24,000", days: "45 days", severity: "severe" },
  { customer: "David Kim", email: "david@wayne.co", invoice: "INV-2803", amount: "$6,200", days: "28 days", severity: "moderate" },
];

const severityColors: Record<string, { bg: string; color: string }> = {
  mild: { bg: "rgba(251, 191, 36, 0.1)", color: theme.colors.warning },
  moderate: { bg: "rgba(251, 146, 60, 0.1)", color: "#fb923c" },
  severe: { bg: "rgba(248, 113, 113, 0.1)", color: theme.colors.danger },
};

export const ResultScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel expands to center dialog
  const expandSpring = spring({ frame, fps, config: { damping: 15, stiffness: 60 } });
  const dialogWidth = interpolate(expandSpring, [0, 1], [400, 800]);
  const dialogHeight = interpolate(expandSpring, [0, 1], [500, 600]);

  // Glow border
  const glowAngle = (frame * 3) % 360;
  const breatheIntensity = 0.1 + Math.sin(frame * 0.07) * 0.08;

  // Table fade in after expand
  const tableOpacity = interpolate(
    frame,
    [15, 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Dim overlay
  const dimOpacity = 0.5;

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

      {/* Expanded dialog */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: dialogWidth,
          maxHeight: dialogHeight,
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
            0 0 40px rgba(74, 222, 128, ${breatheIntensity}),
            0 0 80px rgba(74, 222, 128, ${breatheIntensity * 0.5})
          `,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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

        {/* Result header */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: `1px solid ${theme.colors.border}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: tableOpacity,
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              border: `1px solid ${theme.colors.border}`,
              background: theme.colors.background,
              color: theme.colors.textSecondary,
              fontSize: 13,
              borderRadius: 6,
              fontFamily: theme.fonts.heading,
            }}
          >
            &larr; Back
          </div>
          <span
            style={{
              fontSize: 13,
              color: theme.colors.textDim,
              fontFamily: theme.fonts.heading,
            }}
          >
            Show overdue invoices over $500
          </span>
        </div>

        {/* Generated invoices table */}
        <div style={{ flex: 1, padding: 20, opacity: tableOpacity, overflow: "hidden" }}>
          <div
            style={{
              background: theme.colors.cardBg,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Generated header */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: `1px solid ${theme.colors.border}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading,
                }}
              >
                Overdue Invoices
              </h2>
              <span
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  background: theme.colors.primaryDim,
                  color: theme.colors.primary,
                  borderRadius: 99,
                  fontFamily: theme.fonts.mono,
                }}
              >
                AI Generated
              </span>
            </div>

            {/* Table header */}
            <div
              style={{
                display: "flex",
                padding: "10px 24px",
                borderBottom: `1px solid ${theme.colors.border}`,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: theme.colors.textDim,
                fontFamily: theme.fonts.heading,
              }}
            >
              <span style={{ flex: 2 }}>Customer</span>
              <span style={{ flex: 1 }}>Invoice</span>
              <span style={{ flex: 1 }}>Amount</span>
              <span style={{ flex: 1 }}>Overdue</span>
              <span style={{ flex: 1, textAlign: "right" }}>Action</span>
            </div>

            {/* Table rows */}
            {invoices.map((inv, i) => {
              const rowOpacity = interpolate(
                frame,
                [20 + i * 6, 28 + i * 6],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              const sev = severityColors[inv.severity];
              return (
                <div
                  key={inv.invoice}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 24px",
                    borderBottom:
                      i < invoices.length - 1
                        ? `1px solid ${theme.colors.borderLight}`
                        : "none",
                    fontSize: 13,
                    opacity: rowOpacity,
                    fontFamily: theme.fonts.heading,
                  }}
                >
                  <span style={{ flex: 2 }}>
                    <div style={{ fontWeight: 500, color: theme.colors.text }}>
                      {inv.customer}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.colors.textDim,
                        marginTop: 2,
                      }}
                    >
                      {inv.email}
                    </div>
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontFamily: theme.fonts.mono,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {inv.invoice}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontFamily: theme.fonts.mono,
                      fontWeight: 500,
                      color: theme.colors.text,
                    }}
                  >
                    {inv.amount}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        background: sev.bg,
                        color: sev.color,
                      }}
                    >
                      {inv.days}
                    </span>
                  </span>
                  <span style={{ flex: 1, textAlign: "right" }}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        background: theme.colors.primaryDim,
                        color: theme.colors.primary,
                      }}
                    >
                      Remind
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
