import * as React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { motion, AnimatePresence } from "framer-motion";

import {
  HIGHCHARTS_COLORS,
  HIGHCHARTS_ANIMATION,
  initHighchartsOptions,
  calculateResponsiveChartDimensions,
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
  averageUsage: number;
}

export function HighchartsLineChart({
  chartData,
  maxDomainValue,
  isMounted,
  viewMode,
  weekBlocks,
  monthBlocks,
  dynamicBarSize,
  averageUsage,
}: HighchartsLineChartProps) {
  const chartScrollRef = React.useRef<HTMLDivElement>(null);
  const xAxisScrollRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isScrollSyncing = React.useRef(false);
  const mainChartRef = React.useRef<HighchartsReact.RefObject>(null);

  // Track container width for responsive sizing
  const [containerWidth, setContainerWidth] = React.useState(0);

  // Scroll fade indicator states - start at right (newest dates)
  const [canScrollLeft, setCanScrollLeft] = React.useState(true);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Average line collapsed state
  const [isAverageCollapsed, setIsAverageCollapsed] = React.useState(false);

  // Monitor container width with ResizeObserver
  React.useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Subtract Y-axis width (60px) to get usable chart area
        setContainerWidth(entry.contentRect.width - 60);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate responsive chart dimensions
  const { chartWidth, barWidth, barSpacing } = React.useMemo(
    () => calculateResponsiveChartDimensions(chartData.length, containerWidth, dynamicBarSize),
    [chartData.length, containerWidth, dynamicBarSize]
  );

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
      visible: true,
      labels: { enabled: false },
      lineWidth: 0,
      tickWidth: 0,
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
      // PlotLine is rendered separately as animated overlay for smooth retract/extend animation
      plotLines: [],
    },
    plotOptions: {
      area: {
        animation: { duration: HIGHCHARTS_ANIMATION.duration },
        marker: {
          enabled: true,
          enabledThreshold: 0, // Always show markers regardless of data point count
          symbol: "circle",
          radius: 4,
          lineWidth: 2,
          lineColor: "white",
          states: {
            normal: {
              opacity: 1, // Force markers visible in normal state
            } as Highcharts.PointStatesNormalOptionsObject & { opacity: number },
            hover: {
              enabled: true,
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
          enabled: true,
          enabledThreshold: 0,
          symbol: "circle",
          radius: 4,
          lineWidth: 2,
          lineColor: "white",
          fillColor: HIGHCHARTS_COLORS.usage,
          states: {
            normal: {
              opacity: 1, // Force markers visible in normal state
            } as Highcharts.PointStatesNormalOptionsObject & { opacity: number },
          },
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
                enabled: true,
                enabledThreshold: 0,
                symbol: "circle",
                radius: 4,
                lineWidth: 2,
                lineColor: "white",
                fillColor: HIGHCHARTS_COLORS.overUsage,
                states: {
                  normal: {
                    opacity: 1, // Force markers visible in normal state
                  } as Highcharts.PointStatesNormalOptionsObject & { opacity: number },
                },
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

  // Calculate ACTUAL Highcharts slot width - must match exactly what Highcharts uses
  // Highcharts plot width = chartWidth - marginRight, then divided by category count
  const highchartsPlotWidth = chartWidth - CHART_CONFIG.RIGHT_MARGIN;
  const barSlotWidth = chartData.length > 0 ? highchartsPlotWidth / chartData.length : barWidth + barSpacing;

  // Y-axis labels (rendered manually for sticky positioning)
  // Line chart uses marginTop: 24 in Highcharts, which shifts the plot area down.
  // We must account for this in our manual label positioning.
  const CHART_MARGIN_TOP = 24; // Must match mainChartOptions.chart.marginTop
  const Y_AXIS_TOP_PADDING = 2; // Prevent top label from being cut off
  
  // Calculate total available height for labels (excluding the top padding applied to container)
  // The plot area starts at CHART_MARGIN_TOP within Highcharts, so labels need the same offset
  const yAxisLabels = ticks.map((tick) => {
    const isZero = tick === 0;
    // Position as percentage of plot height (0% = top of plot area at max value, 100% = bottom at 0)
    const positionPercent = ((maxDomainValue - tick) / maxDomainValue) * 100;
    // Offset for 0 label to prevent clipping
    const bottomOffset = isZero ? 15 : 0;

    return (
      <div
        key={tick}
        className="absolute right-2 text-right"
        style={{
          // Start from CHART_MARGIN_TOP (where Highcharts plot actually begins), 
          // then apply percentage within the remaining plot height
          top: `calc(${CHART_MARGIN_TOP}px + (100% - ${CHART_MARGIN_TOP}px) * ${positionPercent / 100} - ${bottomOffset}px)`,
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

  // Average usage label for sticky Y-axis
  const averagePositionPercent = ((maxDomainValue - averageUsage) / maxDomainValue) * 100;
  const averageLabel = (
    <div
      className="absolute left-0 z-20 cursor-pointer"
      style={{
        top: `calc(${CHART_MARGIN_TOP}px + (100% - ${CHART_MARGIN_TOP}px) * ${averagePositionPercent / 100})`,
        transform: "translateY(-50%)",
      }}
      onClick={() => setIsAverageCollapsed(!isAverageCollapsed)}
    >
      <motion.div 
        initial={false}
        animate={{
          width: isAverageCollapsed ? 42 : 'auto',
          borderRadius: isAverageCollapsed ? 21 : 6,
        }}
        transition={{
          type: "tween",
          duration: 0.25,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          background: 'rgba(212, 229, 247, 0.50)',
          backdropFilter: 'blur(3px)',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          overflow: 'hidden',
          height: 42,
          padding: '2px 10px',
          minWidth: 42,
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {isAverageCollapsed ? (
            <motion.span
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              style={{
                color: '#1B5087',
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              AVG
            </motion.span>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span style={{
                color: '#1B5087',
                fontSize: 8,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.96px',
                lineHeight: '16px',
                whiteSpace: 'nowrap',
              }}>
                AVERAGE
              </span>
              <span style={{
                color: '#1B5087',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: '16px',
                whiteSpace: 'nowrap',
              }}>
                {formatGBValue(averageUsage)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  if (!isMounted) return null;

  return (
    <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
      {/* Main content row: Fixed Y-Axis + Scrollable Chart */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Fixed Y-Axis - matches bar chart Y-axis styling */}
        <div className="shrink-0 bg-card relative overflow-visible" style={{ width: 60, paddingTop: Y_AXIS_TOP_PADDING }}>
          <div className="relative h-full">
            {yAxisLabels}
            {averageLabel}
          </div>
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
          style={{ paddingTop: Y_AXIS_TOP_PADDING }}
        >
          <div style={{ width: `${Math.max(chartWidth, containerWidth)}px`, height: "100%" }} className="relative">
            <HighchartsReact
              ref={mainChartRef}
              highcharts={Highcharts}
              options={mainChartOptions}
              containerProps={{ style: { height: "100%", width: "100%" } }}
            />
            {/* Animated average line overlay - retracts/extends smoothly */}
            <motion.div
              className="absolute left-0 pointer-events-none"
              style={{
                top: `calc(${CHART_MARGIN_TOP}px + (100% - ${CHART_MARGIN_TOP}px) * ${averagePositionPercent / 100})`,
                height: 2,
                right: CHART_CONFIG.RIGHT_MARGIN,
                transformOrigin: 'left center',
              }}
              initial={false}
              animate={{
                scaleX: isAverageCollapsed ? 0 : 1,
              }}
              transition={{
                type: "tween",
                duration: 0.25,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <svg width="100%" height="2" style={{ display: 'block' }}>
                <line
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  stroke="#58A0D4"
                  strokeWidth="2"
                  strokeDasharray="8,4"
                />
              </svg>
            </motion.div>
            {/* X-axis baseline */}
            <div 
              className="absolute bottom-0 left-0 right-0" 
              style={{ height: 1, backgroundColor: HIGHCHARTS_COLORS.grid }} 
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
              width: `${Math.max(chartWidth, containerWidth)}px`, 
              height: X_AXIS_HEIGHT,
              display: 'grid',
              gridTemplateColumns: `repeat(${chartData.length}, 1fr) ${CHART_CONFIG.RIGHT_MARGIN}px`,
            }}
          >
            {chartData.map((item, index) => (
              <div
                key={item.label}
                style={{
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
