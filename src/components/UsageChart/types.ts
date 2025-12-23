// View mode types
export type ViewMode = "day" | "week" | "month";

// Chart orientation type
export type ChartOrientation = "horizontal" | "vertical";

// Chart data point structure
export type ChartData = {
  label: string;
  date: Date;
  dateRange?: string;
  usage: number;
  overUsage?: number;
};

// Month block for weekly view reference areas
export type MonthBlock = {
  month: string;
  start: string;
  end: string;
};

// Week block for daily view reference areas
export type WeekBlock = {
  weekNumber: number;
  start: string;
  end: string;
};

// Custom range type
export type DateRange = {
  from: Date;
  to: Date;
};
