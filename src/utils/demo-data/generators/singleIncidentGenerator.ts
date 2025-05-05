
import { Incident, Person, UserRef } from '@/types/incident';
import { 
  studentPool, 
  staffPool, 
  otherPool, 
  userRefs, 
  categoryDefinitions, 
  locations, 
  facilityMappings,
  actionDescriptions, 
  rootCausePatterns 
} from '../dataPools';
import { getRandomItem, generateRandomDate, generateTicketId } from '../randomUtils';
import { generateDescription } from '../descriptionGenerator';
import { generatePeopleInvolved } from './peopleGenerator';
import { generateRootCause } from './rootCauseGenerator';
import { generateActions } from './actionsGenerator';
import { generateActionItems } from './actionItemsGenerator';

// Generate a single incident
export const generateSingleIncident = (index: number, category: string): Incident => {
  // Find the category definition
  const categoryDef = categoryDefinitions.find(def => def.category === category);
  
  // Select subcategory
  const subcategory = categoryDef 
    ? getRandomItem(categoryDef.subcategories) 
    : 'General';
  
  // Generate date
  const date = generateRandomDate();
  const daysAgo = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 3600 * 24));
  
  // Determine status based on age (older incidents more likely to be closed)
  let status: 'Open' | 'In Progress' | 'Closed';
  
  if (daysAgo < 7) {
    // Recent incidents (less than a week)
    const roll = Math.random();
    status = roll < 0.6 ? 'Open' : roll < 0.9 ? 'In Progress' : 'Closed';
  } else if (daysAgo < 30) {
    // 1 week to 1 month old
    const roll = Math.random();
    status = roll < 0.1 ? 'Open' : roll < 0.5 ? 'In Progress' : 'Closed';
  } else {
    // Older than 1 month
    const roll = Math.random();
    status = roll < 0.05 ? 'Open' : roll < 0.25 ? 'In Progress' : 'Closed';
  }
  
  // Determine priority based on category and random factor
  let priorityChances: Record<string, number> = {
    'Low': 0.4,      // 40% base chance
    'Medium': 0.4,   // 40% base chance
    'High': 0.15,    // 15% base chance
    'Critical': 0.05 // 5% base chance
  };
  
  // Adjust based on category
  if (category === 'Security Breach') {
    priorityChances = { 'Low': 0.1, 'Medium': 0.2, 'High': 0.4, 'Critical': 0.3 };
  } else if (category === 'Physical Injury') {
    priorityChances = { 'Low': 0.2, 'Medium': 0.4, 'High': 0.3, 'Critical': 0.1 };
  } else if (category === 'Health Concern') {
    priorityChances = { 'Low': 0.2, 'Medium': 0.3, 'High': 0.4, 'Critical': 0.1 };
  }
  
  // Select priority based on weighted chances
  const priorityRoll = Math.random();
  let priority: 'Low' | 'Medium' | 'High' | 'Critical';
  
  if (priorityRoll < priorityChances['Critical']) {
    priority = 'Critical';
  } else if (priorityRoll < priorityChances['Critical'] + priorityChances['High']) {
    priority = 'High';
  } else if (priorityRoll < priorityChances['Critical'] + priorityChances['High'] + priorityChances['Medium']) {
    priority = 'Medium';
  } else {
    priority = 'Low';
  }
  
  // Select location and facility
  const location = getRandomItem(locations);
  
  // Get facilities specific to this location
  const facilitiesForLocation = facilityMappings.find(mapping => mapping.location === location)?.facilities || [];
  
  // Ensure we have at least one facility
  const facility = facilitiesForLocation.length > 0 
    ? getRandomItem(facilitiesForLocation) 
    : '';
  
  // Generate people involved
  const peopleInvolved = generatePeopleInvolved(category);
  
  // Select reporters and owners
  const reportedBy = getRandomItem(userRefs);
  
  // Generate description
  const description = generateDescription(category, subcategory, reportedBy);
  
  // Assign an owner (more likely for older or higher priority incidents)
  let owner: UserRef | undefined = undefined;
  
  if (status !== 'Open' || priority === 'Critical' || priority === 'High' || Math.random() < 0.7) {
    owner = getRandomItem(userRefs.filter(u => u.id !== reportedBy.id));
  }
  
  // Generate root cause for closed incidents
  const rootCause = generateRootCause(status);
  
  // Generate actions and action items
  const actions = generateActions(status, date, owner || reportedBy);
  
  // Generate action items
  const actionItems = generateActionItems(index, status, date, owner || reportedBy, reportedBy);
  
  // Create the incident object
  return {
    id: (index + 1).toString(),
    ticketId: generateTicketId(index + 1),
    type: category === 'Security Breach' ? 'Incident' : 
          Math.random() < 0.7 ? 'Incident' : // 70% incidents
          Math.random() < 0.5 ? 'Near Miss' : 'Unsafe Condition', // Split the rest
    category: category as any,
    subcategory,
    description,
    rootCause,
    date,
    location: location as any,
    peopleInvolved,
    status: status as any,
    reportedBy,
    owner,
    facility,
    actions,
    actionItems,
    priority,
    createdAt: date,
    updatedAt: new Date(date.getTime() + Math.floor(Math.random() * 3) * 86400000) // 0-3 days later
  };
};
