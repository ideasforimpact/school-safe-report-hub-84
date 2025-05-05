
import { startOfWeek, startOfMonth, startOfYear, subMonths, subWeeks, isWithinInterval } from 'date-fns';
import { Incident } from '@/types/incident';

export type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  from?: Date;
  to?: Date;
}

/**
 * Filter incidents by date range
 */
export const filterByDateRange = (incidents: Incident[], dateFilter: DateRangeFilter, customRange?: DateRange): Incident[] => {
  const today = new Date();
  
  return incidents.filter(incident => {
    const incidentDate = new Date(incident.date);
    
    switch(dateFilter) {
      case 'today':
        return incidentDate.toDateString() === today.toDateString();
        
      case 'week':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
        return isWithinInterval(incidentDate, { start: weekStart, end: today });
        
      case 'month':
        const monthStart = startOfMonth(today);
        return isWithinInterval(incidentDate, { start: monthStart, end: today });
        
      case 'quarter':
        const quarterStart = subMonths(today, 3);
        return isWithinInterval(incidentDate, { start: quarterStart, end: today });
        
      case 'year':
        const yearStart = startOfYear(today);
        return isWithinInterval(incidentDate, { start: yearStart, end: today });
        
      case 'custom':
        if (customRange?.from && customRange?.to) {
          return isWithinInterval(incidentDate, { start: customRange.from, end: customRange.to });
        }
        return true;
        
      default: // 'all'
        return true;
    }
  });
};
