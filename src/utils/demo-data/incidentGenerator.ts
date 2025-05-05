
import { Incident, Person, UserRef, Action, ActionItem } from '@/types/incident';
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
} from './dataPools';
import { getRandomItem, getRandomItems, generateRandomDate, generateTicketId } from './randomUtils';
import { generateDescription } from './descriptionGenerator';

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

// Generate a single incident
const generateSingleIncident = (index: number, category: string): Incident => {
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

// Helper function to generate people involved in an incident
const generatePeopleInvolved = (category: string): Person[] => {
  const peopleInvolved: Person[] = [];
  const peopleCount = Math.floor(Math.random() * 3) + 1; // 1-3 people
  
  // Different mix based on incident type
  if (category === 'Bullying' || category === 'Physical Injury') {
    // Mostly students
    peopleInvolved.push(...getRandomItems(studentPool, peopleCount));
    if (Math.random() < 0.3) { // 30% chance of staff involvement
      peopleInvolved.push(getRandomItem(staffPool));
    }
  } else if (category === 'Property Damage' || category === 'Tech Misuse') {
    // Mix of students and staff
    peopleInvolved.push(...getRandomItems(studentPool, Math.ceil(peopleCount/2)));
    if (Math.random() < 0.5) { // 50% chance of staff involvement
      peopleInvolved.push(getRandomItem(staffPool));
    }
  } else if (category === 'Security Breach') {
    // More likely to involve others
    if (Math.random() < 0.6) { // 60% chance of other involvement
      peopleInvolved.push(getRandomItem(otherPool));
    }
    if (Math.random() < 0.3) { // 30% chance of student involvement
      peopleInvolved.push(getRandomItem(studentPool));
    }
    peopleInvolved.push(getRandomItem(staffPool)); // Always involve staff
  } else {
    // Random mix for other categories
    if (Math.random() < 0.7) peopleInvolved.push(getRandomItem(studentPool));
    if (Math.random() < 0.5) peopleInvolved.push(getRandomItem(staffPool));
    if (Math.random() < 0.2) peopleInvolved.push(getRandomItem(otherPool));
  }
  
  // Ensure at least one person involved
  if (peopleInvolved.length === 0) {
    peopleInvolved.push(getRandomItem(studentPool));
  }
  
  return peopleInvolved;
};

// Generate root cause for closed incidents
const generateRootCause = (status: string): string | undefined => {
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

// Generate actions for in progress or closed incidents
const generateActions = (status: string, date: Date, user: UserRef): Action[] => {
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

// Generate action items
const generateActionItems = (
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
