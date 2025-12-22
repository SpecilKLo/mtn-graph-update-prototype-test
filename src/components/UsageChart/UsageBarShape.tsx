interface UsageBarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    overUsage?: number;
  };
}

/**
 * Custom bar shape component for the usage bar.
 * Renders with rounded corners on the right side, unless there's over usage
 * (in which case the over usage bar gets the rounded corners instead).
 */
export const UsageBarShape = (props: UsageBarShapeProps) => {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const hasOverUsage = payload?.overUsage && payload.overUsage > 0;
  const radius = hasOverUsage ? 0 : 4;

  return (
    <path
      d={`M${x},${y} 
         L${x + width - radius},${y} 
         Q${x + width},${y} ${x + width},${y + radius}
         L${x + width},${y + height - radius}
         Q${x + width},${y + height} ${x + width - radius},${y + height}
         L${x},${y + height}
         Z`}
      fill="hsl(var(--chart-2))"
    />
  );
};
