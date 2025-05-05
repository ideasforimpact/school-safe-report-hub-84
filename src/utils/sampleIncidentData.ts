
import { Incident } from '@/types/incident';
import { generateDemoIncidents } from './generateDemoIncidents';

// Generate sample incidents for demo purposes
export const generateSampleIncidents = (): Incident[] => {
  // Use our comprehensive demo incident generator to create 100 incidents
  return generateDemoIncidents(100);
};
