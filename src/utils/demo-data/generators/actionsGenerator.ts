
import { Action, UserRef } from '@/types/incident';
import { actionDescriptions } from '../dataPools';
import { getRandomItem } from '../randomUtils';

// Generate actions for in progress or closed incidents
export const generateActions = (status: string, date: Date, user: UserRef): Action[] => {
  const actions: Action[] = [];
  
  if (status !== 'Open') {
    actions.push({
      description: getRandomItem(actionDescriptions), 
      responsiblePerson: user.name, 
      date: new Date(date)
    });
    
    if (status === 'Closed' && Math.random() < 0.7) {
      // Add a second action for some closed incidents
      const secondActionDate = new Date(date);
      secondActionDate.setDate(secondActionDate.getDate() + Math.floor(Math.random() * 5) + 1);
      
      actions.push({
        description: getRandomItem(actionDescriptions),
        responsiblePerson: user.name,
        date: secondActionDate
      });
    }
  }
  
  return actions;
};
