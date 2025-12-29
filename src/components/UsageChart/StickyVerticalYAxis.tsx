import * as React from "react";
import {
  BarChart,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { formatGBValue } from "./utils";

interface StickyVerticalYAxisProps {
  maxDomainValue: number;
  isMounted: boolean;
}

export function StickyVerticalYAxis({
  maxDomainValue,
  isMounted,
}: StickyVerticalYAxisProps) {
  const ticks = [0, Math.round(maxDomainValue / 4), Math.round(maxDomainValue / 2), Math.round(maxDomainValue * 3 / 4), maxDomainValue];

  return (
    <div className="shrink-0 bg-card" style={{ width: 60 }}>
      {isMounted && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[]}
            margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
          >
            <YAxis
              type="number"
              domain={[0, maxDomainValue]}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
                fontWeight: 500,
              }}
              tickFormatter={(value) => formatGBValue(value)}
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
