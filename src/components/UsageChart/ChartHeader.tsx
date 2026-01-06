import { format, subMonths } from "date-fns";
import { Calendar as CalendarIcon, Download, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, AnimatedTabsList } from "../ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import type { ViewMode, DateRange, ChartOrientation } from "./types";

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
  orientation: ChartOrientation;
  onOrientationChange: (orientation: ChartOrientation) => void;
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
  orientation,
  onOrientationChange,
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
    <TooltipProvider delayDuration={200}>
      <div className="shrink-0 flex flex-col gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 relative z-10 bg-card font-display">
        {/* Top row: Tabs and controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 lg:gap-4">
          <div className="flex items-center justify-center lg:justify-start">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)} className="w-full lg:w-auto">
                    <AnimatedTabsList 
                      activeValue={viewMode}
                      tabs={[
                        { value: "day", label: "Daily View" },
                        { value: "week", label: "Weekly View" },
                        { value: "month", label: "Monthly View" },
                      ]}
                      onTabChange={(v) => onViewModeChange(v as ViewMode)}
                      className="bg-muted h-10 p-1.5 rounded-lg gap-1 w-full lg:w-auto"
                    />
                  </Tabs>
                </div>
              </TooltipTrigger>
              <TooltipContent className="m3-tooltip">
                <p>Switch between daily, weekly, or monthly data views</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-3">
            {viewMode === "day" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select 
                      value={format(selectedMonth, "yyyy-MM")} 
                      onValueChange={onMonthChange}
                    >
                      <SelectTrigger className="w-[200px] h-[40px] bg-background border border-border rounded-lg text-primary font-normal focus:ring-0 focus:ring-offset-0 text-sm">
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
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
                </TooltipTrigger>
                <TooltipContent className="m3-tooltip">
                  <p>Select a month to view daily usage data</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Select value={rangePreset} onValueChange={onPresetChange}>
                        <SelectTrigger className="w-[200px] h-[40px] bg-background border border-border rounded-lg text-primary font-normal focus:ring-0 focus:ring-offset-0 text-sm">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="12months"><span>Last 12 Months</span></SelectItem>
                          <SelectItem value="6months"><span>Last 6 Months</span></SelectItem>
                          <SelectItem value="ytd"><span>Year to Date</span></SelectItem>
                          <SelectItem value="custom"><span>Custom Range</span></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="m3-tooltip">
                    <p>Choose a preset date range or set a custom range</p>
                  </TooltipContent>
                </Tooltip>

                {/* Custom range inputs - only render when custom is selected */}
                {rangePreset === "custom" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 bg-muted px-2 py-1.5 rounded-lg border border-border">
                        <Select 
                          value={format(customRange.from, "yyyy-MM")} 
                          onValueChange={(value) => onCustomRangeChange('from', value)}
                        >
                          <SelectTrigger className="w-[105px] h-7 bg-transparent border-none text-sm text-foreground focus:ring-0 focus:ring-offset-0 px-2">
                            <SelectValue>{format(customRange.from, "MMM yyyy")}</SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {monthOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="hover:bg-secondary/10 cursor-pointer">
                                <span>{format(new Date(opt.value + "-01"), "MMM yyyy")}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <span className="text-muted-foreground font-medium">–</span>
                        
                        <Select 
                          value={format(customRange.to, "yyyy-MM")} 
                          onValueChange={(value) => onCustomRangeChange('to', value)}
                        >
                          <SelectTrigger className="w-[105px] h-7 bg-transparent border-none text-sm text-foreground focus:ring-0 focus:ring-offset-0 px-2">
                            <SelectValue>{format(customRange.to, "MMM yyyy")}</SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {monthOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="hover:bg-secondary/10 cursor-pointer">
                                <span>{format(new Date(opt.value + "-01"), "MMM yyyy")}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="m3-tooltip">
                      <p>Set the start and end months for your custom date range</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}

            {/* Orientation toggle - styled toggle with icons */}
            <div className="relative flex items-center bg-white rounded-lg border border-border h-[40px] px-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onOrientationChange('vertical')}
                    className="flex items-center justify-center w-[38px] h-[32px] rounded-md m3-transition"
                    style={{
                      backgroundColor: orientation === 'vertical' ? '#D4E5F7' : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (orientation !== 'vertical') {
                        e.currentTarget.style.backgroundColor = '#EAF2FB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (orientation !== 'vertical') {
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                  >
                    <BarChart3 
                      className={`h-5 w-5 m3-transition ${
                        orientation === 'vertical' ? 'text-primary' : 'text-[#B1B1B1]'
                      }`} 
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="m3-tooltip">
                  <p>Bar chart view</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onOrientationChange('horizontal')}
                    className="flex items-center justify-center w-[38px] h-[32px] rounded-md m3-transition"
                    style={{
                      backgroundColor: orientation === 'horizontal' ? '#D4E5F7' : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (orientation !== 'horizontal') {
                        e.currentTarget.style.backgroundColor = '#EAF2FB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (orientation !== 'horizontal') {
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                  >
                    <TrendingUp 
                      className={`h-5 w-5 m3-transition ${
                        orientation === 'horizontal' ? 'text-primary' : 'text-[#B1B1B1]'
                      }`} 
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="m3-tooltip">
                  <p>Line chart view</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-[40px] w-[40px] border-border text-muted-foreground hover:bg-[#EAF2FB] hover:text-foreground rounded-lg m3-transition"
                  onClick={onExport}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="m3-tooltip">
                <p>Export chart data as CSV file</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
