import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  ReferenceArea,
} from "recharts";
import { subMonths, startOfMonth } from "date-fns";

import { Card } from "../ui/card";
import { ChartHeader } from "./ChartHeader";
import { ChartFooter } from "./ChartFooter";
import { ChartTooltip } from "./ChartTooltip";
import { StickyXAxis } from "./StickyXAxis";
import { StickyYAxis } from "./StickyYAxis";
import { UsageBarShape } from "./UsageBarShape";
import { OverUsageLabel } from "./OverUsageLabel";
import { CHART_CONFIG, ANIMATION_CONFIG } from "./constants";
import {
  generateDailyData,
  generateWeeklyData,
  generateMonthlyData,
  calculateMonthBlocks,
  calculateWeekBlocks,
  calculateMaxDomain,
  calculateTotalUsage,
  calculateChartHeight,
  calculateDynamicBarSize,
  exportToCSV,
  formatGBValue,
} from "./utils";
import type { ViewMode, DateRange } from "./types";

export function UsageChart() {
  // View mode state
  const [viewMode, setViewMode] = React.useState<ViewMode>("day");
  
  // Date selection state
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(new Date());
  const [rangePreset, setRangePreset] = React.useState<string>("12months");
  const [customRange, setCustomRange] = React.useState<DateRange>({
    from: subMonths(new Date(), 11),
    to: new Date(),
  });
  
  // UI state
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const yAxisRef = React.useRef<HTMLDivElement>(null);
  const chartHScrollRef = React.useRef<HTMLDivElement>(null);
  const xAxisHScrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = React.useState(0);
  const [isMounted, setIsMounted] = React.useState(false);
  const [syncScrollTop, setSyncScrollTop] = React.useState(0);
  const isScrollSyncing = React.useRef(false);
  const isHScrollSyncing = React.useRef(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  // Computed chart data based on view mode
  const chartData = React.useMemo(() => {
    if (viewMode === "day") {
      return generateDailyData(selectedMonth);
    } else if (viewMode === "week") {
      return generateWeeklyData(customRange.from, customRange.to);
    } else {
      return generateMonthlyData(customRange.from, customRange.to);
    }
  }, [viewMode, selectedMonth, customRange]);

  // Computed values
  const totalUsage = React.useMemo(() => calculateTotalUsage(chartData), [chartData]);
  const maxDomainValue = React.useMemo(() => calculateMaxDomain(chartData), [chartData]);
  const chartHeight = React.useMemo(() => calculateChartHeight(chartData.length), [chartData.length]);
  const dynamicBarSize = React.useMemo(() => calculateDynamicBarSize(chartData.length), [chartData.length]);
  
  // Month blocks for weekly view
  const monthBlocks = React.useMemo(() => {
    if (viewMode !== "week") return [];
    return calculateMonthBlocks(chartData);
  }, [chartData, viewMode]);

  // Week blocks for daily view
  const weekBlocks = React.useMemo(() => {
    if (viewMode !== "day") return [];
    return calculateWeekBlocks(chartData);
  }, [chartData, viewMode]);

  // Setup scrollbar width observer
  React.useEffect(() => {
    setIsMounted(true);
    
    const updateScrollbarWidth = () => {
      if (scrollContainerRef.current) {
        const el = scrollContainerRef.current;
        setScrollbarWidth(el.offsetWidth - el.clientWidth);
      }
    };

    updateScrollbarWidth();
    
    const resizeObserver = new ResizeObserver(updateScrollbarWidth);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [chartData, viewMode]);

  // Sync vertical scroll between Y-axis and chart
  const handleChartScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollSyncing.current) return;
    isScrollSyncing.current = true;
    setSyncScrollTop(e.currentTarget.scrollTop);
    requestAnimationFrame(() => {
      isScrollSyncing.current = false;
    });
  };

  const handleYAxisScroll = (scrollTop: number) => {
    if (isScrollSyncing.current) return;
    isScrollSyncing.current = true;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollTop;
    }
    setSyncScrollTop(scrollTop);
    requestAnimationFrame(() => {
      isScrollSyncing.current = false;
    });
  };

  // Update scroll indicators
  const updateScrollIndicators = (element: HTMLElement) => {
    const { scrollLeft, scrollWidth, clientWidth } = element;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Sync horizontal scroll between chart and X-axis
  const handleChartHScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isHScrollSyncing.current) return;
    isHScrollSyncing.current = true;
    updateScrollIndicators(e.currentTarget);
    if (xAxisHScrollRef.current) {
      xAxisHScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    requestAnimationFrame(() => {
      isHScrollSyncing.current = false;
    });
  };

  const handleXAxisHScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isHScrollSyncing.current) return;
    isHScrollSyncing.current = true;
    updateScrollIndicators(e.currentTarget);
    if (chartHScrollRef.current) {
      chartHScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    requestAnimationFrame(() => {
      isHScrollSyncing.current = false;
    });
  };

  // Initialize scroll indicators on mount
  React.useEffect(() => {
    if (chartHScrollRef.current) {
      updateScrollIndicators(chartHScrollRef.current);
    }
  }, [isMounted, chartData]);

  // Event handlers
  const handlePresetChange = (value: string) => {
    setRangePreset(value);
    const today = new Date();
    if (value === "12months") {
      setCustomRange({ from: subMonths(today, 11), to: today });
    } else if (value === "6months") {
      setCustomRange({ from: subMonths(today, 5), to: today });
    } else if (value === "ytd") {
      setCustomRange({ from: startOfMonth(new Date(today.getFullYear(), 0, 1)), to: today });
    }
  };

  const handleCustomRangeChange = (type: 'from' | 'to', value: string) => {
    if (!value) return;
    const [year, month] = value.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    setCustomRange(prev => ({ ...prev, [type]: date }));
  };

  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setSelectedMonth(new Date(year, month - 1, 1));
  };

  const handleExport = () => exportToCSV(chartData);

  const { RIGHT_MARGIN, LEFT_MARGIN } = CHART_CONFIG;

  return (
    <div className="w-full h-full min-h-[500px] sm:min-h-[500px] flex flex-col font-sans">
      <Card className="w-full h-full max-h-none sm:max-h-[590px] bg-card shadow-elevation-sm border border-border rounded-[14px] overflow-hidden flex flex-col relative">
        {/* Header */}
        <ChartHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          rangePreset={rangePreset}
          onPresetChange={handlePresetChange}
          customRange={customRange}
          onCustomRangeChange={handleCustomRangeChange}
          onExport={handleExport}
        />
        
        {/* Main Chart Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col w-full bg-card">
          {/* Left fade indicator */}
          <div 
            className={`absolute top-0 bottom-0 z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
            style={{ 
              left: CHART_CONFIG.Y_AXIS_WIDTH + 16,
              width: 6,
              background: 'linear-gradient(to right, rgba(19, 21, 23, 0.5), transparent)'
            }}
          />
          {/* Right fade indicator */}
          <div 
            className={`absolute right-0 top-0 bottom-0 z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
            style={{ width: 6, background: 'linear-gradient(to left, rgba(19, 21, 23, 0.5), transparent)' }}
          />
          {/* Content row: Fixed Y-Axis + Scrollable Chart */}
          <div className="flex-1 flex flex-row overflow-hidden">
            {/* Fixed Y-Axis - doesn't scroll horizontally */}
            <StickyYAxis
              ref={yAxisRef}
              data={chartData}
              chartHeight={chartHeight}
              scrollTop={syncScrollTop}
              onScroll={handleYAxisScroll}
              viewMode={viewMode}
              weekBlocks={weekBlocks}
              monthBlocks={monthBlocks}
            />

            {/* Horizontal scroll wrapper for chart - hidden scrollbar, synced with X-axis */}
            <div 
              ref={chartHScrollRef}
              onScroll={handleChartHScroll}
              className="flex-1 flex flex-col overflow-x-auto min-w-0 scrollbar-none"
            >
              <div style={{ minWidth: `${CHART_CONFIG.MIN_CHART_WIDTH}px` }} className="flex flex-col flex-1 overflow-hidden">
                {/* Scrollable Chart (vertical) */}
                <div 
                  ref={scrollContainerRef}
                  onScroll={handleChartScroll}
                  className="flex-1 overflow-y-auto overflow-x-hidden w-full pr-4 scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent"
                >
                  <div style={{ minHeight: `${chartHeight}px` }} className="h-full w-full pr-2">
                    {isMounted && (
                      <ResponsiveContainer width="99%" height="100%" debounce={ANIMATION_CONFIG.DEBOUNCE}>
                        <BarChart
                          layout="vertical"
                          data={chartData}
                          margin={{ top: 10, right: RIGHT_MARGIN, left: LEFT_MARGIN, bottom: 10 }}
                          barGap={3}
                          barSize={dynamicBarSize}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#CFCFCF" strokeOpacity={1} />
                          
                          {viewMode === 'day' && weekBlocks.map((block, index) => (
                            <ReferenceArea
                              key={`week-${block.weekNumber}-${index}`}
                              y1={block.start}
                              y2={block.end}
                              x1={0}
                              x2={maxDomainValue}
                              fill={index % 2 === 0 ? "#F5F5F5" : "transparent"}
                              fillOpacity={1}
                              strokeOpacity={0}
                              ifOverflow="extendDomain"
                            />
                          ))}
                          
                          {viewMode === 'week' && monthBlocks.map((block, index) => (
                            <ReferenceArea
                              key={`${block.month}-${index}`}
                              y1={block.start}
                              y2={block.end}
                              x1={0}
                              x2={maxDomainValue}
                              fill={index % 2 === 0 ? "#F5F5F5" : "transparent"}
                              fillOpacity={1}
                              strokeOpacity={0}
                              ifOverflow="extendDomain"
                              label={{
                                value: block.month,
                                position: 'insideTopRight',
                                fill: 'hsl(var(--muted-foreground))',
                                fontSize: 12,
                                fontWeight: 500,
                                offset: 10,
                              }}
                            />
                          ))}

                          <XAxis 
                            type="number"
                            domain={[0, maxDomainValue]}
                            hide 
                          />
                          <YAxis 
                            dataKey="label" 
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={false}
                            width={0}
                            interval={0}
                          />
                          <Tooltip 
                            content={<ChartTooltip />} 
                            cursor={{ fill: 'hsl(var(--input-background))', opacity: 0.5 }} 
                          />
                          
                          <Bar 
                            dataKey="usage" 
                            stackId="a" 
                            fill="hsl(var(--chart-2))" 
                            animationDuration={ANIMATION_CONFIG.BAR_DURATION}
                            shape={UsageBarShape}
                          >
                            <LabelList 
                              dataKey="usage" 
                              position="insideRight" 
                              fill="white"
                              fontSize={11}
                              fontWeight={700}
                              formatter={(val: number) => val > 15 ? formatGBValue(val) : ''} 
                              offset={10}
                            />
                          </Bar>
                          <Bar 
                            dataKey="overUsage" 
                            stackId="a" 
                            fill="hsl(var(--chart-3))" 
                            radius={[0, 4, 4, 0]} 
                            animationDuration={ANIMATION_CONFIG.BAR_DURATION}
                          >
                            <LabelList 
                              dataKey="overUsage" 
                              content={OverUsageLabel}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky X-Axis - entire row scrolls together */}
          <div 
            ref={xAxisHScrollRef}
            onScroll={handleXAxisHScroll}
            className="flex flex-row shrink-0 overflow-x-auto overflow-y-hidden scrollbar-none"
          >
            {/* Corner area - same background as X-axis, scrolls with it */}
            <div 
              style={{ width: CHART_CONFIG.Y_AXIS_WIDTH + 16 }} 
              className="shrink-0 h-[40px] bg-[hsl(var(--chart-axis-bg))] border-t border-b border-border/20"
            />
            {/* X-axis content */}
            <div style={{ minWidth: `${CHART_CONFIG.MIN_CHART_WIDTH}px` }} className="flex-1">
              <StickyXAxis 
                maxDomainValue={maxDomainValue}
                scrollbarWidth={scrollbarWidth}
                isMounted={isMounted}
              />
            </div>
          </div>

          {/* Footer stays fixed, doesn't scroll horizontally */}
          <ChartFooter totalUsage={totalUsage} />
        </div>
      </Card>
    </div>
  );
}