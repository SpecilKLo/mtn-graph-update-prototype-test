import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  LabelList,
} from "recharts";
import { subMonths, startOfMonth } from "date-fns";

import { Card } from "../ui/card";
import { ChartHeader } from "./ChartHeader";
import { ChartFooter } from "./ChartFooter";
import { ChartTooltip } from "./ChartTooltip";
import { StickyXAxis } from "./StickyXAxis";
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
  const [scrollbarWidth, setScrollbarWidth] = React.useState(0);
  const [isMounted, setIsMounted] = React.useState(false);

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

  const { Y_AXIS_WIDTH, RIGHT_MARGIN, LEFT_MARGIN } = CHART_CONFIG;

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col font-sans">
      <Card className="w-full h-full max-h-[590px] bg-card shadow-elevation-sm border border-border rounded-[14px] overflow-hidden flex flex-col relative">
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
        <div className="flex-1 overflow-hidden relative flex flex-col w-full bg-card min-w-0">
          {/* Scrollable Chart */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden w-full px-4 scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent min-w-0"
          >
            <div style={{ minHeight: `${chartHeight}px` }} className="h-full w-full pr-2 min-w-0">
              {isMounted && (
                <ResponsiveContainer width="99%" height="100%" debounce={ANIMATION_CONFIG.DEBOUNCE} minWidth={0}>
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 10, right: RIGHT_MARGIN, left: LEFT_MARGIN, bottom: 10 }}
                    barGap={3}
                    barSize={dynamicBarSize}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#CFCFCF" strokeOpacity={1} />
                    
                    {viewMode === 'week' && monthBlocks.map((block, index) => (
                      <ReferenceArea 
                        key={`${block.month}-${index}`}
                        y1={block.start}
                        y2={block.end}
                        x1={0}
                        fill="hsl(var(--muted))"
                        fillOpacity={index % 2 === 0 ? 0.1 : 0}
                        strokeOpacity={0}
                        label={{ 
                          value: block.month,
                          position: 'insideTopRight', 
                          fill: 'hsl(var(--muted-foreground))', 
                          fontSize: 12,
                          fontWeight: 500,
                          offset: 10
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
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      width={Y_AXIS_WIDTH}
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
                      shape={(props: any) => {
                        const { x, y, width, height, payload } = props;
                        const hasOverUsage = payload?.overUsage && payload.overUsage > 0;
                        const radius = hasOverUsage ? 0 : 4;
                        
                        return (
                          <path
                            d={`M${x},${y} 
                               L${x + width - radius},${y} 
                               Q${x + width},${y} ${x + width},${y + radius}
                               L${x + width},${y + height - radius}
                               Q${x + width},${y + height} ${x + width - radius},${y + height}
                               L${x},${y + height}
                               Z`}
                            fill="hsl(var(--chart-2))"
                          />
                        );
                      }}
                    >
                      <LabelList 
                        dataKey="usage" 
                        position="insideRight" 
                        fill="white"
                        fontSize={11}
                        fontWeight={700}
                        formatter={(val: number) => val > 15 ? `${val.toFixed(2)} GB` : ''} 
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
                        content={(props) => {
                          const { x, y, width, height, value } = props;
                          if (!value || value === 0) return null;
                          
                          const text = `${value} GB`;
                          const minWidthForInside = 45;
                          const isSmall = (width as number) < minWidthForInside;
                          
                          return (
                            <text
                              x={isSmall ? (x as number) + (width as number) + 8 : (x as number) + (width as number) - 10}
                              y={(y as number) + (height as number) / 2}
                              fill={isSmall ? "hsl(var(--chart-3))" : "hsl(var(--foreground))"}
                              fontSize={11}
                              fontWeight={700}
                              textAnchor={isSmall ? "start" : "end"}
                              dominantBaseline="middle"
                            >
                              {text}
                            </text>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Sticky X-Axis */}
          <StickyXAxis 
            maxDomainValue={maxDomainValue}
            scrollbarWidth={scrollbarWidth}
            isMounted={isMounted}
          />

          {/* Footer */}
          <ChartFooter totalUsage={totalUsage} />
        </div>
      </Card>
    </div>
  );
}
