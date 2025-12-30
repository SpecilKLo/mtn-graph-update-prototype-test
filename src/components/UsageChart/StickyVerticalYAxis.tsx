import * as React from "react";
import {
  BarChart,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { formatGBValue, calculateNiceTicks } from "./utils";

interface StickyVerticalYAxisProps {
  maxDomainValue: number;
  isMounted: boolean;
}

interface CustomTickProps {
  x: number;
  y: number;
  payload: { value: number };
}

function CustomYAxisTick({ x, y, payload }: CustomTickProps) {
  const isZero = payload.value === 0;
  // Move 0 GB label up by 15px
  const adjustedY = isZero ? y - 15 : y;
  
  return (
    <text
      x={x}
      y={adjustedY}
      fill="hsl(var(--muted-foreground))"
      fontSize={11}
      fontWeight={500}
      textAnchor="end"
      dominantBaseline="middle"
    >
      {formatGBValue(payload.value)}
    </text>
  );
}

export function StickyVerticalYAxis({
  maxDomainValue,
  isMounted,
}: StickyVerticalYAxisProps) {
  // Use nice ticks for round values - no buffer since maxDomainValue is already calculated
  const ticks = calculateNiceTicks(maxDomainValue, 5, false);

  return (
    <div className="shrink-0 bg-card" style={{ width: 60 }}>
      {isMounted && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[]}
            margin={{ top: 24, right: 0, left: 0, bottom: 0 }}
          >
            <YAxis
              type="number"
              domain={[0, maxDomainValue]}
              axisLine={false}
              tickLine={false}
              tick={<CustomYAxisTick x={0} y={0} payload={{ value: 0 }} />}
              width={60}
              ticks={ticks}
              orientation="left"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
