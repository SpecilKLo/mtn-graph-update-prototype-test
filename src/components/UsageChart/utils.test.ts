import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateDailyData,
  generateWeeklyData,
  generateMonthlyData,
  calculateMonthBlocks,
  calculateMaxDomain,
  calculateTotalUsage,
  calculateChartHeight,
  calculateDynamicBarSize,
  exportToCSV,
  formatGBValue,
} from './utils';
import { BAR_SIZE_CONFIG } from './constants';

describe('generateDailyData', () => {
  it('should generate data for all days in a month', () => {
    const january = new Date(2024, 0, 15); // January 2024
    const data = generateDailyData(january);
    
    expect(data.length).toBe(31); // January has 31 days
  });

  it('should generate data for February correctly (non-leap year)', () => {
    const february = new Date(2023, 1, 15); // February 2023
    const data = generateDailyData(february);
    
    expect(data.length).toBe(28);
  });

  it('should generate data for February correctly (leap year)', () => {
    const february = new Date(2024, 1, 15); // February 2024 (leap year)
    const data = generateDailyData(february);
    
    expect(data.length).toBe(29);
  });

  it('should have correct label format (day number)', () => {
    const january = new Date(2024, 0, 1);
    const data = generateDailyData(january);
    
    // Data is reversed, so last day comes first
    expect(data[0].label).toBe('31');
    expect(data[30].label).toBe('1');
  });

  it('should have usage values in valid range', () => {
    const january = new Date(2024, 0, 1);
    const data = generateDailyData(january);
    
    data.forEach(item => {
      expect(item.usage).toBeGreaterThanOrEqual(10);
      expect(item.usage).toBeLessThan(90);
    });
  });

  it('should have date property as Date object', () => {
    const january = new Date(2024, 0, 1);
    const data = generateDailyData(january);
    
    data.forEach(item => {
      expect(item.date).toBeInstanceOf(Date);
    });
  });

  it('should have overUsage as undefined or positive number', () => {
    const january = new Date(2024, 0, 1);
    const data = generateDailyData(january);
    
    data.forEach(item => {
      if (item.overUsage !== undefined) {
        expect(item.overUsage).toBeGreaterThan(0);
      }
    });
  });
});

describe('generateWeeklyData', () => {
  it('should generate weekly data for a date range', () => {
    const from = new Date(2024, 0, 1); // Jan 1
    const to = new Date(2024, 0, 31); // Jan 31
    const data = generateWeeklyData(from, to);
    
    expect(data.length).toBeGreaterThanOrEqual(4);
    expect(data.length).toBeLessThanOrEqual(6);
  });

  it('should include dateRange property', () => {
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 0, 31);
    const data = generateWeeklyData(from, to);
    
    data.forEach(item => {
      expect(item.dateRange).toBeDefined();
      expect(item.dateRange).toContain(' - ');
    });
  });

  it('should have label in "MMM d" format', () => {
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 0, 31);
    const data = generateWeeklyData(from, to);
    
    data.forEach(item => {
      // Label should match pattern like "Jan 1" or "Feb 15"
      expect(item.label).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
    });
  });

  it('should generate reversed data (newest first)', () => {
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 1, 29);
    const data = generateWeeklyData(from, to);
    
    // First item should be later than last item
    expect(data[0].date.getTime()).toBeGreaterThan(data[data.length - 1].date.getTime());
  });
});

describe('generateMonthlyData', () => {
  it('should generate monthly data for a year', () => {
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 11, 31);
    const data = generateMonthlyData(from, to);
    
    expect(data.length).toBe(12);
  });

  it('should have label in "MMM yy" format', () => {
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 5, 30);
    const data = generateMonthlyData(from, to);
    
    data.forEach(item => {
      // Label should match pattern like "Jan 24" or "Dec 23"
      expect(item.label).toMatch(/^[A-Z][a-z]{2} \d{2}$/);
    });
  });

  it('should generate reversed data (newest first)', () => {
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 11, 31);
    const data = generateMonthlyData(from, to);
    
    expect(data[0].date.getTime()).toBeGreaterThan(data[data.length - 1].date.getTime());
  });
});

