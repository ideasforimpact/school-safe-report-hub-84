
import { IncidentStatus } from '@/types/incident';

/**
 * Returns CSS class for incident status badges
 */
export const getStatusBadgeClass = (status: IncidentStatus, isVoided?: boolean) => {
  if (isVoided) {
    return 'bg-red-100 text-red-800';
  }
  
  switch(status) {
    case 'New': 
      return 'bg-blue-100 text-blue-800';
    case 'Open':
      return 'bg-red-100 text-red-800'; // Open status is red
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'On Hold':
      return 'bg-orange-100 text-orange-800';
    case 'Closed':
      return 'bg-green-100 text-green-800'; // Closed status is green
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
      return 'New';
    case 'OnHold':
      return 'On Hold';
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
    case 'New':
      return 'New';
    case 'On Hold':
      return 'OnHold';
    default:
      return displayName;
  }
};
