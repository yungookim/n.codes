import { theme } from "../styles/theme";

type NcodesPanelProps = {
  opacity?: number;
  translateY?: number;
  scale?: number;
  promptText?: string;
  showQuickPrompts?: boolean;
  children?: React.ReactNode;
};

const quickPrompts = [
  "Overdue invoices table",
  "Customer health dashboard",
  "Bulk archive users",
];

export const NcodesPanel: React.FC<NcodesPanelProps> = ({
  opacity = 1,
  translateY = 0,
  scale = 1,
  promptText = "",
  showQuickPrompts = true,
  children,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 48,
        left: "50%",
        transform: `translateX(-50%) translateY(${translateY}px) scale(${scale})`,
        width: 360,
        backgroundColor: theme.colors.panelBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        opacity,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${theme.colors.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            backgroundColor: theme.colors.primary,
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            color: "#000",
            fontSize: 13,
            fontFamily: theme.fonts.mono,
          }}
        >
          n
        </div>
        <span
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 13,
            fontWeight: 600,
            color: theme.colors.text,
          }}
        >
          n.codes
        </span>
      </div>

      {/* Panel body */}
      <div style={{ padding: 16 }}>
        {/* Intro text */}
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          Describe the UI you need and it will be generated instantly.
        </div>

        {/* Prompt input */}
        <div
          style={{
            backgroundColor: theme.colors.appBg,
            border: `1px solid ${promptText ? theme.colors.primary : theme.colors.border}`,
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 10,
            minHeight: 56,
          }}
        >
          <span
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 12,
              color: promptText ? theme.colors.text : theme.colors.textDim,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {promptText || "e.g., Show me overdue invoices with a remind button..."}
          </span>
        </div>

        {/* Generate button */}
        <div
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: 8,
            padding: "10px 16px",
            textAlign: "center",
            fontFamily: theme.fonts.heading,
            fontSize: 12,
            fontWeight: 600,
            color: "#000",
            marginBottom: showQuickPrompts ? 14 : 0,
          }}
        >
          Generate
        </div>

        {/* Quick prompts */}
        {showQuickPrompts && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 10,
                color: theme.colors.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
                marginBottom: 2,
              }}
            >
              Try these examples:
            </div>
            {quickPrompts.map((prompt) => (
              <div
                key={prompt}
                style={{
                  padding: "8px 10px",
                  backgroundColor: theme.colors.appBg,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 6,
                  fontFamily: theme.fonts.heading,
                  fontSize: 11,
                  color: theme.colors.textSecondary,
                }}
              >
                {prompt}
              </div>
            ))}
          </div>
        )}

        {/* Status messages slot */}
        {children}
      </div>
    </div>
  );
};
