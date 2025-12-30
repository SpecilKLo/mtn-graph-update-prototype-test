import * as React from "react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { ANIMATION_CONFIG, CHART_CONFIG } from "./constants";
import type { ChartData, ViewMode, WeekBlock, MonthBlock } from "./types";

// Match the bar sizing from VerticalBarChart
const MIN_VERTICAL_BAR_WIDTH = 75;

interface StickyVerticalXAxisProps {
  chartData: ChartData[];
  chartWidth: number;
  isMounted: boolean;
  dynamicBarSize: number;
  viewMode: ViewMode;
  weekBlocks: WeekBlock[];
  monthBlocks: MonthBlock[];
}

export function StickyVerticalXAxis({
  chartData,
  chartWidth,
  isMounted,
  dynamicBarSize,
  viewMode,
  weekBlocks,
  monthBlocks,
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
            {/* Reference areas for alternating backgrounds - uses same positioning as main chart */}
            {viewMode === 'day' && weekBlocks.map((block, index) => (
              <ReferenceArea
                key={`xaxis-week-${block.weekNumber}-${index}`}
                x1={block.start}
                x2={block.end}
                y1={0}
                y2={1}
                fill={index % 2 === 0 ? "#F5F5F5" : "transparent"}
                fillOpacity={1}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
            ))}
            
            {viewMode === 'week' && monthBlocks.map((block, index) => (
              <ReferenceArea
                key={`xaxis-${block.month}-${index}`}
                x1={block.start}
                x2={block.end}
                y1={0}
                y2={1}
                fill={index % 2 === 0 ? "#F5F5F5" : "transparent"}
                fillOpacity={1}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
            ))}

            {/* Hidden Y-axis to establish domain for ReferenceArea */}
            <YAxis domain={[0, 1]} hide />

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