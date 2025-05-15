
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
    case 'New':
      return 'bg-red-100 text-red-800';
    case 'In Progress':
    case 'Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'OnHold':
      return 'bg-blue-100 text-blue-800';
    case 'Closed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Maps database status names to display names
 */
export const getStatusDisplayName = (status: string): string => {
  switch(status) {
    case 'Progress':
      return 'In Progress';
    case 'New':
      return 'Open';
    default:
      return status;
  }
};

/**
 * Maps display names to database status names
 */
export const getStatusDatabaseName = (displayName: string): string => {
  switch(displayName) {
    case 'In Progress':
      return 'Progress';
    case 'Open':
      return 'New';
    default:
      return displayName;
  }
};
