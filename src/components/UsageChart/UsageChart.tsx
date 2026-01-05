import * as React from "react";
import { subMonths, startOfMonth } from "date-fns";

import { Card } from "../ui/card";
import { ChartHeader } from "./ChartHeader";
import { ChartFooter } from "./ChartFooter";
import { HighchartsBarChart } from "./HighchartsBarChart";
import { HighchartsLineChart } from "./HighchartsLineChart";
import { CHART_CONFIG } from "./constants";
import {
  generateDailyData,
  generateWeeklyData,
  generateMonthlyData,
  calculateMonthBlocks,
  calculateWeekBlocks,
  calculateMaxDomain,
  calculateTotalUsage,
  calculateDynamicBarSize,
  exportToCSV,
} from "./utils";
import type { ViewMode, DateRange, ChartOrientation } from "./types";

export function UsageChart() {
  // View mode state
  const [viewMode, setViewMode] = React.useState<ViewMode>("day");
  const [orientation, setOrientation] = React.useState<ChartOrientation>("vertical");
  
  // Date selection state
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(new Date());
  const [rangePreset, setRangePreset] = React.useState<string>("12months");
  const [customRange, setCustomRange] = React.useState<DateRange>({
    from: subMonths(new Date(), 11),
    to: new Date(),
  });
  
  // UI state
  const [isMounted, setIsMounted] = React.useState(false);

  // Computed chart data based on view mode
  const chartData = React.useMemo(() => {
    if (viewMode === "day") {
      return generateDailyData(selectedMonth);
    } else if (viewMode === "week") {
      return generateWeeklyData(customRange.from, customRange.to);
    } else {
      return generateMonthlyData(customRange.from, customRange.to);
    }
  }, [viewMode, selectedMonth, customRange]);

  // Computed values
  const totalUsage = React.useMemo(() => calculateTotalUsage(chartData), [chartData]);
  const maxDomainValue = React.useMemo(() => calculateMaxDomain(chartData), [chartData]);
  const dynamicBarSize = React.useMemo(() => calculateDynamicBarSize(chartData.length), [chartData.length]);
  
  // Month blocks for weekly view
  const monthBlocks = React.useMemo(() => {
    if (viewMode !== "week") return [];
    return calculateMonthBlocks(chartData);
  }, [chartData, viewMode]);

  // Week blocks for daily view
  const weekBlocks = React.useMemo(() => {
    if (viewMode !== "day") return [];
    return calculateWeekBlocks(chartData);
  }, [chartData, viewMode]);

  // Setup mount state
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Event handlers
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
    setCustomRange(prev => ({ ...prev, [type]: date }));
  };

  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setSelectedMonth(new Date(year, month - 1, 1));
  };

  const handleExport = () => exportToCSV(chartData);

  return (
    <div className="w-full h-full min-h-[500px] sm:min-h-[500px] flex flex-col font-sans">
      <Card className="w-full h-full max-h-none sm:max-h-[590px] bg-card shadow-elevation-sm border border-border rounded-[14px] overflow-hidden flex flex-col relative">
        {/* Header */}
        <ChartHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          rangePreset={rangePreset}
          onPresetChange={handlePresetChange}
          customRange={customRange}
          onCustomRangeChange={handleCustomRangeChange}
          onExport={handleExport}
          orientation={orientation}
          onOrientationChange={setOrientation}
        />
        
        {/* Main Chart Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col w-full bg-card">
          {orientation === 'vertical' ? (
            /* Vertical orientation - Highcharts bar chart */
            <HighchartsBarChart
              chartData={chartData}
              maxDomainValue={maxDomainValue}
              dynamicBarSize={dynamicBarSize}
              isMounted={isMounted}
              viewMode={viewMode}
              weekBlocks={weekBlocks}
              monthBlocks={monthBlocks}
            />
          ) : (
            /* Horizontal orientation - Highcharts line chart */
            <HighchartsLineChart
              chartData={chartData}
              maxDomainValue={maxDomainValue}
              isMounted={isMounted}
              viewMode={viewMode}
              weekBlocks={weekBlocks}
              monthBlocks={monthBlocks}
              dynamicBarSize={dynamicBarSize}
            />
          )}

          {/* Footer stays fixed, doesn't scroll horizontally */}
          <ChartFooter totalUsage={totalUsage} />
        </div>
      </Card>
    </div>
  );
}