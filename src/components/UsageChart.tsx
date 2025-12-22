import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  LabelList,
} from "recharts";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  getDate,
  endOfWeek,
} from "date-fns";
import { Calendar as CalendarIcon, Download } from "lucide-react";

import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, AnimatedTabsList } from "./ui/tabs";

// Types
type ViewMode = "day" | "week" | "month";

type ChartData = {
  label: string;
  date: Date;
  dateRange?: string;
  usage: number;
  overUsage?: number;
};

// Mock Data Generators
const generateDailyData = (currentMonth: Date): ChartData[] => {
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  return days.map((day) => {
    const usage = Math.floor(Math.random() * 80) + 10;
    const overUsage = Math.random() > 0.9 ? Math.floor(Math.random() * 20) : 0;

    return {
      label: getDate(day).toString(),
      date: day,
      usage,
      overUsage: overUsage > 0 ? overUsage : undefined,
    };
  }).reverse();
};

const generateWeeklyData = (from: Date, to: Date): ChartData[] => {
  const weeks = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 });

  return weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const usage = Math.floor(Math.random() * 400) + 100;
    const overUsage = Math.random() > 0.85 ? Math.floor(Math.random() * 50) : 0;
    
    const isSameMonth = weekStart.getMonth() === weekEnd.getMonth();
    const label = format(weekStart, "MMM d"); 

    return {
      label: label,
      date: weekStart,
      dateRange: `${format(weekStart, "MMM d")} - ${format(weekEnd, isSameMonth ? "d" : "MMM d")}`,
      usage,
      overUsage: overUsage > 0 ? overUsage : undefined,
    };
  }).reverse();
};

