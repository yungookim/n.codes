import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../styles/theme";
import { CrmShell } from "../components/CrmShell";
import { StatsCard } from "../components/StatsCard";
import { InvoicesTable } from "../components/InvoicesTable";

const stats = [
  { label: "Total Revenue", value: "$124,500", change: "+12.5%", positive: true },
  { label: "Active Customers", value: "1,284", change: "+8.2%", positive: true },
  { label: "Open Invoices", value: "47", change: "-3.1%", positive: false },
  { label: "Overdue", value: "12", change: "+2", positive: false },
];

export const ResultScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel closes at the start (scale down + fade)
  const panelExitDuration = 20;
  const panelOpacity = interpolate(frame, [0, panelExitDuration], [0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panelScale = interpolate(frame, [0, panelExitDuration], [1, 0.95], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Table appears after panel exits
  const tableStart = 25;
  const tableOpacity = interpolate(frame, [tableStart, tableStart + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
          position: "relative",
        }}
      >
        <CrmShell showSidebar={true} showButton={false}>
          {/* Stats stay visible but compact */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {stats.map((stat) => (
              <StatsCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                change={stat.change}
                positive={stat.positive}
              />
            ))}
          </div>

          {/* Generated invoices table replaces placeholder */}
          <div style={{ opacity: tableOpacity }}>
            <InvoicesTable startFrame={tableStart} />
          </div>
        </CrmShell>

        {/* Fading panel exit overlay (subtle) */}
        {frame < panelExitDuration && (
          <div
            style={{
              position: "absolute",
              bottom: 48,
              left: "50%",
              transform: `translateX(-50%) scale(${panelScale})`,
              width: 360,
              height: 200,
              backgroundColor: theme.colors.panelBg,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 14,
              opacity: panelOpacity,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
