
import { rootCausePatterns } from '../dataPools';
import { getRandomItem } from '../randomUtils';

// Generate root cause for closed incidents
export const generateRootCause = (status: string): string | undefined => {
  if (status === 'Closed') {
    return `${getRandomItem(rootCausePatterns)}. ${getRandomItem([
      'Contributing factors included insufficient monitoring.',
      'Environmental conditions were a factor.',
      'Procedural gaps were identified.',
      'Behavioral factors contributed to the incident.',
      'Training deficiencies were noted as contributing factors.'
    ])}`;
  }
  return undefined;
};
