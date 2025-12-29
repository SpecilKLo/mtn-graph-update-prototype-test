import {
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { CHART_CONFIG, ANIMATION_CONFIG } from "./constants";

interface StickyXAxisProps {
  maxDomainValue: number;
  scrollbarWidth: number;
  isMounted: boolean;
}

export const StickyXAxis = ({ maxDomainValue, scrollbarWidth, isMounted }: StickyXAxisProps) => {
  const { RIGHT_MARGIN } = CHART_CONFIG;

  return (
    <div className="h-[40px] bg-[hsl(var(--chart-axis-bg))] w-full shrink-0 border-t border-b border-border/20 z-20">
      <div 
        className="w-full h-full pr-4" 
        style={{ paddingRight: `${16 + scrollbarWidth}px` }} 
      > 
        {isMounted && (
          <ResponsiveContainer width="100%" height="100%" debounce={ANIMATION_CONFIG.DEBOUNCE}>
            <BarChart
              layout="vertical"
              data={[{}]} 
              margin={{ top: 0, right: RIGHT_MARGIN + 8, left: 0, bottom: 0 }} 
            >
              <YAxis 
                type="category" 
                width={0} 
                tick={false} 
                axisLine={false} 
              />
              <XAxis 
                type="number"
                domain={[0, maxDomainValue]}
                orientation="top"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#676767', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) => `${value} GB`}
                ticks={[0, Math.round(maxDomainValue / 4), Math.round(maxDomainValue / 2), Math.round(maxDomainValue * 3 / 4), maxDomainValue]}
                padding={{ left: 10 }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
