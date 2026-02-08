import { theme } from "../styles/theme";

type CrmShellProps = {
  children: React.ReactNode;
  showSidebar?: boolean;
  showButton?: boolean;
  buttonOpacity?: number;
  buttonGlow?: number;
};

const navItems = [
  { label: "Dashboard", active: true },
  { label: "Customers", active: false },
  { label: "Invoices", active: false },
  { label: "Settings", active: false },
];

export const CrmShell: React.FC<CrmShellProps> = ({
  children,
  showSidebar = true,
  showButton = false,
  buttonOpacity = 1,
  buttonGlow = 0,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.colors.appBg,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Titlebar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: theme.colors.sidebarBg,
          borderBottom: `1px solid ${theme.colors.border}`,
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Traffic light dots */}
        <div style={{ display: "flex", gap: 6, marginRight: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#febc2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#28c840" }} />
        </div>
        <span
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 13,
            color: theme.colors.textSecondary,
            flex: 1,
            textAlign: "center",
          }}
        >
          your-app.com
        </span>
        {/* Spacer for symmetry */}
        <div style={{ width: 54 }} />
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        {showSidebar && (
          <div
            style={{
              width: 180,
              backgroundColor: theme.colors.sidebarBg,
              borderRight: `1px solid ${theme.colors.border}`,
              display: "flex",
              flexDirection: "column",
              padding: 12,
              flexShrink: 0,
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #22c55e 100%)`,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#000",
                  fontSize: 11,
                  fontFamily: theme.fonts.heading,
                }}
              >
                A
              </div>
              <span
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.colors.text,
                }}
              >
                Acme CRM
              </span>
            </div>

            {/* Nav items */}
            {navItems.map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  marginBottom: 2,
                  fontFamily: theme.fonts.heading,
                  fontSize: 13,
                  fontWeight: 500,
                  color: item.active ? theme.colors.primary : theme.colors.textSecondary,
                  backgroundColor: item.active ? theme.colors.primaryDim : "transparent",
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: `1px solid ${theme.colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 17,
                fontWeight: 600,
                color: theme.colors.text,
              }}
            >
              Dashboard
            </span>
            <span
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 12,
                padding: "4px 10px",
                backgroundColor: theme.colors.cardBg,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 16,
                color: theme.colors.textSecondary,
              }}
            >
              Demo User
            </span>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, padding: 24, overflow: "hidden", position: "relative" }}>
            {children}
          </div>

          {/* Build with AI button */}
          {showButton && (
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                opacity: buttonOpacity,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 99,
                  backgroundColor: theme.colors.cardBg,
                  border: `1px solid ${buttonGlow > 0 ? theme.colors.primary : theme.colors.border}`,
                  fontFamily: theme.fonts.heading,
                  fontSize: 12,
                  fontWeight: 500,
                  color: theme.colors.textSecondary,
                  boxShadow: buttonGlow > 0
                    ? `0 0 ${15 * buttonGlow}px ${theme.colors.primaryDim}, 0 0 ${8 * buttonGlow}px ${theme.colors.primaryDim}`
                    : "0 4px 20px rgba(0, 0, 0, 0.3)",
                }}
              >
                {/* n.codes bracket icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2.5">
                  <path d="M7 4h-3v16h3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 4h3v16h-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Build with AI</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
