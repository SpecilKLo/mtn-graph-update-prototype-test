import * as React from "react";
import { CHART_CONFIG } from "./constants";
import type { ChartData } from "./types";

interface StickyYAxisProps {
  data: ChartData[];
  chartHeight: number;
  scrollTop: number;
  onScroll: (scrollTop: number) => void;
}

export const StickyYAxis = React.forwardRef<HTMLDivElement, StickyYAxisProps>(
  ({ data, chartHeight, scrollTop, onScroll }, ref) => {
    const internalRef = React.useRef<HTMLDivElement>(null);
    const combinedRef = (node: HTMLDivElement) => {
      internalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    // Chart margin top/bottom from Recharts
    const marginTop = 10;
    const marginBottom = 10;
    
    // Calculate usable chart area (excluding margins)
    const usableHeight = chartHeight - marginTop - marginBottom;
    
    // Each row gets equal height in the usable area
    const rowHeight = usableHeight / data.length;

    // Sync scroll position from parent
    React.useEffect(() => {
      if (internalRef.current && internalRef.current.scrollTop !== scrollTop) {
        internalRef.current.scrollTop = scrollTop;
      }
    }, [scrollTop]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      onScroll(e.currentTarget.scrollTop);
    };

    return (
      <div
        ref={combinedRef}
        onScroll={handleScroll}
        className="overflow-y-auto overflow-x-hidden scrollbar-none"
        style={{ width: CHART_CONFIG.Y_AXIS_WIDTH + 16 }}
      >
        {/* Top padding to match chart margin */}
        <div style={{ paddingTop: marginTop }}>
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-end pr-2 text-xs text-muted-foreground"
              style={{ height: rowHeight }}
            >
              {item.label}
            </div>
          ))}
          {/* Bottom padding to match chart margin */}
          <div style={{ height: marginBottom }} />
        </div>
      </div>
    );
  }
);

StickyYAxis.displayName = "StickyYAxis";
