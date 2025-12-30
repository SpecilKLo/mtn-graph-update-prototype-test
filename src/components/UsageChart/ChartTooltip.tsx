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
      <div className="p-3 border border-border rounded-lg shadow-elevation-sm text-sm min-w-[180px] z-50" style={{ backgroundColor: '#3B3B3B' }}>
        <p className="font-semibold mb-2 text-white">{dateLabel}</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-white">Usage:</span>
            <span className="font-semibold" style={{ color: '#58A0D4' }}>{formatGBValue(data.usage)}</span>
          </div>
          {data.overUsage && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-white">Over Usage:</span>
              <span className="font-semibold text-warning">{formatGBValue(data.overUsage)}</span>
            </div>
          )}
          {data.overUsage && (
            <div className="flex items-center justify-between gap-3 mt-1 pt-1 border-t border-white/20">
              <span className="text-white">Total Usage:</span>
              <span className="font-semibold text-white">{formatGBValue(data.usage + data.overUsage)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};
