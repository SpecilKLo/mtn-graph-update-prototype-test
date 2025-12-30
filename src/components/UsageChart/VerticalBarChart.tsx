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

import { ChartTooltip } from "./ChartTooltip";
import { StickyVerticalYAxis } from "./StickyVerticalYAxis";
import { StickyVerticalXAxis } from "./StickyVerticalXAxis";
import { ANIMATION_CONFIG, CHART_CONFIG } from "./constants";
import { formatGBValue } from "./utils";
import type { ChartData, ViewMode, MonthBlock, WeekBlock } from "./types";

interface VerticalBarChartProps {
  chartData: ChartData[];
  maxDomainValue: number;
  dynamicBarSize: number;
  isMounted: boolean;
  viewMode: ViewMode;
  weekBlocks: WeekBlock[];
  monthBlocks: MonthBlock[];
}

// Custom shape for usage bar - flat top when there's overage, rounded when no overage
const VerticalUsageBarShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  const hasOverage = payload?.overUsage && payload.overUsage > 0;
  const radius = 4;
  
  if (height <= 0) return null;
  
  if (hasOverage) {
    // Flat top when overage stacks on top
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="hsl(var(--chart-2))"
      />
    );
  }
  
  // Rounded top corners when no overage
  return (
    <path
      d={`
        M ${x},${y + height}
        L ${x},${y + radius}
        Q ${x},${y} ${x + radius},${y}
        L ${x + width - radius},${y}
        Q ${x + width},${y} ${x + width},${y + radius}
        L ${x + width},${y + height}
        Z
      `}
      fill="hsl(var(--chart-2))"
    />
  );
};

// Custom label for usage value - white text inside bar at top
const UsageLabel = (props: any) => {
  const { x, y, width, value } = props;
  
  const displayValue = value ?? 0;
  
  return (
    <text
      x={x + width / 2}
      y={y + 16}
      fill={displayValue === 0 ? "hsl(var(--muted-foreground))" : "white"}
      fontSize={11}
      fontWeight={600}
      textAnchor="middle"
    >
      {formatGBValue(displayValue)}
    </text>
  );
};

// Custom label for over usage - warning color inside bar
const OverUsageLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  
  if (!value || value === 0) return null;

  const text = formatGBValue(value);
  const minHeightForInside = 25;
  const isSmall = height < minHeightForInside;

  return (
    <text
      x={x + width / 2}
      y={isSmall ? y - 6 : y + height / 2}
      fill="black"
      fontSize={11}
      fontWeight={700}
      textAnchor="middle"
      dominantBaseline={isSmall ? "auto" : "middle"}
    >
      {text}
    </text>
  );
};

// Minimum bar width to ensure labels fit comfortably
const MIN_VERTICAL_BAR_WIDTH = 75;
const BAR_SPACING = 35;

export function VerticalBarChart({
  chartData,
  maxDomainValue,
  dynamicBarSize,
  isMounted,
  viewMode,
  weekBlocks,
  monthBlocks,
}: VerticalBarChartProps) {
  const chartScrollRef = React.useRef<HTMLDivElement>(null);
  const xAxisScrollRef = React.useRef<HTMLDivElement>(null);
  const isScrollSyncing = React.useRef(false);
  
  // Scroll fade indicator states
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  // Calculate bar size - ensure minimum width for labels
  const barWidth = Math.max(dynamicBarSize, MIN_VERTICAL_BAR_WIDTH);
  
  // Calculate dynamic width based on data count with generous spacing
  const chartWidth = Math.max(chartData.length * (barWidth + BAR_SPACING), 600);

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main content row: Fixed Y-Axis + Scrollable Chart */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Sticky Y-Axis - doesn't scroll horizontally */}
        <StickyVerticalYAxis
          maxDomainValue={maxDomainValue}
          isMounted={isMounted}
        />

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
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: CHART_CONFIG.RIGHT_MARGIN, left: 0, bottom: 5 }}
                  barGap={8}
                  barSize={barWidth}
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
                    cursor={{ fill: 'hsl(var(--input-background))', opacity: 0.5 }} 
                  />
                  
                  <Bar 
                    dataKey="usage" 
                    stackId="a" 
                    fill="hsl(var(--chart-2))" 
                    animationDuration={ANIMATION_CONFIG.BAR_DURATION}
                    shape={VerticalUsageBarShape}
                  >
                    <LabelList 
                      dataKey="usage"
                      content={UsageLabel}
                    />
                  </Bar>
                  <Bar 
                    dataKey="overUsage" 
                    stackId="a" 
                    fill="hsl(var(--chart-3))" 
                    radius={[4, 4, 0, 0]} 
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

      {/* Sticky X-Axis - synced horizontal scroll */}
      <div className="flex flex-row shrink-0 overflow-hidden border-t border-border/20">
        {/* Corner area to align with Y-axis */}
        <div style={{ width: 60 }} className="shrink-0 bg-card" />
        
        {/* Scrollable X-axis */}
        <div 
          ref={xAxisScrollRef}
          onScroll={handleXAxisScroll}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-none"
        >
          <StickyVerticalXAxis
            chartData={chartData}
            chartWidth={chartWidth}
            isMounted={isMounted}
            dynamicBarSize={dynamicBarSize}
          />
        </div>
      </div>
    </div>
  );
}
