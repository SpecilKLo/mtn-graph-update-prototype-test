import * as React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import {
  HIGHCHARTS_COLORS,
  HIGHCHARTS_ANIMATION,
  initHighchartsOptions,
  calculateHighchartsChartWidth,
  calculateHighchartsBarWidth,
} from "./highchartsConfig";
import { createPlotBands, createXAxisPlotBands } from "./highchartsUtils";
import { getTooltipConfig } from "./HighchartsTooltip";
import { CHART_CONFIG } from "./constants";
import { formatGBValue, calculateNiceTicks } from "./utils";
import type { ChartData, ViewMode, WeekBlock, MonthBlock } from "./types";

// Initialize Highcharts options once
initHighchartsOptions();

interface HighchartsBarChartProps {
  chartData: ChartData[];
  maxDomainValue: number;
  dynamicBarSize: number;
  isMounted: boolean;
  viewMode: ViewMode;
  weekBlocks: WeekBlock[];
  monthBlocks: MonthBlock[];
}

export function HighchartsBarChart({
  chartData,
  maxDomainValue,
  dynamicBarSize,
  isMounted,
  viewMode,
  weekBlocks,
  monthBlocks,
}: HighchartsBarChartProps) {
  const chartScrollRef = React.useRef<HTMLDivElement>(null);
  const xAxisScrollRef = React.useRef<HTMLDivElement>(null);
  const isScrollSyncing = React.useRef(false);
  const mainChartRef = React.useRef<HighchartsReact.RefObject>(null);
  const xAxisChartRef = React.useRef<HighchartsReact.RefObject>(null);

  // Scroll fade indicator states - start at right (newest dates)
  const [canScrollLeft, setCanScrollLeft] = React.useState(true);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Calculate bar size - ensure minimum width for labels
  const barWidth = calculateHighchartsBarWidth(dynamicBarSize);

  // Calculate dynamic width based on data count with generous spacing
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

  // Calculate pixel height for a given value
  const getPixelHeight = (value: number) => {
    // Approximate chart height (excluding margins)
    const chartHeight = 300; // This will be refined based on actual container
    return (value / maxDomainValue) * chartHeight;
  };

  // Minimum height (in pixels) for label to fit inside the bar
  const MIN_HEIGHT_FOR_INSIDE_LABEL = 24;

  // Prepare series data - usage bars get flat tops when there's overage (rounded otherwise)
  const usageData = chartData.map((item) => {
    const hasOverage = item.overUsage && item.overUsage > 0;
    return {
      y: item.usage,
      // Rounded top only when NO overage, flat top when overage stacks on top
      borderRadiusTopLeft: hasOverage ? 0 : 4,
      borderRadiusTopRight: hasOverage ? 0 : 4,
      borderRadiusBottomLeft: 0,
      borderRadiusBottomRight: 0,
    };
  });

  // Over usage data with conditional label positioning and rounded top corners
  const overUsageData = chartData.map((item) => {
    const overUsage = item.overUsage || 0;
    const pixelHeight = getPixelHeight(overUsage);
    const labelShouldBeOutside = pixelHeight < MIN_HEIGHT_FOR_INSIDE_LABEL;
    
    return {
      y: overUsage,
      // Over usage bars always have rounded tops and flat bottoms
      borderRadiusTopLeft: 4,
      borderRadiusTopRight: 4,
      borderRadiusBottomLeft: 0,
      borderRadiusBottomRight: 0,
      dataLabels: overUsage > 0 ? {
        enabled: true,
        inside: !labelShouldBeOutside,
        verticalAlign: labelShouldBeOutside ? 'top' : 'middle',
        y: labelShouldBeOutside ? -18 : 0,
        style: {
          color: 'black',
          fontSize: '11px',
          fontWeight: '700',
          textOutline: 'none',
        },
      } : { enabled: false },
    };
  });

  const CHART_MARGIN_TOP = 24;

  // Main chart configuration
  const mainChartOptions: Highcharts.Options = {
    chart: {
      type: "column",
      marginTop: CHART_MARGIN_TOP,
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
    },
    plotOptions: {
      column: {
        stacking: "normal",
        pointWidth: barWidth,
        groupPadding: 0,
        pointPadding: 0,
        borderWidth: 0,
        borderRadius: 0,
        animation: { duration: HIGHCHARTS_ANIMATION.duration },
        // Unified hover: treat both series as one bar for tooltip
        states: {
          hover: {
            brightness: 0.1,
          },
        },
      },
      series: {
        // Make both series share the same hover state
        stickyTracking: false,
      },
    },
    tooltip: {
      ...getTooltipConfig(chartData),
      shared: true, // Show both series in one tooltip
    },
    series: [
      {
        name: "Over Usage",
        type: "column",
        data: overUsageData,
        color: HIGHCHARTS_COLORS.overUsage,
        dataLabels: {
          enabled: true,
          formatter: function () {
            if (!this.y || this.y === 0) return "";
            return formatGBValue(this.y);
          },
        },
      } as Highcharts.SeriesColumnOptions,
      {
        name: "Usage",
        type: "column",
        data: usageData,
        color: HIGHCHARTS_COLORS.usage,
        dataLabels: {
          enabled: true,
          inside: true,
          verticalAlign: "top",
          y: 4,
          formatter: function () {
            return formatGBValue(this.y || 0);
          },
          style: {
            color: "white",
            fontSize: "11px",
            fontWeight: "600",
            textOutline: "none",
          },
        },
      } as Highcharts.SeriesColumnOptions,
    ],
  };

  // X-axis chart configuration (for sticky x-axis)
  const xAxisChartOptions: Highcharts.Options = {
    chart: {
      type: "column",
      height: 32,
      marginTop: 0,
      marginRight: CHART_CONFIG.RIGHT_MARGIN,
      marginLeft: 0,
      marginBottom: 18,
      spacing: [0, 0, 0, 0],
      animation: false,
      backgroundColor: "#FFFFFF",
    },
    xAxis: {
      categories: chartData.map((d) => d.label),
      labels: {
        enabled: true,
        y: 14,
        style: {
          color: HIGHCHARTS_COLORS.text,
          fontSize: "11px",
          fontWeight: "500",
        },
        useHTML: true,
        formatter: function() {
          return `<span style="position: relative; z-index: 10;">${this.value}</span>`;
        },
      },
      lineColor: HIGHCHARTS_COLORS.grid,
      lineWidth: 0,
      tickLength: 0,
      plotBands: createXAxisPlotBands(chartData, weekBlocks, monthBlocks, viewMode),
    },
    yAxis: {
      visible: false,
      min: 0,
      max: 1,
    },
    plotOptions: {
      column: {
        pointWidth: barWidth,
        groupPadding: 0,
        pointPadding: 0,
      },
    },
    tooltip: { enabled: false },
    series: [
      {
        name: "Hidden",
        type: "column",
        data: chartData.map(() => null),
        color: "transparent",
        enableMouseTracking: false,
      },
    ],
  };

  // Y-axis labels (rendered manually for sticky positioning)
  // Chart area starts at CHART_MARGIN_TOP and ends at 100% of container height
  const yAxisLabels = ticks.map((tick) => {
    const isZero = tick === 0;
    const topOffset = isZero ? 15 : 0;
    // Position: margin + (position within chart area as percentage of remaining space)
    const positionPercent = (maxDomainValue - tick) / maxDomainValue;
    
    return (
      <div
        key={tick}
        className="absolute right-2 text-right"
        style={{
          top: `calc(${CHART_MARGIN_TOP}px + ${positionPercent * 100}% - ${positionPercent * CHART_MARGIN_TOP}px - ${topOffset}px)`,
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
        {/* Sticky Y-Axis - doesn't scroll horizontally */}
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

      {/* Sticky X-Axis - synced horizontal scroll */}
      <div className="flex flex-row shrink-0 overflow-hidden">
        {/* Corner area to align with Y-axis */}
        <div style={{ width: 60 }} className="shrink-0 bg-card" />

        {/* Scrollable X-axis */}
        <div
          ref={xAxisScrollRef}
          onScroll={handleXAxisScroll}
          className="flex-1 overflow-x-auto overflow-y-hidden scroll-touch scrollbar-none"
        >
          <div style={{ width: `${chartWidth}px`, height: 32 }} className="pr-4">
            <HighchartsReact
              ref={xAxisChartRef}
              highcharts={Highcharts}
              options={xAxisChartOptions}
              containerProps={{ style: { height: "100%", width: "100%" } }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
