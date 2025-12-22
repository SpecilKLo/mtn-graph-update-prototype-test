import { format } from "date-fns";
import type { ChartData } from "./types";
import { formatGBValue } from "./utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartData }>;
}

export const ChartTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateLabel = data.dateRange || format(data.date, "PP");
    
    return (
      <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-elevation-sm text-sm min-w-[180px] z-50">
        <p className="font-semibold mb-2 text-primary">{dateLabel}</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Usage:</span>
            <span className="font-semibold">{formatGBValue(data.usage)}</span>
          </div>
          {data.overUsage && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Over Usage:</span>
              <span className="font-semibold text-accent">{data.overUsage} GB</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};
