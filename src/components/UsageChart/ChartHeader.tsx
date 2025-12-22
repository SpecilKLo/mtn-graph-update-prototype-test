import { format, subMonths } from "date-fns";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, AnimatedTabsList } from "../ui/tabs";
import type { ViewMode, DateRange } from "./types";

interface ChartHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedMonth: Date;
  onMonthChange: (value: string) => void;
  rangePreset: string;
  onPresetChange: (value: string) => void;
  customRange: DateRange;
  onCustomRangeChange: (type: 'from' | 'to', value: string) => void;
  onExport: () => void;
}

export const ChartHeader = ({
  viewMode,
  onViewModeChange,
  selectedMonth,
  onMonthChange,
  rangePreset,
  onPresetChange,
  customRange,
  onCustomRangeChange,
  onExport,
}: ChartHeaderProps) => {
  // Generate month options for the last 24 months
  const monthOptions = (() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 24; i++) {
      const d = subMonths(today, i);
      options.push({
        value: format(d, "yyyy-MM"),
        label: format(d, "MMMM yyyy")
      });
    }
    return options;
  })();

  return (
    <div className="min-h-[72px] shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 sm:px-6 py-3 sm:py-0 gap-3 sm:gap-0 border-b border-border/50 relative z-10 bg-card">
      <div className="flex items-center justify-center sm:justify-start">
        <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)} className="w-full sm:w-auto">
          <AnimatedTabsList 
            activeValue={viewMode}
            tabs={[
              { value: "day", label: "Daily View" },
              { value: "week", label: "Weekly View" },
              { value: "month", label: "Monthly View" },
            ]}
            onTabChange={(v) => onViewModeChange(v as ViewMode)}
            className="bg-input-background h-9 p-1 rounded-[8px] gap-1 w-full sm:w-auto"
          />
        </Tabs>
      </div>

      <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-4">
        {viewMode === "day" ? (
          <div className="relative flex-1 sm:flex-none">
            <Select 
              value={format(selectedMonth, "yyyy-MM")} 
              onValueChange={onMonthChange}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-[36px] sm:h-[40px] bg-background border border-border rounded-[8px] text-primary font-normal focus:ring-0 focus:ring-offset-0 text-sm">
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue>{format(selectedMonth, "MMMM yyyy")}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="hover:bg-secondary/10 cursor-pointer">
                    <span>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Select value={rangePreset} onValueChange={onPresetChange}>
              <SelectTrigger className="w-full sm:w-[160px] h-[36px] sm:h-[40px] bg-background border border-border rounded-[8px] text-primary font-normal focus:ring-0 focus:ring-offset-0 text-sm">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="12months"><span>Last 12 Months</span></SelectItem>
                <SelectItem value="6months"><span>Last 6 Months</span></SelectItem>
                <SelectItem value="ytd"><span>Year to Date</span></SelectItem>
                <SelectItem value="custom"><span>Custom Range</span></SelectItem>
              </SelectContent>
            </Select>
            
            {rangePreset === "custom" && (
              <div className="hidden sm:flex items-center gap-2 bg-input-background p-1 rounded-lg border border-border">
                <input 
                  type="month" 
                  className="bg-transparent border-none text-xs text-foreground focus:ring-0 p-1 w-24 outline-none"
                  value={format(customRange.from, "yyyy-MM")}
                  onChange={(e) => onCustomRangeChange('from', e.target.value)}
                />
                <span className="text-muted-foreground">-</span>
                <input 
                  type="month" 
                  className="bg-transparent border-none text-xs text-foreground focus:ring-0 p-1 w-24 outline-none"
                  value={format(customRange.to, "yyyy-MM")}
                  onChange={(e) => onCustomRangeChange('to', e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <Button 
          variant="outline" 
          size="icon"
          className="h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] border-border text-muted-foreground hover:bg-input-background hover:text-foreground rounded-[8px] shrink-0"
          onClick={onExport}
          title="Export CSV"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
