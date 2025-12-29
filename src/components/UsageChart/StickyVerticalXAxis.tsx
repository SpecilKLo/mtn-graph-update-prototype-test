import * as React from "react";
import {
  BarChart,
  XAxis,
  ResponsiveContainer,
} from "recharts";
import { ANIMATION_CONFIG } from "./constants";
import type { ChartData } from "./types";

interface StickyVerticalXAxisProps {
  chartData: ChartData[];
  chartWidth: number;
  isMounted: boolean;
}

export function StickyVerticalXAxis({
  chartData,
  chartWidth,
  isMounted,
}: StickyVerticalXAxisProps) {
  return (
    <div style={{ minWidth: `${chartWidth}px`, height: 50 }}>
      {isMounted && (
        <ResponsiveContainer width="100%" height="100%" debounce={ANIMATION_CONFIG.DEBOUNCE}>
          <BarChart
            data={chartData}
            margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
          >
            <XAxis
              dataKey="label"
              type="category"
              axisLine={{ stroke: '#CFCFCF' }}
              tickLine={false}
              tick={{
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
                fontWeight: 500,
              }}
              interval={0}
              angle={0}
              textAnchor="middle"
              height={30}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
