import * as React from "react";
import { CHART_CONFIG } from "./constants";
import type { ChartData, ViewMode, WeekBlock, MonthBlock } from "./types";

interface StickyYAxisProps {
  data: ChartData[];
  chartHeight: number;
  scrollTop: number;
  onScroll: (scrollTop: number) => void;
  viewMode: ViewMode;
  weekBlocks: WeekBlock[];
  monthBlocks: MonthBlock[];
}

export const StickyYAxis = React.forwardRef<HTMLDivElement, StickyYAxisProps>(
  ({ data, chartHeight, scrollTop, onScroll, viewMode, weekBlocks, monthBlocks }, ref) => {
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

    // Get background color for a row based on which block it belongs to
    const getRowBackground = (label: string): string => {
      if (viewMode === 'day') {
        const blockIndex = weekBlocks.findIndex(block => 
          block.start === label || block.end === label ||
          (data.findIndex(d => d.label === label) >= data.findIndex(d => d.label === block.start) &&
           data.findIndex(d => d.label === label) <= data.findIndex(d => d.label === block.end))
        );
        if (blockIndex === -1) return "transparent";
        return blockIndex % 2 === 0 ? "#F5F5F5" : "transparent";
      }
      if (viewMode === 'week') {
        const blockIndex = monthBlocks.findIndex(block => 
          block.start === label || block.end === label ||
          (data.findIndex(d => d.label === label) >= data.findIndex(d => d.label === block.start) &&
           data.findIndex(d => d.label === label) <= data.findIndex(d => d.label === block.end))
        );
        if (blockIndex === -1) return "transparent";
        return blockIndex % 2 === 0 ? "#F5F5F5" : "transparent";
      }
      return "transparent";
    };

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
              style={{ 
                height: rowHeight,
                backgroundColor: getRowBackground(item.label)
              }}
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
