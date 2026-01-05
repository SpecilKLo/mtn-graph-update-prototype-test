import Highcharts from "highcharts";

// Theme colors - matching current CSS variables
export const HIGHCHARTS_COLORS = {
  usage: "#1B5087", // hsl(var(--chart-2)) equivalent
  overUsage: "#EBB220", // hsl(var(--chart-3)) equivalent
  grid: "#CFCFCF",
  background: "#F5F5F5",
  text: "#737373", // muted-foreground equivalent
  tooltipBackground: "#3B3B3B",
  usageTooltipValue: "#58A0D4",
} as const;

// Animation configuration matching existing constants
export const HIGHCHARTS_ANIMATION = {
  duration: 800, // matches ANIMATION_CONFIG.BAR_DURATION
} as const;

// Bar sizing constants - matching existing implementation
export const BAR_SIZING = {
  MIN_VERTICAL_BAR_WIDTH: 75,
  BAR_SPACING: 35,
} as const;

// Initialize Highcharts global options
export function initHighchartsOptions(): void {
  Highcharts.setOptions({
    chart: {
      style: {
        fontFamily: "inherit",
      },
      backgroundColor: "transparent",
      animation: {
        duration: HIGHCHARTS_ANIMATION.duration,
      },
    },
    credits: {
      enabled: false,
    },
    title: {
      text: undefined,
    },
    legend: {
      enabled: false,
    },
    plotOptions: {
      series: {
        animation: {
          duration: HIGHCHARTS_ANIMATION.duration,
        },
      },
    },
  });
}

// Calculate chart width based on data count
export function calculateHighchartsChartWidth(
  dataCount: number,
  barWidth: number
): number {
  return Math.max(
    dataCount * (barWidth + BAR_SIZING.BAR_SPACING),
    600
  );
}

// Calculate bar width (same as existing calculateDynamicBarSize but ensures minimum)
export function calculateHighchartsBarWidth(dynamicBarSize: number): number {
  return Math.max(dynamicBarSize, BAR_SIZING.MIN_VERTICAL_BAR_WIDTH);
}
