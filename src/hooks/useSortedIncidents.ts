
import { useState, useMemo } from 'react';
import { Incident } from '@/contexts/IncidentContext';
import { getSimpleId } from '@/utils/ticketUtils';
import { SortDirection, SortField } from '@/components/incidents/table/IncidentTableHeader';

export function useSortedIncidents(incidents: Incident[]) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Sort incidents
  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      switch (sortField) {
        case 'ticketId':
          return sortDirection === 'asc' 
            ? getSimpleId(a.ticketId).localeCompare(getSimpleId(b.ticketId))
            : getSimpleId(b.ticketId).localeCompare(getSimpleId(a.ticketId));
        case 'date':
          return sortDirection === 'asc'
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'category':
          return sortDirection === 'asc'
            ? a.category.localeCompare(b.category)
            : b.category.localeCompare(a.category);
        case 'priority':
          const priorityOrder = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
          const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
          const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
          return sortDirection === 'asc' ? priorityA - priorityB : priorityB - priorityA;
        case 'facility':
          return sortDirection === 'asc'
            ? (a.facility || '').localeCompare(b.facility || '')
            : (b.facility || '').localeCompare(a.facility || '');
        case 'status':
          return sortDirection === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        default:
          return 0;
      }
    });
  }, [incidents, sortField, sortDirection]);
  
  // Handle column sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  return {
    sortedIncidents,
    sortField,
    sortDirection,
    handleSort
  };
}
