import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../styles/theme";
import { CrmShell } from "../components/CrmShell";
import { StatsCard } from "../components/StatsCard";

const stats = [
  { label: "Total Revenue", value: "$124,500", change: "+12.5%", positive: true },
  { label: "Active Customers", value: "1,284", change: "+8.2%", positive: true },
  { label: "Open Invoices", value: "47", change: "-3.1%", positive: false },
  { label: "Overdue", value: "12", change: "+2", positive: false },
];

export const AppScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Shell fade in
  const shellSpring = spring({ frame, fps, config: { damping: 200 } });
  const shellOpacity = shellSpring;
  const shellScale = 0.95 + shellSpring * 0.05;

  // Stats stagger in
  const statsStagger = (index: number) => {
    const start = 20 + index * 8;
    const opacity = interpolate(frame, [start, start + 15], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const y = interpolate(frame, [start, start + 15], [15, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return { opacity, y };
  };

  // Button appears after stats
  const buttonStart = 60;
  const buttonOpacity = interpolate(frame, [buttonStart, buttonStart + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Button glow breathing effect
  const buttonGlow = frame > buttonStart + 20
    ? interpolate(
        (frame - buttonStart) % 60,
        [0, 30, 60],
        [0, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  // Cursor animation toward button at end of scene
  const cursorStart = 110;
  const cursorOpacity = interpolate(frame, [cursorStart, cursorStart + 10, 145], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorX = interpolate(frame, [cursorStart, 145], [200, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3), // ease out cubic
  });
  const cursorY = interpolate(frame, [cursorStart, 145], [-100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          opacity: shellOpacity,
          transform: `scale(${shellScale})`,
          position: "relative",
        }}
      >
        <CrmShell
          showSidebar={true}
          showButton={true}
          buttonOpacity={buttonOpacity}
          buttonGlow={buttonGlow}
        >
          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {stats.map((stat, i) => {
              const { opacity, y } = statsStagger(i);
              return (
                <StatsCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  change={stat.change}
                  positive={stat.positive}
                  opacity={opacity}
                  translateY={y}
                />
              );
            })}
          </div>

          {/* Placeholder section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 16px",
              textAlign: "center",
              backgroundColor: theme.colors.cardBg,
              border: `1px dashed ${theme.colors.border}`,
              borderRadius: 12,
              opacity: interpolate(frame, [50, 65], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 15,
                fontWeight: 600,
                color: theme.colors.text,
                marginBottom: 6,
              }}
            >
              Need a custom view?
            </div>
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 12,
                color: theme.colors.textSecondary,
              }}
            >
              Click the{" "}
              <span style={{ color: theme.colors.primary, fontWeight: 500 }}>n.codes</span>{" "}
              button to generate any UI you need.
            </div>
          </div>
        </CrmShell>

        {/* Animated cursor */}
        {frame >= cursorStart && (
          <div
            style={{
              position: "absolute",
              bottom: 50,
              left: "50%",
              transform: `translate(calc(-50% + ${cursorX}px), ${cursorY}px)`,
              opacity: cursorOpacity,
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            {/* Simple cursor arrow */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
              <path d="M5 3l14 9-7 2-4 7z" />
            </svg>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
