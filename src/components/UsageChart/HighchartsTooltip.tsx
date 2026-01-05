import { format } from "date-fns";
import { formatGBValue } from "./utils";
import { HIGHCHARTS_COLORS } from "./highchartsConfig";
import type { ChartData } from "./types";

// Generate tooltip HTML for Highcharts
export function createTooltipFormatter(chartData: ChartData[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (this: any): string {
    const pointIndex = this.point?.index ?? 0;
    const data = chartData[pointIndex];
    
    if (!data) return "";
    
    const dateLabel = data.dateRange || format(data.date, "PP");
    const usage = data.usage;
    const overUsage = data.overUsage || 0;
    
    let html = `
      <div style="
        padding: 12px;
        min-width: 180px;
        background-color: ${HIGHCHARTS_COLORS.tooltipBackground};
        border-radius: 8px;
        font-size: 14px;
      ">
        <p style="
          font-weight: 600;
          margin-bottom: 8px;
          color: white;
        ">${dateLabel}</p>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <span style="color: white;">Usage:</span>
            <span style="font-weight: 600; color: ${HIGHCHARTS_COLORS.usageTooltipValue};">${formatGBValue(usage)}</span>
          </div>
    `;
    
    if (overUsage > 0) {
      html += `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <span style="color: white;">Over Usage:</span>
            <span style="font-weight: 600; color: ${HIGHCHARTS_COLORS.overUsage};">${formatGBValue(overUsage)}</span>
          </div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
          ">
            <span style="color: white;">Total Usage:</span>
            <span style="font-weight: 600; color: white;">${formatGBValue(usage + overUsage)}</span>
          </div>
      `;
    }
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  };
}

// Tooltip configuration for Highcharts
export function getTooltipConfig(chartData: ChartData[]): Highcharts.TooltipOptions {
  return {
    useHTML: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    shadow: false,
    formatter: createTooltipFormatter(chartData),
    outside: false,
  };
}
