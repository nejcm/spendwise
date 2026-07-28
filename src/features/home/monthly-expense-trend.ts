export const MONTHLY_TREND_MONTHS = 6;

export function getMonthlyTrendChartGeometry(containerWidth: number, monthCount: number) {
  const chartWidth = Math.max(containerWidth, 1);
  const visibleMonthCount = Math.max(monthCount, 1);
  const columnWidth = chartWidth / visibleMonthCount;
  const barWidth = Math.min(columnWidth, Math.max(1, Math.floor(columnWidth * 0.55)));
  const spacing = (chartWidth - visibleMonthCount * barWidth) / (visibleMonthCount + 1);

  return {
    chartWidth,
    barWidth,
    spacing,
    edgeSpacing: spacing / 2,
  };
}
