
import { ActionItem, UserRef } from '@/types/incident';
import { getRandomItem } from '../randomUtils';

// Generate action items
export const generateActionItems = (
  index: number, 
  status: string, 
  date: Date, 
  assignedUser: UserRef, 
  createdByUser: UserRef
): ActionItem[] => {
  if (Math.random() < 0.6 && (status === 'In Progress' || status === 'Closed')) {
    return [{
      id: `action-${index}-1`,
      description: `${getRandomItem([
        'Review and update',
        'Implement new',
        'Conduct training on',
        'Develop protocol for',
        'Assess and improve'
      ])} ${getRandomItem([
        'safety procedures',
        'supervision protocols',
        'equipment maintenance',
        'facility security',
        'staff training',
        'student education'
      ])}`,
      dueDate: new Date(date.getTime() + (Math.floor(Math.random() * 14) + 7) * 86400000), // 7-21 days later
      assignedTo: assignedUser,
      status: status === 'Closed' ? 'Completed' as const : 'In Progress' as const,
      createdBy: createdByUser,
      createdAt: date,
      updatedAt: new Date(date.getTime() + Math.floor(Math.random() * 3) * 86400000) // 0-3 days later
    }];
  }
  return [];
};
