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
import { MonthReferenceAreas } from "./MonthReferenceAreas";
import { CHART_CONFIG, ANIMATION_CONFIG } from "./constants";
import {
  generateDailyData,
  generateWeeklyData,
  generateMonthlyData,
  calculateMonthBlocks,
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

  // Sync horizontal scroll between chart and X-axis
  const handleChartHScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isHScrollSyncing.current) return;
    isHScrollSyncing.current = true;
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
    if (chartHScrollRef.current) {
      chartHScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    requestAnimationFrame(() => {
      isHScrollSyncing.current = false;
    });
  };

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
          {/* Content row: Fixed Y-Axis + Scrollable Chart */}
          <div className="flex-1 flex flex-row overflow-hidden">
            {/* Fixed Y-Axis - doesn't scroll horizontally */}
            <StickyYAxis
              ref={yAxisRef}
              data={chartData}
              dynamicBarSize={dynamicBarSize}
              scrollTop={syncScrollTop}
              onScroll={handleYAxisScroll}
            />

            {/* Horizontal scroll wrapper for chart */}
            <div 
              ref={chartHScrollRef}
              onScroll={handleChartHScroll}
              className="flex-1 flex flex-col overflow-x-auto min-w-0"
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
                          
                          {viewMode === 'week' && (
                            <MonthReferenceAreas monthBlocks={monthBlocks} maxDomainValue={maxDomainValue} />
                          )}

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

          {/* Sticky X-Axis - spans full width with Y-axis offset */}
          <div className="flex flex-row shrink-0">
            {/* Empty space for Y-axis alignment */}
            <div style={{ width: CHART_CONFIG.Y_AXIS_WIDTH + 16 }} className="shrink-0" />
            {/* X-axis content - scrolls horizontally with chart */}
            <div 
              ref={xAxisHScrollRef}
              onScroll={handleXAxisHScroll}
              className="flex-1 overflow-x-auto overflow-y-hidden min-w-0"
            >
              <div style={{ minWidth: `${CHART_CONFIG.MIN_CHART_WIDTH}px` }}>
                <StickyXAxis 
                  maxDomainValue={maxDomainValue}
                  scrollbarWidth={scrollbarWidth}
                  isMounted={isMounted}
                />
              </div>
            </div>
          </div>

          {/* Footer stays fixed, doesn't scroll horizontally */}
          <ChartFooter totalUsage={totalUsage} />
        </div>
      </Card>
    </div>
  );
}