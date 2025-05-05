
import React from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  SignalMedium, 
  SignalLow 
} from 'lucide-react';

/**
 * Returns the appropriate icon component for a given priority level
 * @param priority The priority level (Critical, High, Medium, Low)
 * @returns React component representing the priority icon
 */
export const getPriorityIcon = (priority: string | undefined) => {
  switch(priority) {
    case 'Critical':
      return <AlertOctagon className="h-4 w-4 text-red-600" aria-label="Critical Priority" />;
    case 'High':
      return <AlertTriangle className="h-4 w-4 text-orange-500" aria-label="High Priority" />;
    case 'Medium':
      return <SignalMedium className="h-4 w-4 text-yellow-600" aria-label="Medium Priority" />;
    case 'Low':
      return <SignalLow className="h-4 w-4 text-green-600" aria-label="Low Priority" />;
    default:
      return <SignalMedium className="h-4 w-4 text-yellow-600" aria-label="Medium Priority" />;
  }
};

/**
 * Returns the appropriate color class for a priority level
 * @param priority The priority level (Critical, High, Medium, Low)
 * @returns Tailwind CSS class string for the specified priority
 */
export const getPriorityColorClass = (priority: string | undefined) => {
  switch(priority) {
    case 'Critical':
      return 'text-red-600';
    case 'High':
      return 'text-orange-500';
    case 'Low':
      return 'text-green-600';
    case 'Medium':
    default:
      return 'text-yellow-600';
  }
};
