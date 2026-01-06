import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ChartFooterProps {
  totalUsage: number;
}

export const ChartFooter = ({ totalUsage }: ChartFooterProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-[64px] shrink-0 bg-background flex flex-col sm:flex-row items-center justify-between px-4 sm:px-10 py-3 sm:py-0 gap-3 sm:gap-0 relative z-10 border-t border-border/10 font-display">
        <div className="flex items-center gap-4 sm:gap-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-default">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-chart-2" />
                <span className="text-[12px] sm:text-[14px] font-semibold text-muted-foreground whitespace-nowrap">
                  Regular Usage
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="m3-tooltip">
              <p>Usage within your plan's included data allowance</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-default">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-chart-3" />
                <span className="text-[12px] sm:text-[14px] font-semibold text-muted-foreground whitespace-nowrap">
                  Over Usage
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="m3-tooltip">
              <p>Additional usage exceeding your plan's data limit</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-4 sm:gap-12">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-default">
                <span className="text-[12px] sm:text-[14px] text-muted-foreground font-semibold whitespace-nowrap">
                  Total Usage:
                </span>
                <span
                  style={{
                    color: "hsl(var(--chart-usage-value))",
                  }}
                  className="text-[14px] sm:text-[16px] font-bold text-primary"
                >
                  {totalUsage.toFixed(2)} GB
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="m3-tooltip">
              <p>Combined regular and over usage for the selected period</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[11px] sm:text-[14px] font-semibold text-muted-foreground hidden sm:inline cursor-default">
                Dates are displayed in UTC
              </span>
            </TooltipTrigger>
            <TooltipContent className="m3-tooltip">
              <p>All timestamps use Coordinated Universal Time (UTC+0)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};
