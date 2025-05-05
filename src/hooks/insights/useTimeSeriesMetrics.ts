
import { useMemo } from 'react';

export interface TimeSeriesMetric {
  isIncreasing: boolean;
  percentageChange: number;
  previousPeriodCount: number;
  currentPeriodCount: number;
}

export function useTimeSeriesMetrics(timeSeriesData: Array<{month: string, count: number}>) {
  const metrics = useMemo(() => {
    if (timeSeriesData.length < 2) {
      return {
        isIncreasing: false,
        percentageChange: 0,
        previousPeriodCount: 0,
        currentPeriodCount: 0
      };
    }
    
    // Get the current and previous month data
    const currentMonth = timeSeriesData[timeSeriesData.length - 1];
    const previousMonth = timeSeriesData[timeSeriesData.length - 2];
    
    const currentCount = currentMonth.count;
    const previousCount = previousMonth.count;
    
    // Calculate percentage change
    const percentageChange = previousCount === 0 
      ? 100 // If previous was 0, treat as 100% increase
      : Math.round(((currentCount - previousCount) / previousCount) * 100);
    
    return {
      isIncreasing: currentCount > previousCount,
      percentageChange: Math.abs(percentageChange),
      previousPeriodCount: previousCount,
      currentPeriodCount: currentCount
    };
  }, [timeSeriesData]);
  
  return metrics;
}
