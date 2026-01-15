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

// Monthly allowance in GB (1TB = 1000GB)
const MONTHLY_ALLOWANCE_GB = 1000;
const DAILY_ALLOWANCE_GB = MONTHLY_ALLOWANCE_GB / 30; // ~33.33 GB per day

// Generate daily data for a given month - realistic 1TB monthly scenario
export const generateDailyData = (currentMonth: Date): ChartData[] => {
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  return days.map((day, index) => {
    // Create realistic daily usage pattern (varies between 20-50GB with occasional spikes)
    const baseUsage = DAILY_ALLOWANCE_GB;
    const variance = (Math.random() - 0.5) * 20; // +/- 10GB variance
    const dayOfWeek = day.getDay();
    
    // Weekend boost (higher usage on weekends)
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 8 : 0;
    
    // Occasional high-usage days (streaming, downloads, etc.)
    const isHighUsageDay = Math.random() > 0.85;
    const highUsageBoost = isHighUsageDay ? 15 + Math.random() * 10 : 0;
    
    let usage = Math.max(15, baseUsage + variance + weekendBoost + highUsageBoost);
    usage = Math.round(usage * 100) / 100;
    
    // Calculate if we're over the daily "fair share" allowance
    // Over usage kicks in when daily usage exceeds ~40GB (120% of daily allowance)
    const dailyLimit = DAILY_ALLOWANCE_GB * 1.2;
    let overUsage = 0;
    
    if (usage > dailyLimit) {
      overUsage = Math.round((usage - dailyLimit) * 100) / 100;
      usage = Math.round(dailyLimit * 100) / 100;
    }

    return {
      label: format(day, "EEE d"),
      date: day,
      usage,
      overUsage: overUsage > 0 ? overUsage : undefined,
    };
  });
};

// Generate weekly data for a date range - realistic 1TB monthly scenario
export const generateWeeklyData = (from: Date, to: Date): ChartData[] => {
  const weeks = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 });
  const weeklyAllowance = MONTHLY_ALLOWANCE_GB / 4; // ~250GB per week

  return weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    // Weekly usage varies around 200-280GB
    const baseUsage = weeklyAllowance * (0.8 + Math.random() * 0.4);
    let usage = Math.round(baseUsage * 100) / 100;
    
    // Calculate over usage when exceeding weekly allowance
    let overUsage = 0;
    if (usage > weeklyAllowance) {
      overUsage = Math.round((usage - weeklyAllowance) * 100) / 100;
      usage = Math.round(weeklyAllowance * 100) / 100;
    }
    
    const isSameMonth = weekStart.getMonth() === weekEnd.getMonth();
    const label = format(weekStart, "MMM d"); 

    return {
      label: label,
      date: weekStart,
      dateRange: `${format(weekStart, "MMM d")} - ${format(weekEnd, isSameMonth ? "d" : "MMM d")}`,
      usage,
      overUsage: overUsage > 0 ? overUsage : undefined,
    };
  });
};

// Generate monthly data for a date range - realistic 1TB monthly scenario
export const generateMonthlyData = (from: Date, to: Date): ChartData[] => {
  const months = eachMonthOfInterval({ start: from, end: to });

  return months.map((month) => {
    // Monthly usage varies between 850GB - 1150GB (some months under, some over)
    const baseUsage = MONTHLY_ALLOWANCE_GB * (0.85 + Math.random() * 0.3);
    let usage = Math.round(baseUsage * 100) / 100;
    
    // Calculate over usage when exceeding 1TB
    let overUsage = 0;
    if (usage > MONTHLY_ALLOWANCE_GB) {
      overUsage = Math.round((usage - MONTHLY_ALLOWANCE_GB) * 100) / 100;
      usage = MONTHLY_ALLOWANCE_GB;
    }

    return {
      label: format(month, "MMM yy"),
      date: month,
      usage,
      overUsage: overUsage > 0 ? overUsage : undefined,
    };
  });
};

