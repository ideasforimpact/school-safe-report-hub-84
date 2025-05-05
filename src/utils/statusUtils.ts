
import { IncidentStatus } from '@/contexts/IncidentContext';

/**
 * Returns CSS class for incident status badges
 */
export const getStatusBadgeClass = (status: IncidentStatus, isVoided?: boolean) => {
  if (isVoided) {
    return 'bg-red-100 text-red-800';
  }
  
  switch(status) {
    case 'Open':
      return 'bg-red-100 text-red-800';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'Closed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
