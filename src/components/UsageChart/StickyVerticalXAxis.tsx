import * as React from "react";
import {
  Bar,
  BarChart,
  XAxis,
  ResponsiveContainer,
} from "recharts";
import { ANIMATION_CONFIG, CHART_CONFIG } from "./constants";
import type { ChartData, ViewMode, WeekBlock, MonthBlock } from "./types";

// Match the bar sizing from VerticalBarChart
const MIN_VERTICAL_BAR_WIDTH = 75;
const BAR_SPACING = 35;

interface StickyVerticalXAxisProps {
  chartData: ChartData[];
  chartWidth: number;
  isMounted: boolean;
  dynamicBarSize: number;
  viewMode: ViewMode;
  weekBlocks: WeekBlock[];
  monthBlocks: MonthBlock[];
}

// Custom tick component that includes background coloring
interface CustomTickProps {
  x?: number;
  y?: number;
  payload?: { value: string; index: number };
  chartData: ChartData[];
  viewMode: ViewMode;
  weekBlocks: WeekBlock[];
  monthBlocks: MonthBlock[];
  barSlotWidth: number;
}

const CustomTick = ({
  x = 0,
  y = 0,
  payload,
  chartData,
  viewMode,
  weekBlocks,
  monthBlocks,
  barSlotWidth,
}: CustomTickProps) => {
  if (!payload) return null;

  const { value, index } = payload;

  // Determine if this tick should have a background
  const getBackgroundColor = (): string => {
    if (viewMode === 'day') {
      const blockIndex = weekBlocks.findIndex(block => {
        const startIdx = chartData.findIndex(d => d.label === block.start);
        const endIdx = chartData.findIndex(d => d.label === block.end);
        return index >= startIdx && index <= endIdx;
      });
      return blockIndex !== -1 && blockIndex % 2 === 0 ? '#F5F5F5' : 'transparent';
    }

    if (viewMode === 'week') {
      const blockIndex = monthBlocks.findIndex(block => {
        const startIdx = chartData.findIndex(d => d.label === block.start);
        const endIdx = chartData.findIndex(d => d.label === block.end);
        return index >= startIdx && index <= endIdx;
      });
      return blockIndex !== -1 && blockIndex % 2 === 0 ? '#F5F5F5' : 'transparent';
    }

    return 'transparent';
  };

  const bgColor = getBackgroundColor();

  return (
    <g>
      {/* Background rect - positioned to span the full slot width and height */}
      <rect
        x={x - barSlotWidth / 2}
        y={0}
        width={barSlotWidth}
        height={40}
        fill={bgColor}
      />
      {/* Tick label text */}
      <text
        x={x}
        y={y}
        dy={4}
        fill="hsl(var(--muted-foreground))"
        fontSize={11}
        fontWeight={500}
        textAnchor="middle"
      >
        {value}
      </text>
    </g>
  );
};

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
  const barSlotWidth = barWidth + BAR_SPACING;

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
              tick={(props) => (
                <CustomTick
                  {...props}
                  chartData={chartData}
                  viewMode={viewMode}
                  weekBlocks={weekBlocks}
                  monthBlocks={monthBlocks}
                  barSlotWidth={barSlotWidth}
                />
              )}
              interval={0}
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