const generateMonthlyData = (from: Date, to: Date): ChartData[] => {
  const months = eachMonthOfInterval({ start: from, end: to });

  return months.map((month) => {
    const usage = Math.floor(Math.random() * 800) + 200;
    const overUsage = Math.random() > 0.8 ? Math.floor(Math.random() * 100) : 0;

    return {
      label: format(month, "MMM yy"),
      date: month,
      usage,
      overUsage: overUsage > 0 ? overUsage : undefined,
    };
  }).reverse();
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartData;
    const dateLabel = data.dateRange || format(data.date, "PP");
    
    return (
      <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-elevation-sm text-sm min-w-[180px] z-50">
        <p className="font-semibold mb-2 text-primary">{dateLabel}</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
             <span className="text-muted-foreground">Usage:</span>
             <span className="font-semibold">{data.usage.toFixed(2)} GB</span>
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

export function UsageChart() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("day");
  
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(new Date());
  const [rangePreset, setRangePreset] = React.useState<string>("12months");
  const [customRange, setCustomRange] = React.useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 11),
    to: new Date(),
  });
  
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = React.useState(0);
  const [isMounted, setIsMounted] = React.useState(false);

  const chartData = React.useMemo(() => {
    if (viewMode === "day") {
      return generateDailyData(selectedMonth);
    } else if (viewMode === "week") {
      return generateWeeklyData(customRange.from, customRange.to);
    } else {
      return generateMonthlyData(customRange.from, customRange.to);
    }
  }, [viewMode, selectedMonth, customRange]);

  const totalUsage = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.usage + (curr.overUsage || 0), 0);
  }, [chartData]);

  const maxDomainValue = React.useMemo(() => {
      const maxVal = Math.max(...chartData.map(d => d.usage + (d.overUsage || 0)));
      return Math.max(Math.ceil((maxVal * 1.1) / 50) * 50, 100);
  }, [chartData]);

  const monthBlocks = React.useMemo(() => {
    if (viewMode !== "week") return [];
    
    const blocks: { month: string; start: string; end: string }[] = [];
    let currentBlock: { month: string; start: string; end: string } | null = null;
    
    chartData.forEach((item) => {
        const monthName = format(item.date, "MMMM");
        if (!currentBlock || currentBlock.month !== monthName) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = {
                month: monthName,
                start: item.label,
                end: item.label
            };
        } else {
            currentBlock.end = item.label;
        }
    });
    
    if (currentBlock) blocks.push(currentBlock);
    return blocks;
  }, [chartData, viewMode]);

  React.useEffect(() => {
    setIsMounted(true);
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      const width = el.offsetWidth - el.clientWidth;
      setScrollbarWidth(width);
    }
    
    const resizeObserver = new ResizeObserver(() => {
        if (scrollContainerRef.current) {
            const el = scrollContainerRef.current;
            const width = el.offsetWidth - el.clientWidth;
            setScrollbarWidth(width);
        }
    });

    if (scrollContainerRef.current) {
        resizeObserver.observe(scrollContainerRef.current);
    }

    return () => {
        resizeObserver.disconnect();
    };
  }, [chartData, viewMode]); 

  const handlePresetChange = (value: string) => {
    setRangePreset(value);
    const today = new Date();
    if (value === "12months") {
      setCustomRange({ from: subMonths(today, 11), to: today });
    } else if (value === "6months") {
      setCustomRange({ from: subMonths(today, 5), to: today });
    } else if (value === "ytd") {
      setCustomRange({ from: startOfMonth(new Date(today.getFullYear(), 0, 1)), to: today });
    }
  };

  const handleCustomRangeChange = (type: 'from' | 'to', value: string) => {
     if (!value) return;
     const [year, month] = value.split('-').map(Number);
     const date = new Date(year, month - 1, 1);
     setCustomRange(prev => ({
         ...prev,
         [type]: date
     }));
  };

  const handleMonthChange = (value: string) => {
     const [year, month] = value.split('-').map(Number);
     setSelectedMonth(new Date(year, month - 1, 1));
  };
  
  const handleExportCSV = () => {
    const headers = ["Date Label", "Start Date", "Usage (GB)", "Over Usage (GB)"];
    const rows = chartData.map(d => [
        d.dateRange || d.label,
        format(d.date, "yyyy-MM-dd"),
        d.usage,
        d.overUsage || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "usage_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthOptions = React.useMemo(() => {
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
  }, []);

  const chartHeight = React.useMemo(() => {
     const count = chartData.length;
     const barHeight = 40;
     const padding = 20;
     return Math.max(count * barHeight + padding, 100); 
  }, [chartData.length]);

  const YAxisWidth = 60;
  const ChartRightMargin = 40; 
  const ChartLeftMargin = 0;

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col font-sans">
      <Card className="w-full h-full max-h-[590px] bg-card shadow-elevation-sm border border-border rounded-[14px] overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="h-[72px] shrink-0 flex items-center justify-between px-6 border-b border-border/50 relative z-10 bg-card">
          <div className="flex items-center">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-auto">
                <AnimatedTabsList 
                  activeValue={viewMode}
                  tabs={[
                    { value: "day", label: "Daily View" },
                    { value: "week", label: "Weekly View" },
                    { value: "month", label: "Monthly View" },
                  ]}
                  onTabChange={(v) => setViewMode(v as ViewMode)}
                  className="bg-input-background h-9 p-1 rounded-[8px] gap-1"
                />
            </Tabs>
          </div>

          <div className="flex items-center gap-4">
             {viewMode === "day" ? (
                  <div className="relative">
                     <Select 
                        value={format(selectedMonth, "yyyy-MM")} 
                        onValueChange={handleMonthChange}
                    >
                        <SelectTrigger className="w-[180px] h-[40px] bg-background border border-border rounded-[8px] text-primary font-normal focus:ring-0 focus:ring-offset-0">
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
                  <div className="flex items-center gap-2">
                     <Select value={rangePreset} onValueChange={handlePresetChange}>
                        <SelectTrigger className="w-[160px] h-[40px] bg-background border border-border rounded-[8px] text-primary font-normal focus:ring-0 focus:ring-offset-0">
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
                        <div className="flex items-center gap-2 bg-input-background p-1 rounded-lg border border-border">
                             <input 
                                type="month" 
                                className="bg-transparent border-none text-xs text-foreground focus:ring-0 p-1 w-24 outline-none"
                                value={format(customRange.from, "yyyy-MM")}
                                onChange={(e) => handleCustomRangeChange('from', e.target.value)}
                             />
                             <span className="text-muted-foreground">-</span>
                             <input 
                                type="month" 
                                className="bg-transparent border-none text-xs text-foreground focus:ring-0 p-1 w-24 outline-none"
                                value={format(customRange.to, "yyyy-MM")}
                                onChange={(e) => handleCustomRangeChange('to', e.target.value)}
                             />
                        </div>
                    )}
                  </div>
              )}

             <Button 
                variant="outline" 
                size="icon"
                className="h-[40px] w-[40px] border-border text-muted-foreground hover:bg-input-background hover:text-foreground rounded-[8px]"
                onClick={handleExportCSV}
                title="Export CSV"
             >
                <Download className="h-4 w-4" />
             </Button>
          </div>
        </div>
        
        {/* Main Chart Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col w-full bg-card min-w-0">
            {/* Scrollable Chart (Hidden X-Axis) */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden w-full px-4 scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent min-w-0"
            >
                <div style={{ height: `${chartHeight}px`, width: '100%' }} className="pr-2 min-w-0">
                    {isMounted && (
                        <ResponsiveContainer width="99%" height="100%" debounce={50} minWidth={0}>
                        <BarChart
                            layout="vertical"
                            data={chartData}
                            margin={{ top: 20, right: ChartRightMargin, left: ChartLeftMargin, bottom: 0 }}
                            barGap={0}
                            barSize={14}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="hsl(var(--muted))" strokeOpacity={0.3} />
                            
                            {viewMode === 'week' && monthBlocks.map((block, index) => (
                                <ReferenceArea 
                                    key={`${block.month}-${index}`}
                                    y1={block.start}
                                    y2={block.end}
                                    x1={0}
                                    fill="hsl(var(--muted))"
                                    fillOpacity={index % 2 === 0 ? 0.1 : 0}
                                    strokeOpacity={0}
                                    label={{ 
                                        value: block.month,
                                        position: 'insideTopRight', 
                                        fill: 'hsl(var(--muted-foreground))', 
                                        fontSize: 12,
                                        fontWeight: 500,
                                        offset: 10
                                    }}
                                />
                            ))}

                            <XAxis 
                                type="number"
                                domain={[0, maxDomainValue]}
                                hide 
                            />
                            <YAxis 
                                dataKey="label" 
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                width={YAxisWidth}
                                interval={0}
                            />
                            <Tooltip 
                                content={<CustomTooltip />} 
                                cursor={{ fill: 'hsl(var(--input-background))', opacity: 0.5 }} 
                            />
                            
                            <Bar 
                                dataKey="usage" 
                                stackId="a" 
                                fill="hsl(var(--chart-2))" 
                                radius={[0, 4, 4, 0]} 
                                animationDuration={800}
                            >
                                <LabelList 
                                    dataKey="usage" 
                                    position="insideRight" 
                                    fill="white"
                                    fontSize={11}
                                    fontWeight={700}
                                    formatter={(val: number) => val > 15 ? `${val.toFixed(2)} GB` : ''} 
                                    offset={10}
                                />
                            </Bar>
                            <Bar 
                                dataKey="overUsage" 
                                stackId="a" 
                                fill="hsl(var(--chart-3))" 
                                radius={[0, 4, 4, 0]} 
                                animationDuration={800}
                            >
                                <LabelList 
                                    dataKey="overUsage" 
                                    position="insideRight" 
                                    fill="hsl(var(--foreground))"
                                    fontSize={11}
                                    fontWeight={700}
                                    formatter={(val: number) => val ? `${val} GB` : ''} 
                                    offset={10}
                                />
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Sticky X-Axis Area (Fixed at bottom of chart area) */}
            <div className="h-[40px] bg-[hsl(var(--chart-axis-bg))] w-full shrink-0 border-t border-b border-border/20 z-20 min-w-0">
                <div 
                    className="w-full h-full px-4 min-w-0" 
                    style={{ paddingRight: `${16 + scrollbarWidth}px` }} 
                > 
                   {isMounted && (
                       <ResponsiveContainer width="99%" height="100%" debounce={50} minWidth={0}>
                          <BarChart
                              layout="vertical"
                              data={[{}]} 
                              margin={{ top: 0, right: ChartRightMargin + 8, left: ChartLeftMargin, bottom: 0 }} 
                          >
                               <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="hsl(var(--muted))" strokeOpacity={0.3} />
                               <YAxis 
                                  type="category" 
                                  width={YAxisWidth} 
                                  tick={false} 
                                  axisLine={false} 
                               />
                               <XAxis 
                                  type="number"
                                  domain={[0, maxDomainValue]}
                                  orientation="top"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fill: '#676767', fontSize: 11, fontWeight: 500 }}
                                  tickFormatter={(value) => `${value} GB`}
                               />
                          </BarChart>
                       </ResponsiveContainer>
                   )}
                </div>
            </div>

            {/* Footer - Fixed at Bottom */}
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
                         <span className="text-[16px] font-bold" style={{ color: 'hsl(var(--chart-total-color))' }}>{totalUsage.toFixed(2)} GB</span>
                     </div>
                     <span className="text-[14px] font-semibold text-muted-foreground">UTC-0 Timezone</span>
                </div>
            </div>
        </div>
      </Card>
    </div>
  );
}