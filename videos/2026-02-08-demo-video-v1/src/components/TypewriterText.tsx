import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../styles/theme";

type TypewriterTextProps = {
  text: string;
  charFrames?: number;
  startFrame?: number;
  showCursor?: boolean;
  cursorBlinkFrames?: number;
  style?: React.CSSProperties;
};

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  charFrames = 2,
  startFrame = 0,
  showCursor = true,
  cursorBlinkFrames = 16,
  style,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = Math.max(0, frame - startFrame);

  const typedLength = Math.min(
    text.length,
    Math.floor(relativeFrame / charFrames)
  );
  const displayText = text.slice(0, typedLength);

  const cursorOpacity = showCursor
    ? interpolate(
        frame % cursorBlinkFrames,
        [0, cursorBlinkFrames / 2, cursorBlinkFrames],
        [1, 0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  return (
    <span
      style={{
        fontFamily: theme.fonts.mono,
        ...style,
      }}
    >
      {displayText}
      {showCursor && (
        <span
          style={{
            opacity: cursorOpacity,
            color: theme.colors.primary,
          }}
        >
          |
        </span>
      )}
    </span>
  );
};
