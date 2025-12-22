import * as React from "react";
import { CHART_CONFIG, BAR_SIZE_CONFIG } from "./constants";
import type { ChartData } from "./types";

interface StickyYAxisProps {
  data: ChartData[];
  dynamicBarSize: number;
  scrollTop: number;
  onScroll: (scrollTop: number) => void;
}

export const StickyYAxis = React.forwardRef<HTMLDivElement, StickyYAxisProps>(
  ({ data, dynamicBarSize, scrollTop, onScroll }, ref) => {
    const internalRef = React.useRef<HTMLDivElement>(null);
    const combinedRef = (node: HTMLDivElement) => {
      internalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    // Calculate row height to match the bar chart
    const barGap = 3;
    const rowHeight = dynamicBarSize + barGap + BAR_SIZE_CONFIG.PADDING;

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
        <div style={{ paddingTop: 10 }}>
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-start pl-4 text-xs text-muted-foreground"
              style={{ height: rowHeight }}
            >
              {item.label}
            </div>
          ))}
          {/* Bottom padding to match chart margin */}
          <div style={{ height: 10 }} />
        </div>
      </div>
    );
  }
);

StickyYAxis.displayName = "StickyYAxis";
