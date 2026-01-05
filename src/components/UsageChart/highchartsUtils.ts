import type { ChartData, ViewMode, WeekBlock, MonthBlock } from "./types";
import { HIGHCHARTS_COLORS, BAR_SIZING } from "./highchartsConfig";

// PlotBand interface for Highcharts
export interface PlotBand {
  from: number;
  to: number;
  color: string;
  label?: {
    text: string;
    style: {
      color: string;
      fontSize: string;
      fontWeight: string;
    };
    align: "left" | "center" | "right";
    verticalAlign: "top" | "middle" | "bottom";
    x: number;
    y: number;
  };
}

// Create plotBands from week/month blocks
export function createPlotBands(
  chartData: ChartData[],
  weekBlocks: WeekBlock[],
  monthBlocks: MonthBlock[],
  viewMode: ViewMode
): PlotBand[] {
  if (viewMode === "day") {
    return weekBlocks.map((block, index) => {
      const startIdx = chartData.findIndex((d) => d.label === block.start);
      const endIdx = chartData.findIndex((d) => d.label === block.end);
      return {
        from: startIdx - 0.5,
        to: endIdx + 0.5,
        color: index % 2 === 0 ? HIGHCHARTS_COLORS.background : "transparent",
      };
    });
  }

  if (viewMode === "week") {
    return monthBlocks.map((block, index) => {
      const startIdx = chartData.findIndex((d) => d.label === block.start);
      const endIdx = chartData.findIndex((d) => d.label === block.end);
      return {
        from: startIdx - 0.5,
        to: endIdx + 0.5,
        color: index % 2 === 0 ? HIGHCHARTS_COLORS.background : "transparent",
        label: {
          text: block.month,
          style: {
            color: HIGHCHARTS_COLORS.text,
            fontSize: "12px",
            fontWeight: "500",
          },
          align: "left" as const,
          verticalAlign: "top" as const,
          x: 10,
          y: 18,
        },
      };
    });
  }

  return [];
}

// Create X-axis plotBands for the sticky x-axis (extends to full height of 40px)
export function createXAxisPlotBands(
  chartData: ChartData[],
  weekBlocks: WeekBlock[],
  monthBlocks: MonthBlock[],
  viewMode: ViewMode
): PlotBand[] {
  if (viewMode === "day") {
    return weekBlocks.map((block, index) => {
      const startIdx = chartData.findIndex((d) => d.label === block.start);
      const endIdx = chartData.findIndex((d) => d.label === block.end);
      return {
        from: startIdx - 0.5,
        to: endIdx + 0.5,
        color: index % 2 === 0 ? HIGHCHARTS_COLORS.background : "transparent",
      };
    });
  }

  if (viewMode === "week") {
    return monthBlocks.map((block, index) => {
      const startIdx = chartData.findIndex((d) => d.label === block.start);
      const endIdx = chartData.findIndex((d) => d.label === block.end);
      return {
        from: startIdx - 0.5,
        to: endIdx + 0.5,
        color: index % 2 === 0 ? HIGHCHARTS_COLORS.background : "transparent",
      };
    });
  }

  return [];
}

// Get bar slot width for x-axis tick background calculation
export function getBarSlotWidth(dynamicBarSize: number): number {
  const barWidth = Math.max(dynamicBarSize, BAR_SIZING.MIN_VERTICAL_BAR_WIDTH);
  return barWidth + BAR_SIZING.BAR_SPACING;
}