describe('calculateMonthBlocks', () => {
  it('should group data by month', () => {
    const mockData = [
      { label: 'Jan 29', date: new Date(2024, 0, 29), usage: 100 },
      { label: 'Jan 22', date: new Date(2024, 0, 22), usage: 100 },
      { label: 'Jan 15', date: new Date(2024, 0, 15), usage: 100 },
      { label: 'Jan 8', date: new Date(2024, 0, 8), usage: 100 },
    ];
    
    const blocks = calculateMonthBlocks(mockData);
    
    expect(blocks.length).toBe(1);
    expect(blocks[0].month).toBe('January');
  });

  it('should create separate blocks for different months', () => {
    const mockData = [
      { label: 'Feb 5', date: new Date(2024, 1, 5), usage: 100 },
      { label: 'Jan 29', date: new Date(2024, 0, 29), usage: 100 },
      { label: 'Jan 22', date: new Date(2024, 0, 22), usage: 100 },
    ];
    
    const blocks = calculateMonthBlocks(mockData);
    
    expect(blocks.length).toBe(2);
    expect(blocks[0].month).toBe('February');
    expect(blocks[1].month).toBe('January');
  });

  it('should set correct start and end labels', () => {
    const mockData = [
      { label: 'Jan 29', date: new Date(2024, 0, 29), usage: 100 },
      { label: 'Jan 22', date: new Date(2024, 0, 22), usage: 100 },
      { label: 'Jan 15', date: new Date(2024, 0, 15), usage: 100 },
    ];
    
    const blocks = calculateMonthBlocks(mockData);
    
    expect(blocks[0].start).toBe('Jan 29');
    expect(blocks[0].end).toBe('Jan 15');
  });

  it('should return empty array for empty data', () => {
    const blocks = calculateMonthBlocks([]);
    expect(blocks).toEqual([]);
  });
});

describe('calculateMaxDomain', () => {
  it('should return value at least 100', () => {
    const mockData = [
      { label: '1', date: new Date(), usage: 10 },
    ];
    
    const maxDomain = calculateMaxDomain(mockData);
    
    expect(maxDomain).toBeGreaterThanOrEqual(100);
  });

  it('should include overUsage in calculation', () => {
    const mockData = [
      { label: '1', date: new Date(), usage: 80, overUsage: 20 },
    ];
    
    const maxDomain = calculateMaxDomain(mockData);
    
    // (80 + 20) * 1.1 = 110, rounded up to nearest 50 = 150
    expect(maxDomain).toBe(150);
  });

  it('should round up to nearest 50', () => {
    const mockData = [
      { label: '1', date: new Date(), usage: 120 },
    ];
    
    const maxDomain = calculateMaxDomain(mockData);
    
    // 120 * 1.1 = 132, rounded up to nearest 50 = 150
    expect(maxDomain).toBe(150);
  });

  it('should find max across all data points', () => {
    const mockData = [
      { label: '1', date: new Date(), usage: 50 },
      { label: '2', date: new Date(), usage: 200 },
      { label: '3', date: new Date(), usage: 100 },
    ];
    
    const maxDomain = calculateMaxDomain(mockData);
    
    // 200 * 1.1 = 220, rounded up to nearest 50 = 250
    expect(maxDomain).toBe(250);
  });
});

describe('calculateTotalUsage', () => {
  it('should sum all usage values', () => {
    const mockData = [
      { label: '1', date: new Date(), usage: 100 },
      { label: '2', date: new Date(), usage: 200 },
      { label: '3', date: new Date(), usage: 300 },
    ];
    
    const total = calculateTotalUsage(mockData);
    
    expect(total).toBe(600);
  });

  it('should include overUsage in total', () => {
    const mockData = [
      { label: '1', date: new Date(), usage: 100, overUsage: 20 },
      { label: '2', date: new Date(), usage: 200, overUsage: 30 },
    ];
    
    const total = calculateTotalUsage(mockData);
    
    expect(total).toBe(350); // 100 + 20 + 200 + 30
  });

  it('should handle missing overUsage', () => {
    const mockData = [
      { label: '1', date: new Date(), usage: 100 },
      { label: '2', date: new Date(), usage: 200, overUsage: undefined },
    ];
    
    const total = calculateTotalUsage(mockData);
    
    expect(total).toBe(300);
  });

  it('should return 0 for empty array', () => {
    const total = calculateTotalUsage([]);
    expect(total).toBe(0);
  });
});

describe('calculateChartHeight', () => {
  const { MIN_BAR_HEIGHT, MAX_BAR_HEIGHT, PADDING } = BAR_SIZE_CONFIG;

  it('should return height based on data count', () => {
    const height = calculateChartHeight(10);
    
    expect(height).toBeGreaterThan(PADDING);
    expect(height).toBe(10 * expect.any(Number) + PADDING);
  });

  it('should enforce minimum bar height', () => {
    const height = calculateChartHeight(100);
    
    // With 100 items and min bar height, should be at least 100 * MIN + PADDING
    expect(height).toBeGreaterThanOrEqual(100 * MIN_BAR_HEIGHT + PADDING);
  });

  it('should enforce maximum bar height', () => {
    const height = calculateChartHeight(2);
    
    // With only 2 items, should hit max bar height
    expect(height).toBeLessThanOrEqual(2 * MAX_BAR_HEIGHT + PADDING);
  });

  it('should increase with more data points', () => {
    const height10 = calculateChartHeight(10);
    const height20 = calculateChartHeight(20);
    
    expect(height20).toBeGreaterThan(height10);
  });
});

