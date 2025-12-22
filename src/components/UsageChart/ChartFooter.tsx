interface ChartFooterProps {
  totalUsage: number;
}

export const ChartFooter = ({ totalUsage }: ChartFooterProps) => {
  return (
    <div className="h-[64px] shrink-0 bg-background flex items-center justify-between px-10 relative z-10 border-t border-border/10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-2" />
          <span className="text-[14px] font-semibold text-muted-foreground">Regular Usage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-3" />
          <span className="text-[14px] font-semibold text-muted-foreground">Over Usage</span>
        </div>
      </div>

      <div className="flex items-center gap-12">
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-muted-foreground font-semibold">Total Usage:</span>
          <span className="text-[16px] font-bold" style={{ color: 'hsl(var(--chart-total-color))' }}>
            {totalUsage.toFixed(2)} GB
          </span>
        </div>
        <span className="text-[14px] font-semibold text-muted-foreground">UTC-0 Timezone</span>
      </div>
    </div>
  );
};
