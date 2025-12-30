import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Bar,
  BarChart,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { ANIMATION_CONFIG, CHART_CONFIG } from "./constants";
import { formatGBValue } from "./utils";
import type { ChartData, ViewMode, WeekBlock, MonthBlock } from "./types";

interface HorizontalLineChartProps {
  chartData: ChartData[];
  maxDomainValue: number;
  isMounted: boolean;
  viewMode: ViewMode;
  weekBlocks: WeekBlock[];
  monthBlocks: MonthBlock[];
  dynamicBarSize: number;
}

// Match the bar sizing from VerticalBarChart
const MIN_VERTICAL_BAR_WIDTH = 75;
const BAR_SPACING = 35;

// Custom dot for line chart
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const hasOverage = payload?.overUsage && payload.overUsage > 0;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={hasOverage ? "hsl(var(--chart-3))" : "hsl(var(--chart-2))"}
      stroke="white"
      strokeWidth={2}
    />
  );
};

// Custom active dot (on hover)
const CustomActiveDot = (props: any) => {
  const { cx, cy, payload } = props;
  const hasOverage = payload?.overUsage && payload.overUsage > 0;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={hasOverage ? "hsl(var(--chart-3))" : "hsl(var(--chart-2))"}
      stroke="white"
      strokeWidth={2}
    />
  );
};

// Custom Y-axis tick to match bar chart styling
interface CustomYAxisTickProps {
  x: number;
  y: number;
  payload: { value: number };
}

function CustomYAxisTick({ x, y, payload }: CustomYAxisTickProps) {
  const isZero = payload.value === 0;
  // Move 0 GB label up by 15px to match bar chart
  const adjustedY = isZero ? y - 15 : y;
  
  return (
    <text
      x={x}
      y={adjustedY}
      fill="hsl(var(--muted-foreground))"
      fontSize={11}
      fontWeight={500}
      textAnchor="end"
      dominantBaseline="middle"
    >
      {formatGBValue(payload.value)}
    </text>
  );
}

// Custom tick component for X-axis with alternating background colors
interface CustomXAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: string; index: number };
  chartData: ChartData[];
  viewMode: ViewMode;
  weekBlocks: WeekBlock[];
  monthBlocks: MonthBlock[];
  barSlotWidth: number;
}

