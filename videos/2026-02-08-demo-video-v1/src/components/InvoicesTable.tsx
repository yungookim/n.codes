import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../styles/theme";

type InvoicesTableProps = {
  startFrame?: number;
};

const invoices = [
  { initials: "SC", name: "Sarah Chen", email: "sarah@acme.co", invoice: "INV-2024-089", amount: "$892.00", days: "32 days", severity: "moderate" as const },
  { initials: "MR", name: "Mike Rivera", email: "mike@startup.io", invoice: "INV-2024-076", amount: "$1,240.00", days: "45 days", severity: "severe" as const },
  { initials: "JW", name: "Jess Wu", email: "jess@corp.com", invoice: "INV-2024-092", amount: "$567.50", days: "18 days", severity: "mild" as const },
];

const severityColors = {
  mild: { bg: "rgba(251, 191, 36, 0.1)", text: "#fbbf24" },
  moderate: { bg: "rgba(251, 146, 60, 0.1)", text: "#fb923c" },
  severe: { bg: "rgba(248, 113, 113, 0.1)", text: "#f87171" },
};

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = Math.max(0, frame - startFrame);

  const headerOpacity = interpolate(relativeFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        backgroundColor: theme.colors.cardBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 12,
        overflow: "hidden",
        opacity: headerOpacity,
        transform: `translateY(${interpolate(relativeFrame, [0, 12], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: `1px solid ${theme.colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 15,
              fontWeight: 600,
              color: theme.colors.text,
            }}
          >
            Overdue Invoices &gt; $500
          </span>
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 10,
              padding: "3px 8px",
              backgroundColor: theme.colors.primaryDim,
              color: theme.colors.primary,
              borderRadius: 99,
              fontWeight: 500,
            }}
          >
            Pending
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: "0 18px" }}>
        {/* Column headers */}
        <div
          style={{
            display: "flex",
            padding: "10px 0",
            borderBottom: `1px solid ${theme.colors.border}`,
            fontFamily: theme.fonts.heading,
            fontSize: 10,
            fontWeight: 500,
            color: theme.colors.textDim,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <span style={{ flex: 2 }}>Customer</span>
          <span style={{ flex: 1 }}>Amount</span>
          <span style={{ flex: 1 }}>Overdue</span>
          <span style={{ flex: 1, textAlign: "right" }}>Action</span>
        </div>

        {/* Rows */}
        {invoices.map((inv, i) => {
          const rowStart = 10 + i * 10;
          const rowOpacity = interpolate(relativeFrame, [rowStart, rowStart + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const rowY = interpolate(relativeFrame, [rowStart, rowStart + 10], [8, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const sev = severityColors[inv.severity];

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: i < invoices.length - 1 ? `1px solid ${theme.colors.borderLight}` : "none",
                opacity: rowOpacity,
                transform: `translateY(${rowY}px)`,
              }}
            >
              {/* Customer */}
              <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: theme.colors.appBg,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: theme.fonts.heading,
                    fontSize: 10,
                    fontWeight: 600,
                    color: theme.colors.textSecondary,
                    flexShrink: 0,
                  }}
                >
                  {inv.initials}
                </div>
                <div>
                  <div style={{ fontFamily: theme.fonts.heading, fontSize: 12, fontWeight: 500, color: theme.colors.text }}>
                    {inv.name}
                  </div>
                  <div style={{ fontFamily: theme.fonts.heading, fontSize: 10, color: theme.colors.textDim }}>
                    {inv.email}
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div
                style={{
                  flex: 1,
                  fontFamily: theme.fonts.mono,
                  fontSize: 12,
                  fontWeight: 500,
                  color: theme.colors.text,
                }}
              >
                {inv.amount}
              </div>

              {/* Overdue badge */}
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: 500,
                    fontFamily: theme.fonts.heading,
                    backgroundColor: sev.bg,
                    color: sev.text,
                  }}
                >
                  {inv.days}
                </span>
              </div>

              {/* Action */}
              <div style={{ flex: 1, textAlign: "right" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 500,
                    fontFamily: theme.fonts.heading,
                    backgroundColor: theme.colors.primaryDim,
                    color: theme.colors.primary,
                  }}
                >
                  Send Reminder
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 18px",
          borderTop: `1px solid ${theme.colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 11,
            color: theme.colors.textDim,
          }}
        >
          Showing 3 invoices totaling $2,699.50
        </span>
        <span
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: theme.fonts.heading,
            backgroundColor: theme.colors.primary,
            color: "#000",
          }}
        >
          Send All Reminders
        </span>
      </div>
    </div>
  );
};
