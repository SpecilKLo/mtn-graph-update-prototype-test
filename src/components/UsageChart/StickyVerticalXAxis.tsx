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
  const totalBarSlotWidth = barWidth + BAR_SPACING;

  // Calculate which data indices belong to which block for background coloring
  const getBackgroundForIndex = (index: number): string => {
    const label = chartData[index]?.label;
    if (!label) return 'transparent';

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

  // Calculate the offset to align with chart bars
  // The chart starts with half a bar slot width on the left (category axis centering)
  const leftOffset = totalBarSlotWidth / 2 - barWidth / 2;

  return (
    <div style={{ minWidth: `${chartWidth}px`, height: 40 }} className="relative pr-4">
      {/* Background layer for alternating colors */}
      <div className="absolute inset-0 flex" style={{ paddingRight: 16, paddingLeft: leftOffset }}>
        {chartData.map((_, index) => (
          <div
            key={index}
            style={{
              width: totalBarSlotWidth,
              height: '100%',
              backgroundColor: getBackgroundForIndex(index),
            }}
          />
        ))}
      </div>

      {/* Chart layer for X-axis labels */}
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
