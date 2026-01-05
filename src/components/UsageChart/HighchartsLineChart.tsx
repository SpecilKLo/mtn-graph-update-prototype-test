import * as React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import {
  HIGHCHARTS_COLORS,
  HIGHCHARTS_ANIMATION,
  initHighchartsOptions,
  calculateHighchartsChartWidth,
  calculateHighchartsBarWidth,
  BAR_SIZING,
} from "./highchartsConfig";
import { createPlotBands } from "./highchartsUtils";
import { getTooltipConfig } from "./HighchartsTooltip";
import { CHART_CONFIG } from "./constants";
import { formatGBValue, calculateNiceTicks } from "./utils";
import type { ChartData, ViewMode, WeekBlock, MonthBlock } from "./types";

// Initialize Highcharts options once
initHighchartsOptions();

interface HighchartsLineChartProps {
  chartData: ChartData[];
  maxDomainValue: number;
  isMounted: boolean;
  viewMode: ViewMode;
  weekBlocks: WeekBlock[];
  monthBlocks: MonthBlock[];
  dynamicBarSize: number;
}

export function HighchartsLineChart({
  chartData,
  maxDomainValue,
  isMounted,
  viewMode,
  weekBlocks,
  monthBlocks,
  dynamicBarSize,
}: HighchartsLineChartProps) {
  const chartScrollRef = React.useRef<HTMLDivElement>(null);
  const xAxisScrollRef = React.useRef<HTMLDivElement>(null);
  const isScrollSyncing = React.useRef(false);
  const mainChartRef = React.useRef<HighchartsReact.RefObject>(null);

  // Scroll fade indicator states - start at right (newest dates)
  const [canScrollLeft, setCanScrollLeft] = React.useState(true);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Calculate bar size - ensure minimum width for labels (same as bar chart)
  const barWidth = calculateHighchartsBarWidth(dynamicBarSize);

  // Calculate dynamic width based on data count (same calculation as bar chart)
  const chartWidth = calculateHighchartsChartWidth(chartData.length, barWidth);

  // Get ticks for Y-axis
  const ticks = calculateNiceTicks(maxDomainValue, 5, false);

  // Debounced scroll indicator update to prevent jitter
  const scrollIndicatorTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateScrollIndicators = React.useCallback((element: HTMLElement) => {
    if (scrollIndicatorTimeout.current) {
      clearTimeout(scrollIndicatorTimeout.current);
    }
    scrollIndicatorTimeout.current = setTimeout(() => {
      const { scrollLeft, scrollWidth, clientWidth } = element;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }, 100);
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (scrollIndicatorTimeout.current) {
        clearTimeout(scrollIndicatorTimeout.current);
      }
    };
  }, []);

  // Initialize scroll to rightmost position (most recent dates) on mount and data change
  React.useEffect(() => {
    if (chartScrollRef.current && xAxisScrollRef.current) {
      const scrollContainer = chartScrollRef.current;
      const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;

      // Scroll to the rightmost position (newest dates)
      scrollContainer.scrollLeft = maxScrollLeft;
      xAxisScrollRef.current.scrollLeft = maxScrollLeft;

      // Immediate update on init (not debounced)
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, [chartData]);

  // Sync horizontal scroll between chart and X-axis
  const handleChartScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (isScrollSyncing.current) return;
      isScrollSyncing.current = true;

      const target = e.currentTarget;
      if (xAxisScrollRef.current) {
        xAxisScrollRef.current.scrollLeft = target.scrollLeft;
      }

      updateScrollIndicators(target);

      requestAnimationFrame(() => {
        isScrollSyncing.current = false;
      });
    },
    [updateScrollIndicators]
  );

  const handleXAxisScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (isScrollSyncing.current) return;
      isScrollSyncing.current = true;

      if (chartScrollRef.current) {
        chartScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
        updateScrollIndicators(chartScrollRef.current);
      }

      requestAnimationFrame(() => {
        isScrollSyncing.current = false;
      });
    },
    [updateScrollIndicators]
  );

  // Prepare series data
  const usageData = chartData.map((item) => item.usage);
  const overUsageData = chartData.map((item) => item.overUsage || 0);
  const hasOverUsage = chartData.some((d) => d.overUsage && d.overUsage > 0);

  // Main chart configuration
  const mainChartOptions: Highcharts.Options = {
    chart: {
      type: "area",
      marginTop: 24,
      marginRight: CHART_CONFIG.RIGHT_MARGIN,
      marginLeft: 0,
      marginBottom: 0,
      spacing: [0, 0, 0, 0],
      animation: { duration: HIGHCHARTS_ANIMATION.duration },
    },
    xAxis: {
      categories: chartData.map((d) => d.label),
      visible: false,
      plotBands: createPlotBands(chartData, weekBlocks, monthBlocks, viewMode),
    },
    yAxis: {
      min: 0,
      max: maxDomainValue,
      tickPositions: ticks,
      gridLineColor: HIGHCHARTS_COLORS.grid,
      gridLineDashStyle: "Dash",
      gridLineWidth: 1,
      labels: {
        enabled: false,
      },
      title: {
        text: null,
      },
    },
    plotOptions: {
      area: {
        animation: { duration: HIGHCHARTS_ANIMATION.duration },
        marker: {
          enabled: true,
          symbol: "circle",
          radius: 4,
          lineWidth: 2,
          lineColor: "white",
          states: {
            hover: {
              radius: 6,
            },
          },
        },
        // Unified hover: treat both series as one for tooltip
        stickyTracking: false,
      },
    },
    tooltip: {
      ...getTooltipConfig(chartData),
      shared: true, // Show both series in one tooltip
    },
    series: [
      {
        name: "Usage",
        type: "area",
        data: usageData,
        color: HIGHCHARTS_COLORS.usage,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(27, 80, 135, 0.4)"],
            [1, "rgba(27, 80, 135, 0.05)"],
          ],
        },
        lineWidth: 2,
        marker: {
          fillColor: HIGHCHARTS_COLORS.usage,
        },
      },
      ...(hasOverUsage
        ? [
            {
              name: "Over Usage",
              type: "area" as const,
              data: overUsageData,
              color: HIGHCHARTS_COLORS.overUsage,
              fillColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                  [0, "rgba(235, 178, 32, 0.4)"] as [number, string],
                  [1, "rgba(235, 178, 32, 0.05)"] as [number, string],
                ],
              },
              lineWidth: 2,
              dashStyle: "ShortDash" as const,
              marker: {
                enabled: false,
              },
            },
          ]
        : []),
    ],
  };

  // X-axis rendered manually for proper control over backgrounds and labels (same as bar chart)
  const X_AXIS_HEIGHT = 28;
  
  // Calculate which bars belong to which week for background coloring (same logic as bar chart)
  const getBarBackgroundColor = (index: number): string => {
    if (viewMode === "day") {
      // Find which week block this index belongs to
      if (weekBlocks.length === 0) {
        // No week blocks - use every 7 days
        const weekIndex = Math.floor(index / 7);
        return weekIndex % 2 === 0 ? HIGHCHARTS_COLORS.background : "transparent";
      }
      // Check which week block contains this bar
      for (let i = 0; i < weekBlocks.length; i++) {
        const startIdx = chartData.findIndex((d) => d.label === weekBlocks[i].start);
        const endIdx = chartData.findIndex((d) => d.label === weekBlocks[i].end);
        if (index >= startIdx && index <= endIdx) {
          return i % 2 === 0 ? HIGHCHARTS_COLORS.background : "transparent";
        }
      }
      return "transparent";
    }
    if (viewMode === "week") {
      // Find which month block this index belongs to
      for (let i = 0; i < monthBlocks.length; i++) {
        const startIdx = chartData.findIndex((d) => d.label === monthBlocks[i].start);
        const endIdx = chartData.findIndex((d) => d.label === monthBlocks[i].end);
        if (index >= startIdx && index <= endIdx) {
          return i % 2 === 0 ? HIGHCHARTS_COLORS.background : "transparent";
        }
      }
      return "transparent";
    }
    if (viewMode === "month") {
      return index % 2 === 0 ? HIGHCHARTS_COLORS.background : "transparent";
    }
    return "transparent";
  };

  // Calculate bar slot width for x-axis
  const barSlotWidth = barWidth + BAR_SIZING.BAR_SPACING;

  // Y-axis labels (rendered manually for sticky positioning)
  const yAxisLabels = ticks.map((tick) => {
    const isZero = tick === 0;
    const topOffset = isZero ? 15 : 0;
    const position = ((maxDomainValue - tick) / maxDomainValue) * 100;

    return (
      <div
        key={tick}
        className="absolute right-2 text-right"
        style={{
          top: `calc(24px + ${position}% * 0.92 - ${topOffset}px)`,
          color: HIGHCHARTS_COLORS.text,
          fontSize: "11px",
          fontWeight: 500,
          transform: "translateY(-50%)",
        }}
      >
        {formatGBValue(tick)}
      </div>
    );
  });

  if (!isMounted) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main content row: Fixed Y-Axis + Scrollable Chart */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Fixed Y-Axis - matches bar chart Y-axis styling */}
        <div className="shrink-0 bg-card relative" style={{ width: 60 }}>
          {yAxisLabels}
        </div>

        {/* Left fade indicator */}
        <div
          className={`absolute top-0 bottom-0 z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
          style={{
            left: 60,
            width: 6,
            background: "linear-gradient(to right, rgba(19, 21, 23, 0.1), transparent)",
          }}
        />
        {/* Right fade indicator */}
        <div
          className={`absolute right-0 top-0 bottom-0 z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
          style={{
            width: 6,
            background: "linear-gradient(to left, rgba(19, 21, 23, 0.1), transparent)",
          }}
        />

        {/* Scrollable Chart Area */}
        <div
          ref={chartScrollRef}
          onScroll={handleChartScroll}
          className="flex-1 overflow-x-auto overflow-y-hidden scroll-touch scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent"
        >
          <div style={{ width: `${chartWidth}px`, height: "100%" }} className="pr-4">
            <HighchartsReact
              ref={mainChartRef}
              highcharts={Highcharts}
              options={mainChartOptions}
              containerProps={{ style: { height: "100%", width: "100%" } }}
            />
          </div>
        </div>
      </div>

      {/* Sticky X-Axis - manually rendered for proper background coverage (same as bar chart) */}
      <div className="flex flex-row shrink-0 overflow-hidden">
        {/* Corner area to align with Y-axis */}
        <div style={{ width: 60 }} className="shrink-0 bg-card" />

        {/* Scrollable X-axis with manual labels and backgrounds */}
        <div
          ref={xAxisScrollRef}
          onScroll={handleXAxisScroll}
          className="flex-1 overflow-x-auto overflow-y-hidden scroll-touch scrollbar-none"
        >
          <div 
            style={{ 
              width: `${chartWidth}px`, 
              height: X_AXIS_HEIGHT,
              paddingRight: CHART_CONFIG.RIGHT_MARGIN,
            }} 
            className="flex"
          >
            {chartData.map((item, index) => (
              <div
                key={item.label}
                style={{
                  width: barSlotWidth,
                  height: "100%",
                  backgroundColor: getBarBackgroundColor(index),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    color: HIGHCHARTS_COLORS.text,
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