// Calculate month blocks for weekly view reference areas with total usage
export const calculateMonthBlocks = (chartData: ChartData[]): MonthBlock[] => {
  const blocks: MonthBlock[] = [];
  let currentBlock: MonthBlock | null = null;
  let currentBlockData: ChartData[] = [];
  
  chartData.forEach((item) => {
    const monthName = format(item.date, "MMMM");
    if (!currentBlock || currentBlock.month !== monthName) {
      if (currentBlock) {
        // Calculate total usage for the completed block
        currentBlock.totalUsage = currentBlockData.reduce(
          (acc, d) => acc + d.usage + (d.overUsage || 0), 
          0
        );
        blocks.push(currentBlock);
      }
      currentBlock = {
        month: monthName,
        start: item.label,
        end: item.label
      };
      currentBlockData = [item];
    } else {
      currentBlock.end = item.label;
      currentBlockData.push(item);
    }
  });
  
  if (currentBlock) {
    // Calculate total usage for the last block
    currentBlock.totalUsage = currentBlockData.reduce(
      (acc, d) => acc + d.usage + (d.overUsage || 0), 
      0
    );
    blocks.push(currentBlock);
  }
  return blocks;
};

// Calculate week blocks for daily view reference areas with total usage
export const calculateWeekBlocks = (chartData: ChartData[]): WeekBlock[] => {
  const blocks: WeekBlock[] = [];
  let currentBlock: WeekBlock | null = null;
  let currentBlockData: ChartData[] = [];
  
  chartData.forEach((item) => {
    const weekNumber = getISOWeek(item.date);
    if (!currentBlock || currentBlock.weekNumber !== weekNumber) {
      if (currentBlock) {
        // Calculate total usage for the completed block
        currentBlock.totalUsage = currentBlockData.reduce(
          (acc, d) => acc + d.usage + (d.overUsage || 0), 
          0
        );
        blocks.push(currentBlock);
      }
      currentBlock = {
        weekNumber,
        start: item.label,
        end: item.label
      };
      currentBlockData = [item];
    } else {
      currentBlock.end = item.label;
      currentBlockData.push(item);
    }
  });
  
  if (currentBlock) {
    // Calculate total usage for the last block
    currentBlock.totalUsage = currentBlockData.reduce(
      (acc, d) => acc + d.usage + (d.overUsage || 0), 
      0
    );
    blocks.push(currentBlock);
  }
  return blocks;
};

// Calculate nice tick values for Y-axis with intelligent scaling
// All intervals are multiples of 5 or 10 for clean, round tick values
export const calculateNiceTicks = (maxValue: number, tickCount: number = 5, addBuffer: boolean = true): number[] => {
  if (maxValue <= 0) return [0];
  
  // Only add buffer when processing raw data (first call), not when called with already-calculated max
  const targetMax = addBuffer ? maxValue * 1.1 : maxValue;
  
  // Calculate the ideal interval needed
  const idealInterval = targetMax / (tickCount - 1);
  
  // Predefined nice intervals - all multiples of 5 or 10
  const niceIntervals = [
    5, 10, 15, 20, 25, 50, 75, 100,
    125, 150, 200, 250, 300, 400, 500, 750, 1000,
    1250, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000,
    15000, 20000, 25000, 50000, 75000, 100000
  ];
  
  // Find the smallest nice interval that accommodates the ideal interval
  let niceInterval = niceIntervals[niceIntervals.length - 1];
  for (const interval of niceIntervals) {
    if (interval >= idealInterval) {
      niceInterval = interval;
      break;
    }
  }
  
  // Generate ticks using this nice interval
  const ticks: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    ticks.push(niceInterval * i);
  }
  
  return ticks;
};

// Calculate max domain value for Y axis (returns the last tick from nice ticks)
export const calculateMaxDomain = (chartData: ChartData[]): number => {
  const maxVal = Math.max(...chartData.map(d => d.usage + (d.overUsage || 0)));
  const ticks = calculateNiceTicks(maxVal, 5); // No buffer here - calculateNiceTicks already adds 10%
  return ticks[ticks.length - 1];
};

// Calculate total usage
export const calculateTotalUsage = (chartData: ChartData[]): number => {
  return chartData.reduce((acc, curr) => acc + curr.usage + (curr.overUsage || 0), 0);
};

// Calculate average usage per data point
export const calculateAverageUsage = (chartData: ChartData[]): number => {
  if (chartData.length === 0) return 0;
  const total = chartData.reduce((acc, curr) => acc + curr.usage + (curr.overUsage || 0), 0);
  return total / chartData.length;
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
