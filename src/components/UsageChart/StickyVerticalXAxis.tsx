import * as React from "react";
import {
  Bar,
  BarChart,
  XAxis,
  ResponsiveContainer,
} from "recharts";
import { ANIMATION_CONFIG, CHART_CONFIG } from "./constants";
import type { ChartData } from "./types";

// Match the bar sizing from VerticalBarChart
const MIN_VERTICAL_BAR_WIDTH = 75;
const BAR_SPACING = 35;

interface StickyVerticalXAxisProps {
  chartData: ChartData[];
  chartWidth: number;
  isMounted: boolean;
  dynamicBarSize: number;
}

export function StickyVerticalXAxis({
  chartData,
  chartWidth,
  isMounted,
  dynamicBarSize,
}: StickyVerticalXAxisProps) {
  const barWidth = Math.max(dynamicBarSize, MIN_VERTICAL_BAR_WIDTH);

  return (
    <div style={{ minWidth: `${chartWidth}px`, height: 40 }} className="pr-4">
      {isMounted && (
        <ResponsiveContainer width="100%" height="100%" debounce={ANIMATION_CONFIG.DEBOUNCE}>
          <BarChart
            data={chartData}
            margin={{ top: 0, right: CHART_CONFIG.RIGHT_MARGIN, left: 0, bottom: 0 }}
            barGap={8}
            barSize={barWidth}
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
              height={40}
            />
            {/* Invisible bar to force proper alignment with main chart */}
            <Bar dataKey="usage" fill="transparent" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
