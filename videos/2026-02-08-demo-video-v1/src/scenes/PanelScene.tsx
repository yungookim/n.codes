import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../styles/theme";
import { CrmShell } from "../components/CrmShell";
import { StatsCard } from "../components/StatsCard";
import { NcodesPanel } from "../components/NcodesPanel";
import { TypewriterText } from "../components/TypewriterText";
import { StatusMessages } from "../components/StatusMessages";

const stats = [
  { label: "Total Revenue", value: "$124,500", change: "+12.5%", positive: true },
  { label: "Active Customers", value: "1,284", change: "+8.2%", positive: true },
  { label: "Open Invoices", value: "47", change: "-3.1%", positive: false },
  { label: "Overdue", value: "12", change: "+2", positive: false },
];

const statusMessages = [
  "Analyzing request...",
  "Mapping to capabilities...",
  "Selecting components...",
  "Generating UI...",
  "Applying styles...",
  "Done!",
];

const promptText = "Show me overdue invoices over $500 with reminder buttons";

export const PanelScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel slide up (frames 0-60)
  const panelSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const panelOpacity = panelSpring;
  const panelTranslateY = interpolate(panelSpring, [0, 1], [80, 0]);
  const panelScale = interpolate(panelSpring, [0, 1], [0.95, 1]);

  // Typewriter starts at frame 60
  const typewriterStart = 60;
  const typedLength = Math.max(
    0,
    Math.min(
      promptText.length,
      Math.floor((frame - typewriterStart) / 2)
    )
  );
  const displayPrompt = frame >= typewriterStart ? promptText.slice(0, typedLength) : "";

  // Status messages start after typing finishes
  // Typing ends around frame 60 + (promptText.length * 2) = 60 + 112 = ~172
  // Let's start at frame 160
  const statusStart = 160;

  // Dim the background slightly while panel is active
  const dimOpacity = interpolate(panelSpring, [0, 1], [0, 0.3]);

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
        {/* CRM shell in background */}
        <CrmShell showSidebar={true} showButton={false}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              marginBottom: 20,
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

        {/* Dim overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "black",
            opacity: dimOpacity,
            borderRadius: 16,
          }}
        />

        {/* n.codes panel */}
        <NcodesPanel
          opacity={panelOpacity}
          translateY={panelTranslateY}
          scale={panelScale}
          promptText={displayPrompt || undefined}
          showQuickPrompts={frame < typewriterStart}
        >
          {/* Typewriter cursor in the prompt area — handled by promptText prop */}
          {frame >= typewriterStart && typedLength < promptText.length && (
            <div style={{ position: "absolute", display: "none" }}>
              {/* TypewriterText drives the cursor blink but we use the prompt display directly */}
            </div>
          )}

          {/* Status messages */}
          {frame >= statusStart && (
            <StatusMessages
              messages={statusMessages}
              startFrame={statusStart}
              staggerFrames={23}
            />
          )}
        </NcodesPanel>
      </div>
    </AbsoluteFill>
  );
};
