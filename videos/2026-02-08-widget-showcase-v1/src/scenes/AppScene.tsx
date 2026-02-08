import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { theme } from "../styles/theme";

const stats = [
  { label: "TOTAL CUSTOMERS", value: "2,847", change: "+12%" },
  { label: "ACTIVE DEALS", value: "156", change: "+8%" },
  { label: "REVENUE (MTD)", value: "$284K", change: "+23%" },
  { label: "TASKS DUE", value: "34", change: "-5%" },
];

const navItems = ["Dashboard", "Contacts", "Deals", "Tasks", "Reports"];

export const AppScene: React.FC<{ layout: "vertical" | "horizontal" }> = ({ layout }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appSpring = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const appScale = interpolate(appSpring, [0, 1], [0.92, 1]);
  const appOpacity = appSpring;

  const isVertical = layout === "vertical";
  const shellWidth = isVertical ? 920 : 1600;
  const shellHeight = isVertical ? 1400 : 850;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: shellWidth,
          height: shellHeight,
          background: theme.colors.cardBg,
          borderRadius: 16,
          border: `1px solid ${theme.colors.border}`,
          overflow: "hidden",
          opacity: appOpacity,
          transform: `scale(${appScale})`,
          display: "flex",
          flexDirection: "row",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: 200,
            background: theme.colors.background,
            borderRight: `1px solid ${theme.colors.border}`,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
              paddingLeft: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: `linear-gradient(135deg, #6366f1, #8b5cf6)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              A
            </div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
              }}
            >
              Acme CRM
            </span>
          </div>

          {navItems.map((item, i) => (
            <div
              key={item}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: i === 0 ? theme.colors.text : theme.colors.textSecondary,
                background: i === 0 ? theme.colors.primaryDim : "transparent",
                fontFamily: theme.fonts.heading,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: 32, overflow: "hidden" }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: theme.colors.text,
              marginBottom: 24,
              fontFamily: theme.fonts.heading,
            }}
          >
            Dashboard
          </h1>

          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isVertical ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {stats.map((stat, i) => {
              const stagger = spring({
                frame: frame - 8 * i,
                fps,
                config: { damping: 200 },
              });
              return (
                <div
                  key={stat.label}
                  style={{
                    background: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 12,
                    padding: 20,
                    opacity: stagger,
                    transform: `translateY(${interpolate(stagger, [0, 1], [10, 0])}px)`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.colors.textDim,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 8,
                      fontFamily: theme.fonts.heading,
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 600,
                      color: theme.colors.text,
                      fontFamily: theme.fonts.heading,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: stat.change.startsWith("+")
                        ? theme.colors.primary
                        : theme.colors.danger,
                      marginTop: 4,
                      fontFamily: theme.fonts.mono,
                    }}
                  >
                    {stat.change}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Placeholder table rows */}
          <div
            style={{
              background: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                borderBottom: `1px solid ${theme.colors.border}`,
                fontSize: 12,
                color: theme.colors.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "flex",
                gap: 80,
                fontFamily: theme.fonts.heading,
              }}
            >
              <span style={{ flex: 1 }}>Contact</span>
              <span style={{ width: 100 }}>Status</span>
              <span style={{ width: 100 }}>Deal Value</span>
            </div>
            {["Sarah Chen", "Marcus Johnson", "Emily Park", "David Kim"].map(
              (name, i) => (
                <div
                  key={name}
                  style={{
                    padding: "14px 20px",
                    borderBottom:
                      i < 3 ? `1px solid ${theme.colors.borderLight}` : "none",
                    fontSize: 14,
                    color: theme.colors.textSecondary,
                    display: "flex",
                    alignItems: "center",
                    gap: 80,
                    fontFamily: theme.fonts.heading,
                  }}
                >
                  <span style={{ flex: 1, color: theme.colors.text, fontWeight: 500 }}>
                    {name}
                  </span>
                  <span
                    style={{
                      width: 100,
                      fontSize: 12,
                      color: i % 2 === 0 ? theme.colors.primary : theme.colors.warning,
                    }}
                  >
                    {i % 2 === 0 ? "Active" : "Pending"}
                  </span>
                  <span
                    style={{
                      width: 100,
                      fontFamily: theme.fonts.mono,
                      fontSize: 13,
                    }}
                  >
                    ${(15000 + i * 7500).toLocaleString()}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
