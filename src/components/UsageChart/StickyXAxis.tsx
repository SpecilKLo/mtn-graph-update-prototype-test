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
  const { Y_AXIS_WIDTH, RIGHT_MARGIN, LEFT_MARGIN } = CHART_CONFIG;

  return (
    <div className="h-[40px] bg-[hsl(var(--chart-axis-bg))] w-full shrink-0 border-t border-b border-border/20 z-20 min-w-0">
      <div 
        className="w-full h-full px-4 min-w-0" 
        style={{ paddingRight: `${16 + scrollbarWidth}px` }} 
      > 
        {isMounted && (
          <ResponsiveContainer width="99%" height="100%" debounce={ANIMATION_CONFIG.DEBOUNCE} minWidth={0}>
            <BarChart
              layout="vertical"
              data={[{}]} 
              margin={{ top: 0, right: RIGHT_MARGIN + 8, left: LEFT_MARGIN, bottom: 0 }} 
            >
              <YAxis 
                type="category" 
                width={Y_AXIS_WIDTH} 
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
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
