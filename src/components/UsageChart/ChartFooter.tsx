interface ChartFooterProps {
  totalUsage: number;
}
export const ChartFooter = ({ totalUsage }: ChartFooterProps) => {
  return (
    <div className="min-h-[64px] shrink-0 bg-background flex flex-col sm:flex-row items-center justify-between px-4 sm:px-10 py-3 sm:py-0 gap-3 sm:gap-0 relative z-10 border-t border-border/10 font-display">
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-chart-2" />
          <span className="text-[12px] sm:text-[14px] font-semibold text-muted-foreground whitespace-nowrap">
            Regular Usage
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-chart-3" />
          <span className="text-[12px] sm:text-[14px] font-semibold text-muted-foreground whitespace-nowrap">
            Over Usage
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-12">
        <div className="flex items-center gap-2">
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
        <span className="text-[11px] sm:text-[14px] font-semibold text-muted-foreground hidden sm:inline">
          Dates are displayed in UTC
        </span>
      </div>
    </div>
  );
};
