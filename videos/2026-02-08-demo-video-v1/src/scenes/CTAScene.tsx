import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../styles/theme";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Staggered animations
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const taglineOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [20, 35], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlY = interpolate(frame, [40, 55], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          background: theme.colors.primary,
          borderRadius: "50%",
          filter: "blur(180px)",
          opacity: 0.15,
        }}
      />

      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${theme.colors.border} 1px, transparent 1px),
            linear-gradient(90deg, ${theme.colors.border} 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: 0.15,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 120,
            fontWeight: 700,
            color: theme.colors.text,
            letterSpacing: "-0.02em",
            transform: `scale(${logoSpring})`,
          }}
        >
          n.codes
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 36,
            fontWeight: 500,
            color: theme.colors.textSecondary,
            textAlign: "center",
            maxWidth: 700,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          Agentic UI in your app
        </div>

        {/* URL */}
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 32,
            color: theme.colors.primary,
            opacity: urlOpacity,
            transform: `translateY(${urlY}px)`,
            borderBottom: `2px solid ${theme.colors.primary}`,
            paddingBottom: 4,
          }}
        >
          n.codes
        </div>
      </div>
    </AbsoluteFill>
  );
};
