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
  Cell,
} from "recharts";

import { ChartTooltip } from "./ChartTooltip";
import { ANIMATION_CONFIG } from "./constants";
import { formatGBValue } from "./utils";
import type { ChartData } from "./types";

interface VerticalBarChartProps {
  chartData: ChartData[];
  maxDomainValue: number;
  dynamicBarSize: number;
  isMounted: boolean;
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

// Custom label component that shows total (usage + overUsage) above the bar
const TotalLabel = (props: any) => {
  const { x, y, width, payload } = props;
  const usage = payload?.usage || 0;
  const overUsage = payload?.overUsage || 0;
  const total = usage + overUsage;
  
  if (total < 5) return null;
  
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill="hsl(var(--muted-foreground))"
      fontSize={10}
      fontWeight={600}
      textAnchor="middle"
    >
      {formatGBValue(total)}
    </text>
  );
};

export function VerticalBarChart({
  chartData,
  maxDomainValue,
  dynamicBarSize,
  isMounted,
}: VerticalBarChartProps) {
  // Calculate dynamic width based on data count
  const chartWidth = Math.max(chartData.length * (dynamicBarSize + 20), 600);

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent">
      <div style={{ minWidth: `${chartWidth}px`, height: '100%' }} className="pr-4">
        {isMounted && (
          <ResponsiveContainer width="100%" height="100%" debounce={ANIMATION_CONFIG.DEBOUNCE}>
            <BarChart
              data={chartData}
              margin={{ top: 30, right: 20, left: 20, bottom: 60 }}
              barGap={3}
              barSize={dynamicBarSize}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#CFCFCF" strokeOpacity={1} />

              <XAxis 
                dataKey="label"
                type="category"
                axisLine={{ stroke: '#CFCFCF' }}
                tickLine={false}
                tick={{ 
                  fill: 'hsl(var(--muted-foreground))', 
                  fontSize: 11,
                  fontWeight: 500 
                }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                type="number"
                domain={[0, maxDomainValue]}
                axisLine={{ stroke: '#CFCFCF' }}
                tickLine={false}
                tick={{ 
                  fill: 'hsl(var(--muted-foreground))', 
                  fontSize: 11,
                  fontWeight: 500 
                }}
                tickFormatter={(value) => formatGBValue(value)}
                width={60}
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
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} />
                ))}
              </Bar>
              <Bar 
                dataKey="overUsage" 
                stackId="a" 
                fill="hsl(var(--chart-3))" 
                radius={[4, 4, 0, 0]} 
                animationDuration={ANIMATION_CONFIG.BAR_DURATION}
              >
                <LabelList 
                  content={TotalLabel}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}