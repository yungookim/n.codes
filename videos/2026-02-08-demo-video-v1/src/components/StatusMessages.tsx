import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../styles/theme";

type StatusMessagesProps = {
  messages: string[];
  startFrame: number;
  staggerFrames?: number;
};

export const StatusMessages: React.FC<StatusMessagesProps> = ({
  messages,
  startFrame,
  staggerFrames = 25,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) return null;

  // Which message is currently active
  const activeIndex = Math.min(
    messages.length - 1,
    Math.floor(relativeFrame / staggerFrames)
  );

  return (
    <div
      style={{
        marginTop: 14,
        padding: 12,
        backgroundColor: theme.colors.appBg,
        borderRadius: 8,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {messages.map((msg, i) => {
        const msgStart = i * staggerFrames;
        if (relativeFrame < msgStart) return null;

        const msgOpacity = interpolate(
          relativeFrame - msgStart,
          [0, 8],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const isLast = i === messages.length - 1;
        const isCurrent = i === activeIndex;
        const isDone = isLast && relativeFrame >= msgStart + 8;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: msgOpacity,
              fontFamily: theme.fonts.heading,
              fontSize: 11,
              color: isCurrent ? theme.colors.text : theme.colors.textSecondary,
              marginBottom: i < messages.length - 1 ? 6 : 0,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: isDone ? theme.colors.primary : theme.colors.textSecondary,
              }}
            >
              {isDone ? "✓" : "⟳"}
            </span>
            <span>{msg}</span>
          </div>
        );
      })}
    </div>
  );
};
