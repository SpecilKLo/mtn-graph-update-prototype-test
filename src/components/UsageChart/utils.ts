import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  getDate,
  endOfWeek,
  getISOWeek,
} from "date-fns";
import type { ChartData, MonthBlock, WeekBlock } from "./types";
import { BAR_SIZE_CONFIG } from "./constants";

// Generate daily data for a given month
export const generateDailyData = (currentMonth: Date): ChartData[] => {
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  return days.map((day) => {
    // 30% chance of decimal value
    const hasDecimal = Math.random() > 0.7;
    const usage = hasDecimal 
      ? Math.round((Math.random() * 80 + 10) * 100) / 100
      : Math.floor(Math.random() * 80) + 10;
    const overUsage = Math.random() > 0.9 
      ? (hasDecimal ? Math.round(Math.random() * 20 * 100) / 100 : Math.floor(Math.random() * 20))
      : 0;

    return {
      label: format(day, "EEE d"),
      date: day,
      usage,
      overUsage: overUsage > 0 ? overUsage : undefined,
    };
  }).reverse();
};

// Generate weekly data for a date range
export const generateWeeklyData = (from: Date, to: Date): ChartData[] => {
  const weeks = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 });

  return weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const hasDecimal = Math.random() > 0.7;
    const usage = hasDecimal
      ? Math.round((Math.random() * 400 + 100) * 100) / 100
      : Math.floor(Math.random() * 400) + 100;
    const overUsage = Math.random() > 0.85 
      ? (hasDecimal ? Math.round(Math.random() * 50 * 100) / 100 : Math.floor(Math.random() * 50))
      : 0;
    
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

// Generate monthly data for a date range
export const generateMonthlyData = (from: Date, to: Date): ChartData[] => {
  const months = eachMonthOfInterval({ start: from, end: to });

  return months.map((month) => {
    const hasDecimal = Math.random() > 0.7;
    const usage = hasDecimal
      ? Math.round((Math.random() * 800 + 200) * 100) / 100
      : Math.floor(Math.random() * 800) + 200;
    const overUsage = Math.random() > 0.8 
      ? (hasDecimal ? Math.round(Math.random() * 100 * 100) / 100 : Math.floor(Math.random() * 100))
      : 0;

    return {
      label: format(month, "MMM yy"),
      date: month,
      usage,
      overUsage: overUsage > 0 ? overUsage : undefined,
    };
  }).reverse();
};

// Calculate month blocks for weekly view reference areas
export const calculateMonthBlocks = (chartData: ChartData[]): MonthBlock[] => {
  const blocks: MonthBlock[] = [];
  let currentBlock: MonthBlock | null = null;
  
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
};

// Calculate week blocks for daily view reference areas
export const calculateWeekBlocks = (chartData: ChartData[]): WeekBlock[] => {
  const blocks: WeekBlock[] = [];
  let currentBlock: WeekBlock | null = null;
  
  chartData.forEach((item) => {
    const weekNumber = getISOWeek(item.date);
    if (!currentBlock || currentBlock.weekNumber !== weekNumber) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        weekNumber,
        start: item.label,
        end: item.label
      };
    } else {
      currentBlock.end = item.label;
    }
  });
  
  if (currentBlock) blocks.push(currentBlock);
  return blocks;
};

// Calculate nice tick values for Y-axis with intelligent scaling
export const calculateNiceTicks = (maxValue: number, tickCount: number = 5): number[] => {
  if (maxValue <= 0) return [0];
  
  // Add 10% buffer to max value for headroom
  const bufferedMax = maxValue * 1.1;
  
  // Calculate the raw interval needed
  const rawInterval = bufferedMax / (tickCount - 1);
  
  // Find the order of magnitude of the interval
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
  
  // Nice interval multipliers (produces round numbers)
  const niceMultipliers = [1, 2, 2.5, 5, 10];
  
  // Find the smallest nice interval that covers the raw interval
  let niceInterval = magnitude * 10;
  for (const multiplier of niceMultipliers) {
    const candidate = magnitude * multiplier;
    if (candidate >= rawInterval) {
      niceInterval = candidate;
      break;
    }
  }
  
  // Generate ticks using the nice interval (all values will be round)
  const ticks: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    ticks.push(niceInterval * i);
  }
  
  return ticks;
};

// Calculate max domain value for Y axis (returns the last tick from nice ticks)
export const calculateMaxDomain = (chartData: ChartData[]): number => {
  const maxVal = Math.max(...chartData.map(d => d.usage + (d.overUsage || 0)));
  const ticks = calculateNiceTicks(maxVal * 1.1, 5);
  return ticks[ticks.length - 1];
};

// Calculate total usage
export const calculateTotalUsage = (chartData: ChartData[]): number => {
  return chartData.reduce((acc, curr) => acc + curr.usage + (curr.overUsage || 0), 0);
};

// Calculate dynamic chart height based on data count
export const calculateChartHeight = (dataCount: number): number => {
  const { 
    ESTIMATED_CONTAINER_HEIGHT, 
    TARGET_FILL_RATIO, 
    MIN_BAR_HEIGHT, 
    MAX_BAR_HEIGHT,
    PADDING 
  } = BAR_SIZE_CONFIG;
  
  const idealBarHeight = (ESTIMATED_CONTAINER_HEIGHT * TARGET_FILL_RATIO) / dataCount;
  const dynamicBarHeight = Math.min(MAX_BAR_HEIGHT, Math.max(MIN_BAR_HEIGHT, idealBarHeight));
  
  return dataCount * dynamicBarHeight + PADDING;
};

// Calculate dynamic bar size based on data count
export const calculateDynamicBarSize = (dataCount: number): number => {
  const { 
    ESTIMATED_CONTAINER_HEIGHT, 
    TARGET_FILL_RATIO, 
    MIN_BAR_SIZE, 
    MAX_BAR_SIZE,
    BAR_SIZE_RATIO 
  } = BAR_SIZE_CONFIG;
  
  const idealSize = (ESTIMATED_CONTAINER_HEIGHT * TARGET_FILL_RATIO) / dataCount * BAR_SIZE_RATIO;
  return Math.round(Math.min(MAX_BAR_SIZE, Math.max(MIN_BAR_SIZE, idealSize)));
};

// Format GB value - show decimals only when needed, convert to TB for values over 999.99 GB
export const formatGBValue = (value: number): string => {
  // Convert to TB if value exceeds 999.99 GB
  if (value > 999.99) {
    const tbValue = value / 1000;
    if (Number.isInteger(tbValue) || tbValue % 1 === 0) {
      return `${Math.round(tbValue)} TB`;
    }
    return `${tbValue.toFixed(2)} TB`;
  }
  
  // Keep as GB for values <= 999.99
  if (Number.isInteger(value) || value % 1 === 0) {
    return `${Math.round(value)} GB`;
  }
  return `${value.toFixed(2)} GB`;
};

// Export CSV from chart data
export const exportToCSV = (chartData: ChartData[]): void => {
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