describe('calculateDynamicBarSize', () => {
  const { MIN_BAR_SIZE, MAX_BAR_SIZE } = BAR_SIZE_CONFIG;

  it('should return bar size within bounds', () => {
    const size = calculateDynamicBarSize(10);
    
    expect(size).toBeGreaterThanOrEqual(MIN_BAR_SIZE);
    expect(size).toBeLessThanOrEqual(MAX_BAR_SIZE);
  });

  it('should return smaller bars for more data', () => {
    const size10 = calculateDynamicBarSize(10);
    const size30 = calculateDynamicBarSize(30);
    
    expect(size30).toBeLessThanOrEqual(size10);
  });

  it('should return integer values', () => {
    const size = calculateDynamicBarSize(15);
    
    expect(Number.isInteger(size)).toBe(true);
  });

  it('should enforce minimum bar size', () => {
    const size = calculateDynamicBarSize(100);
    
    expect(size).toBe(MIN_BAR_SIZE);
  });

  it('should enforce maximum bar size', () => {
    const size = calculateDynamicBarSize(2);
    
    expect(size).toBe(MAX_BAR_SIZE);
  });
});

describe('exportToCSV', () => {
  let mockLink: HTMLAnchorElement;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;
    
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and click download link', () => {
    const mockData = [
      { label: '1', date: new Date(2024, 0, 1), usage: 100 },
    ];
    
    exportToCSV(mockData);
    
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('should set correct filename', () => {
    const mockData = [
      { label: '1', date: new Date(2024, 0, 1), usage: 100 },
    ];
    
    exportToCSV(mockData);
    
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'usage_data.csv');
  });

  it('should include headers in CSV', () => {
    const mockData = [
      { label: '1', date: new Date(2024, 0, 1), usage: 100 },
    ];
    
    exportToCSV(mockData);
    
    const hrefCall = (mockLink.setAttribute as any).mock.calls.find(
      (call: string[]) => call[0] === 'href'
    );
    const csvContent = decodeURIComponent(hrefCall[1].replace('data:text/csv;charset=utf-8,', ''));
    
    expect(csvContent).toContain('Date Label');
    expect(csvContent).toContain('Start Date');
    expect(csvContent).toContain('Usage (GB)');
    expect(csvContent).toContain('Over Usage (GB)');
  });

  it('should include data rows', () => {
    const mockData = [
      { label: '1', date: new Date(2024, 0, 15), usage: 100, overUsage: 20 },
    ];
    
    exportToCSV(mockData);
    
    const hrefCall = (mockLink.setAttribute as any).mock.calls.find(
      (call: string[]) => call[0] === 'href'
    );
    const csvContent = decodeURIComponent(hrefCall[1].replace('data:text/csv;charset=utf-8,', ''));
    
    expect(csvContent).toContain('2024-01-15');
    expect(csvContent).toContain('100');
    expect(csvContent).toContain('20');
  });

  it('should use dateRange if available', () => {
    const mockData = [
      { label: 'Jan 1', date: new Date(2024, 0, 1), dateRange: 'Jan 1 - Jan 7', usage: 100 },
    ];
    
    exportToCSV(mockData);
    
    const hrefCall = (mockLink.setAttribute as any).mock.calls.find(
      (call: string[]) => call[0] === 'href'
    );
    const csvContent = decodeURIComponent(hrefCall[1].replace('data:text/csv;charset=utf-8,', ''));
    
    expect(csvContent).toContain('Jan 1 - Jan 7');
  });

  it('should cleanup link after download', () => {
    const mockData = [
      { label: '1', date: new Date(2024, 0, 1), usage: 100 },
    ];
    
    exportToCSV(mockData);
    
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });
});

describe('formatGBValue', () => {
  it('formats whole numbers without decimals', () => {
    expect(formatGBValue(22)).toBe('22 GB');
    expect(formatGBValue(88)).toBe('88 GB');
    expect(formatGBValue(0)).toBe('0 GB');
  });

  it('formats decimal values with 2 decimal places', () => {
    expect(formatGBValue(22.38)).toBe('22.38 GB');
    expect(formatGBValue(7.5)).toBe('7.50 GB');
    expect(formatGBValue(0.1)).toBe('0.10 GB');
  });

  it('handles .00 values as whole numbers', () => {
    expect(formatGBValue(22.00)).toBe('22 GB');
    expect(formatGBValue(100.00)).toBe('100 GB');
  });
});
