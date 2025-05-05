import { Incident } from '@/types/incident';
import { generateSingleIncident } from './generators/singleIncidentGenerator';

// Generate a specific number of incidents with distribution based on the plan
export const generateDemoIncidents = (count: number = 100): Incident[] => {
  const incidents: Incident[] = [];
  
  // Keep track of category counts to ensure proper distribution
  const categoryCountTargets = {
    'Physical Injury': Math.floor(count * 0.25), // 25%
    'Bullying': Math.floor(count * 0.15),        // 15%
    'Tech Misuse': Math.floor(count * 0.20),     // 20%
    'Property Damage': Math.floor(count * 0.15), // 15%
    'Health Concern': Math.floor(count * 0.10),  // 10%
    'Security Breach': Math.floor(count * 0.10), // 10%
    'Other': Math.floor(count * 0.05)            // 5%
  };
  
  // Create a queue of categories based on distribution
  let categoryQueue: string[] = [];
  Object.entries(categoryCountTargets).forEach(([category, targetCount]) => {
    for (let i = 0; i < targetCount; i++) {
      categoryQueue.push(category);
    }
  });
  
  // Shuffle the category queue
  categoryQueue = categoryQueue.sort(() => 0.5 - Math.random());
  
  // Generate the specified number of incidents
  for (let i = 0; i < count; i++) {
    const incident = generateSingleIncident(i, categoryQueue[i] || getRandomItem(Object.keys(categoryCountTargets)));
    incidents.push(incident);
  }
  
  // Sort by date (newest first)
  return incidents.sort((a, b) => b.date.getTime() - a.date.getTime());
};

// Re-export helper functions from randomUtils
import { getRandomItem } from './randomUtils';
