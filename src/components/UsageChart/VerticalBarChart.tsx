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
              margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
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
                radius={[4, 4, 0, 0]}
              >
                <LabelList 
                  dataKey="usage" 
                  position="top" 
                  fill="hsl(var(--muted-foreground))"
                  fontSize={9}
                  fontWeight={600}
                  formatter={(val: number) => val > 10 ? formatGBValue(val) : ''} 
                  offset={4}
                />
              </Bar>
              <Bar 
                dataKey="overUsage" 
                stackId="a" 
                fill="hsl(var(--chart-3))" 
                radius={[4, 4, 0, 0]} 
                animationDuration={ANIMATION_CONFIG.BAR_DURATION}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}