import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../styles/theme";

type GlowEffectProps = {
  children: React.ReactNode;
  pulseFrames?: number;
  intensity?: number;
  color?: string;
};

export const GlowEffect: React.FC<GlowEffectProps> = ({
  children,
  pulseFrames = 60,
  intensity = 1,
  color = theme.colors.primary,
}) => {
  const frame = useCurrentFrame();

  const glowOpacity = interpolate(
    frame % pulseFrames,
    [0, pulseFrames / 2, pulseFrames],
    [0.3 * intensity, 0.6 * intensity, 0.3 * intensity],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const blurRadius = interpolate(
    frame % pulseFrames,
    [0, pulseFrames / 2, pulseFrames],
    [20, 40, 20]
  );

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: -10,
          background: color,
          filter: `blur(${blurRadius}px)`,
          opacity: glowOpacity,
          zIndex: -1,
          borderRadius: 8,
        }}
      />
      {children}
    </span>
  );
};
