import type { ChartData, ViewMode, WeekBlock, MonthBlock } from "./types";
import { HIGHCHARTS_COLORS, BAR_SIZING } from "./highchartsConfig";
import { formatGBValue } from "./utils";

// PlotBand interface for Highcharts
export interface PlotBand {
  from: number;
  to: number;
  color: string;
  label?: {
    text: string;
    useHTML?: boolean;
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
  // Daily view: alternating backgrounds for each week
  if (viewMode === "day") {
    // If no week blocks provided, create alternating bands per bar
    if (weekBlocks.length === 0) {
      // Create week groupings based on every 7 days
      const bands: PlotBand[] = [];
      let weekIndex = 0;
      for (let i = 0; i < chartData.length; i += 7) {
        const endIndex = Math.min(i + 6, chartData.length - 1);
        // First week gets gray, then alternates
        if (weekIndex % 2 === 0) {
          bands.push({
            from: i - 0.5,
            to: endIndex + 0.5,
            color: HIGHCHARTS_COLORS.background,
          });
        }
        weekIndex++;
      }
      return bands;
    }
    
    // Gray background for even-indexed weeks (0, 2, 4...)
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
      const totalUsageHtml = block.totalUsage !== undefined 
        ? `<div style="display: inline-block; background-color: rgba(0,0,0,0.06); border-radius: 9999px; padding: 4px 12px; margin-top: 6px;">
            <span style="font-size: 12px; font-weight: 400; color: #888;">Total Usage: </span>
            <span style="font-size: 12px; font-weight: 600; color: #888;">${formatGBValue(block.totalUsage)}</span>
          </div>`
        : '';
      return {
        from: startIdx - 0.5,
        to: endIdx + 0.5,
        color: index % 2 === 0 ? HIGHCHARTS_COLORS.background : "transparent",
        label: {
          text: `<div style="display: flex; flex-direction: column; align-items: flex-start;">
            <span style="font-size: 12px; font-weight: 500; color: ${HIGHCHARTS_COLORS.text};">${block.month}</span>
            ${totalUsageHtml}
          </div>`,
          useHTML: true,
          style: {
            color: HIGHCHARTS_COLORS.text,
            fontSize: "12px",
            fontWeight: "500",
          },
          align: "left" as const,
          verticalAlign: "top" as const,
          x: 8,
          y: 8,
        },
      };
    });
  }

  // Monthly view: alternating backgrounds every other month
  if (viewMode === "month") {
    const bands: PlotBand[] = [];
    for (let i = 0; i < chartData.length; i++) {
      if (i % 2 === 0) {
        bands.push({
          from: i - 0.5,
          to: i + 0.5,
          color: HIGHCHARTS_COLORS.background,
        });
      }
    }
    return bands;
  }

  return [];
}

// Create X-axis plotBands for the sticky x-axis (mirrors main chart plotBands)
export function createXAxisPlotBands(
  chartData: ChartData[],
  weekBlocks: WeekBlock[],
  monthBlocks: MonthBlock[],
  viewMode: ViewMode
): PlotBand[] {
  // Use same logic as main chart for consistency
  return createPlotBands(chartData, weekBlocks, monthBlocks, viewMode).map((band) => ({
    ...band,
    // Remove labels for x-axis bands
    label: undefined,
  }));
}

// Get bar slot width for x-axis tick background calculation
export function getBarSlotWidth(dynamicBarSize: number): number {
  const barWidth = Math.max(dynamicBarSize, BAR_SIZING.MIN_VERTICAL_BAR_WIDTH);
  return barWidth + BAR_SIZING.BAR_SPACING;
}
