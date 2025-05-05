
import { getRandomItem } from './randomUtils';
import { UserRef } from '@/types/incident';

// Generate description based on category and subcategory
export const generateDescription = (category: string, subcategory: string, reportedBy: UserRef): string => {
  let description = '';
  
  switch(category) {
    case 'Physical Injury':
      description = `${getRandomItem(['Student', 'Child', 'Individual'])} ${getRandomItem(['suffered', 'sustained', 'experienced', 'reported'])} a ${subcategory} during ${getRandomItem(['class activity', 'recess', 'PE class', 'sports practice', 'lunch break'])}.`;
      break;
    case 'Bullying':
      description = `${getRandomItem(['Report of', 'Incident involving', 'Concern about'])} ${subcategory} ${getRandomItem(['between students', 'reported by teacher', 'witnessed by staff', 'reported by parent'])}.`;
      break;
    case 'Tech Misuse':
      description = `${getRandomItem(['Student', 'Individual'])} caught ${subcategory} in ${getRandomItem(['classroom', 'computer lab', 'library', 'during class'])}.`;
      break;
    case 'Property Damage':
      description = `${subcategory} discovered in ${getRandomItem(['classroom', 'bathroom', 'hallway', 'outdoor area'])}.`;
      break;
    case 'Health Concern':
      description = `${getRandomItem(['Student', 'Staff member', 'Individual'])} ${getRandomItem(['experienced', 'reported', 'showed symptoms of'])} ${subcategory}.`;
      break;
    case 'Security Breach':
      description = `${subcategory} incident ${getRandomItem(['reported', 'discovered', 'identified', 'alerted to staff'])}.`;
      break;
    default:
      description = `${subcategory} incident reported by ${reportedBy.name}.`;
  }
  
  // Add more detail to description
  description += ` ${getRandomItem([
    'Immediate action was taken.',
    'Situation was addressed promptly.',
    'Protocol was followed.',
    'Appropriate measures were implemented.',
    'Staff responded according to procedures.'
  ])}`;
  
  return description;
};
