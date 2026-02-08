import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../styles/theme";
import { GlowEffect } from "../components/GlowEffect";

type HookSceneProps = {
  hookText: string;
};

export const HookScene: React.FC<HookSceneProps> = ({ hookText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title spring animation
  const titleSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200 },
  });
  const titleOpacity = frame >= 10 ? titleSpring : 0;
  const titleScale = 0.9 + titleOpacity * 0.1;

  // Glow builds over time
  const glowOpacity = interpolate(frame, [10, 80], [0, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Subtle grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${theme.colors.border} 1px, transparent 1px),
            linear-gradient(90deg, ${theme.colors.border} 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: 0.3,
        }}
      />

      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          background: theme.colors.primary,
          borderRadius: "50%",
          filter: "blur(180px)",
          opacity: glowOpacity,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <GlowEffect intensity={titleOpacity * 1.2}>
          <div
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 64,
              fontWeight: 700,
              color: theme.colors.text,
              textAlign: "center",
              opacity: titleOpacity,
              transform: `scale(${titleScale})`,
              lineHeight: 1.2,
              whiteSpace: "pre-line",
            }}
          >
            {hookText}
          </div>
        </GlowEffect>
      </div>
    </AbsoluteFill>
  );
};
