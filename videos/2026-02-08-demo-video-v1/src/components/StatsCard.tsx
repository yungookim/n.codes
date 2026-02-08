import { theme } from "../styles/theme";

type StatsCardProps = {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  opacity?: number;
  translateY?: number;
};

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  change,
  positive = true,
  opacity = 1,
  translateY = 0,
}) => {
  return (
    <div
      style={{
        backgroundColor: theme.colors.cardBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 10,
        padding: 16,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 11,
          color: theme.colors.textDim,
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 22,
          fontWeight: 600,
          color: theme.colors.text,
          marginBottom: 3,
        }}
      >
        {value}
      </div>
      {change && (
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 11,
            fontWeight: 500,
            color: positive ? theme.colors.primary : theme.colors.danger,
          }}
        >
          {change}
        </div>
      )}
    </div>
  );
};
