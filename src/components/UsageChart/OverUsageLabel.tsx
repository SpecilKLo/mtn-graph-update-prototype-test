import { formatGBValue } from "./utils";

interface OverUsageLabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}

/**
 * Custom label component for over usage bars.
 * Positions the label inside the bar when there's enough space,
 * or outside (to the right) when the bar is too small.
 */
export const OverUsageLabel = (props: OverUsageLabelProps) => {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  
  if (!value || value === 0) return null;

  const text = formatGBValue(value);
  const minWidthForInside = 45;
  const isSmall = width < minWidthForInside;

  return (
    <text
      x={isSmall ? x + width + 8 : x + width - 10}
      y={y + height / 2}
      fill="hsl(var(--foreground))"
      fontSize={11}
      fontWeight={700}
      textAnchor={isSmall ? "start" : "end"}
      dominantBaseline="middle"
    >
      {text}
    </text>
  );
};