const CustomXAxisTick = ({
  x = 0,
  y = 0,
  payload,
  chartData,
  viewMode,
  weekBlocks,
  monthBlocks,
  barSlotWidth,
}: CustomXAxisTickProps) => {
  if (!payload) return null;

  const { value, index } = payload;

  // Determine if this tick should have a background
  const getBackgroundColor = (): string => {
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

  const bgColor = getBackgroundColor();

  return (
    <g>
      {/* Background rect - positioned to span the full slot width and height */}
      <rect
        x={x - barSlotWidth / 2}
        y={0}
        width={barSlotWidth}
        height={40}
        fill={bgColor}
      />
      {/* Tick label text */}
      <text
        x={x}
        y={y}
        dy={4}
        fill="hsl(var(--muted-foreground))"
        fontSize={11}
        fontWeight={500}
        textAnchor="middle"
      >
        {value}
      </text>
    </g>
  );
};

export function HorizontalLineChart({
  chartData,
  maxDomainValue,
  isMounted,
  viewMode,
  weekBlocks,
  monthBlocks,
  dynamicBarSize,
}: HorizontalLineChartProps) {
  const chartScrollRef = React.useRef<HTMLDivElement>(null);
  const xAxisScrollRef = React.useRef<HTMLDivElement>(null);
  const isScrollSyncing = React.useRef(false);
  
  // Scroll fade indicator states
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  // Calculate bar size - ensure minimum width for labels (same as bar chart)
  const barWidth = Math.max(dynamicBarSize, MIN_VERTICAL_BAR_WIDTH);
  const barSlotWidth = barWidth + BAR_SPACING;
  
  // Calculate dynamic width based on data count (same calculation as bar chart)
  const chartWidth = Math.max(chartData.length * (barWidth + BAR_SPACING), 600);

  // Calculate Y-axis ticks to match bar chart
  const ticks = [0, Math.round(maxDomainValue / 4), Math.round(maxDomainValue / 2), Math.round(maxDomainValue * 3 / 4), maxDomainValue];

  // Update scroll indicator visibility
  const updateScrollIndicators = (element: HTMLElement) => {
    const { scrollLeft, scrollWidth, clientWidth } = element;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Initialize scroll indicators on mount and data change
  React.useEffect(() => {
    if (chartScrollRef.current) {
      updateScrollIndicators(chartScrollRef.current);
    }
  }, [chartData]);

  // Sync horizontal scroll between chart and X-axis
  const handleChartScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollSyncing.current) return;
    isScrollSyncing.current = true;
    updateScrollIndicators(e.currentTarget);
    if (xAxisScrollRef.current) {
      xAxisScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    requestAnimationFrame(() => {
      isScrollSyncing.current = false;
    });
  };

  const handleXAxisScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollSyncing.current) return;
    isScrollSyncing.current = true;
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
      updateScrollIndicators(chartScrollRef.current);
    }
    requestAnimationFrame(() => {
      isScrollSyncing.current = false;
    });
  };

  // Combine usage and overUsage for total line value
  const processedData = chartData.map(item => ({
    ...item,
    total: item.usage + (item.overUsage || 0),
  }));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main content row: Fixed Y-Axis + Scrollable Chart */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Fixed Y-Axis - matches bar chart Y-axis styling */}
        <div style={{ width: 60 }} className="shrink-0 bg-card">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%" debounce={ANIMATION_CONFIG.DEBOUNCE}>
              <LineChart
                data={[]}
                margin={{ top: 24, right: 0, left: 0, bottom: 0 }}
              >
                <YAxis
                  type="number"
                  domain={[0, maxDomainValue]}
                  axisLine={false}
                  tickLine={false}
                  tick={<CustomYAxisTick x={0} y={0} payload={{ value: 0 }} />}
                  width={60}
                  ticks={ticks}
                  orientation="left"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Left fade indicator */}
        <div 
          className={`absolute top-0 bottom-0 z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            left: 60,
            width: 6,
            background: 'linear-gradient(to right, rgba(19, 21, 23, 0.1), transparent)'
          }}
        />
        {/* Right fade indicator */}
        <div 
          className={`absolute right-0 top-0 bottom-0 z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            width: 6, 
            background: 'linear-gradient(to left, rgba(19, 21, 23, 0.1), transparent)' 
          }}
        />

        {/* Scrollable Chart Area */}
        <div 
          ref={chartScrollRef}
          onScroll={handleChartScroll}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent"
        >
          <div style={{ minWidth: `${chartWidth}px`, height: '100%' }} className="pr-4">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" debounce={ANIMATION_CONFIG.DEBOUNCE}>
                <LineChart
                  data={processedData}
                  margin={{ top: 24, right: CHART_CONFIG.RIGHT_MARGIN, left: 0, bottom: 0 }}
                >
                  {/* Reference areas for alternating backgrounds */}
                  {viewMode === 'day' && weekBlocks.map((block, index) => (
                    <ReferenceArea
                      key={`week-${block.weekNumber}-${index}`}
                      x1={block.start}
                      x2={block.end}
                      y1={0}
                      y2={maxDomainValue}
                      fill={index % 2 === 0 ? "#F5F5F5" : "transparent"}
                      fillOpacity={1}
                      strokeOpacity={0}
                      ifOverflow="extendDomain"
                    />
                  ))}
                  
                  {viewMode === 'week' && monthBlocks.map((block, index) => (
                    <ReferenceArea
                      key={`${block.month}-${index}`}
                      x1={block.start}
                      x2={block.end}
                      y1={0}
                      y2={maxDomainValue}
                      fill={index % 2 === 0 ? "#F5F5F5" : "transparent"}
                      fillOpacity={1}
                      strokeOpacity={0}
                      ifOverflow="extendDomain"
                      label={{
                        value: block.month,
                        position: 'insideTopLeft',
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 12,
                        fontWeight: 500,
                        offset: 10,
                      }}
                    />
                  ))}

                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#CFCFCF" strokeOpacity={1} />

                  <XAxis 
                    dataKey="label"
                    type="category"
                    hide
                  />
                  <YAxis 
                    type="number"
                    domain={[0, maxDomainValue]}
                    hide
                  />
                  <Tooltip 
                    content={<ChartTooltip />} 
                    cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }} 
                  />
                  
                  {/* Usage line */}
                  <Line 
                    type="monotone"
                    dataKey="usage"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={<CustomDot />}
                    activeDot={<CustomActiveDot />}
                    animationDuration={ANIMATION_CONFIG.BAR_DURATION}
                  />
                  
                  {/* Over usage line (if any data has overUsage) */}
                  {chartData.some(d => d.overUsage && d.overUsage > 0) && (
                    <Line 
                      type="monotone"
                      dataKey="overUsage"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      animationDuration={ANIMATION_CONFIG.BAR_DURATION}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Sticky X-Axis - synced horizontal scroll (same structure as bar chart) */}
      <div className="flex flex-row shrink-0 overflow-hidden border-t border-border/20">
        {/* Corner area to align with Y-axis */}
        <div style={{ width: 60 }} className="shrink-0 bg-card" />
        
        {/* Scrollable X-axis */}
        <div 
          ref={xAxisScrollRef}
          onScroll={handleXAxisScroll}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-none"
        >
          <div style={{ minWidth: `${chartWidth}px`, height: 40 }} className="pr-4">
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
                    tick={(props) => (
                      <CustomXAxisTick
                        {...props}
                        chartData={chartData}
                        viewMode={viewMode}
                        weekBlocks={weekBlocks}
                        monthBlocks={monthBlocks}
                        barSlotWidth={barSlotWidth}
                      />
                    )}
                    interval={0}
                    height={40}
                  />
                  {/* Invisible bar to force proper alignment with main chart */}
                  <Bar dataKey="usage" fill="transparent" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
