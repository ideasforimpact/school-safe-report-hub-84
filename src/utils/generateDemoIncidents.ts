import { Incident, Person, UserRef } from '@/types/incident';

// Create a pool of fictional people to use across incidents
const studentPool: Person[] = [
  { name: 'James Wilson', role: 'Student', notes: 'Grade 5' },
  { name: 'Emily Martinez', role: 'Student', notes: 'Grade 7' },
  { name: 'Michael Johnson', role: 'Student', notes: 'Grade 10' },
  { name: 'Sophia Lee', role: 'Student', notes: 'Grade 3' },
  { name: 'Ethan Brown', role: 'Student', notes: 'Grade 8' },
  { name: 'Olivia Davis', role: 'Student', notes: 'Grade 6' },
  { name: 'Noah Smith', role: 'Student', notes: 'Grade 12' },
  { name: 'Ava Taylor', role: 'Student', notes: 'Grade 9' },
  { name: 'William Anderson', role: 'Student', notes: 'Grade 11' },
  { name: 'Isabella Thomas', role: 'Student', notes: 'Grade 4' },
  { name: 'Benjamin Harris', role: 'Student', notes: 'Grade 7' },
  { name: 'Mia Rodriguez', role: 'Student', notes: 'Grade 5' },
  { name: 'Jacob Lewis', role: 'Student', notes: 'Grade 10' },
  { name: 'Charlotte Walker', role: 'Student', notes: 'Grade 8' },
  { name: 'Alexander Hall', role: 'Student', notes: 'Grade 9' },
  { name: 'Amelia Allen', role: 'Student', notes: 'Grade 6' },
  { name: 'Daniel Young', role: 'Student', notes: 'Grade 5' },
  { name: 'Sofia King', role: 'Student', notes: 'Grade 11' },
  { name: 'Matthew Wright', role: 'Student', notes: 'Grade 8' },
  { name: 'Abigail Scott', role: 'Student', notes: 'Grade 4' },
  { name: 'David Green', role: 'Student', notes: 'Grade 7' },
  { name: 'Harper Baker', role: 'Student', notes: 'Grade 12' },
  { name: 'Joseph Adams', role: 'Student', notes: 'Grade 9' },
  { name: 'Evelyn Nelson', role: 'Student', notes: 'Grade 6' },
  { name: 'Samuel Carter', role: 'Student', notes: 'Grade 10' }
];

const staffPool: Person[] = [
  { name: 'Ms. Roberts', role: 'Staff', notes: 'English Teacher' },
  { name: 'Mr. Phillips', role: 'Staff', notes: 'Math Teacher' },
  { name: 'Mrs. Campbell', role: 'Staff', notes: 'Science Teacher' },
  { name: 'Dr. Parker', role: 'Staff', notes: 'Principal' },
  { name: 'Ms. Evans', role: 'Staff', notes: 'School Counselor' },
  { name: 'Mr. Turner', role: 'Staff', notes: 'Physical Education Teacher' },
  { name: 'Mrs. Brooks', role: 'Staff', notes: 'Art Teacher' },
  { name: 'Mr. Bennett', role: 'Staff', notes: 'History Teacher' },
  { name: 'Ms. Wood', role: 'Staff', notes: 'School Nurse' },
  { name: 'Mr. Butler', role: 'Staff', notes: 'Technology Coordinator' },
  { name: 'Mrs. Simmons', role: 'Staff', notes: 'Librarian' },
  { name: 'Mr. Gray', role: 'Staff', notes: 'Custodian' },
  { name: 'Ms. Howard', role: 'Staff', notes: 'Cafeteria Manager' }
];

const otherPool: Person[] = [
  { name: 'John Doe', role: 'Other', notes: 'Parent' },
  { name: 'Mary Johnson', role: 'Other', notes: 'Parent' },
  { name: 'Tom Smith', role: 'Other', notes: 'Visitor' },
  { name: 'Sarah Williams', role: 'Other', notes: 'Contractor' },
  { name: 'Robert Brown', role: 'Other', notes: 'School Board Member' },
  { name: 'Patricia Miller', role: 'Other', notes: 'Volunteer' },
  { name: 'Mark Davis', role: 'Other', notes: 'Bus Driver' },
  { name: 'Jennifer Wilson', role: 'Other', notes: 'Parent' },
  { name: 'Charles Moore', role: 'Other', notes: 'Substitute Teacher' },
  { name: 'Linda Taylor', role: 'Other', notes: 'Guest Speaker' },
  { name: 'Richard Thomas', role: 'Other', notes: 'Parent' },
  { name: 'Susan Anderson', role: 'Other', notes: 'PTA Member' }
];

// User references (staff who can report/own incidents)
const userRefs: UserRef[] = [
  { id: '1', name: 'Admin User' },
  { id: '2', name: 'Teacher Reporter' },
  { id: '3', name: 'Safety Officer' },
  { id: '4', name: 'Maintenance Staff' },
  { id: '5', name: 'Principal Johnson' },
  { id: '6', name: 'Nurse Smith' },
  { id: '7', name: 'Coach Williams' },
  { id: '8', name: 'IT Specialist Rogers' },
  { id: '9', name: 'Counselor Martinez' }
];

// Category definitions with their subcategories
interface CategoryDefinition {
  category: string;
  subcategories: string[];
}

const categoryDefinitions: CategoryDefinition[] = [
  {
    category: 'Physical Injury',
    subcategories: [
      'Playground or sports injury',
      'Slip or fall',
      'Physical altercation',
      'Burns or scalds',
      'Cuts or lacerations',
      'Equipment-related injury',
      'Exposure to chemicals',
      'Hit by falling object',
      'PE class injury',
      'Self-harm incident'
    ]
  },
  {
    category: 'Bullying',
    subcategories: [
      'Name-calling, teasing, mocking',
      'Social exclusion',
      'Cyberbullying',
      'Physical intimidation',
      'Spreading rumors',
      'Taking or damaging possessions',
      'Threatening behavior',
      'Repeated harassment'
    ]
  },
  {
    category: 'Tech Misuse',
    subcategories: [
      'Accessing inappropriate content',
      'Using phone or laptop without permission',
      'Unauthorized recording/photos',
      'Sharing confidential information',
      'Hacking school systems',
      'Social media bullying',
      'Bypassing content filters',
      'Meeting online strangers',
      'Account sharing/stealing'
    ]
  },
  {
    category: 'Property Damage',
    subcategories: [
      'Vandalism of school property',
      'Damage to lab/sports/classroom equipment',
      'Graffiti',
      'Broken windows or doors',
      'Water damage incident',
      'Fire damage',
      'Theft of school property',
      'Damage to student property',
      'Vehicle damage on campus'
    ]
  },
  {
    category: 'Health Concern',
    subcategories: [
      'Allergic reaction',
      'Asthma attack',
      'Seizure',
      'Food poisoning',
      'Exposure to bodily fluids',
      'Contagious disease report',
      'Environmental hazard',
      'Medication incident',
      'Suspected drug/alcohol use',
      'Mental health crisis'
    ]
  },
  {
    category: 'Security Breach',
    subcategories: [
      'Unauthorized campus entry',
      'Suspicious person',
      'Missing student',
      'Weapon on campus',
      'Bomb threat',
      'Campus lockdown',
      'Unauthorized room access',
      'Data security breach',
      'Fire alarm misuse'
    ]
  },
  {
    category: 'Other',
    subcategories: [
      'Transportation issue',
      'Staff misconduct',
      'Student misconduct',
      'Parent complaint',
      'Natural disaster',
      'Off-campus incident affecting school',
      'Equipment malfunction'
    ]
  }
];

// Locations and facilities
const locations = ['On Campus', 'Off Campus', 'In Transit', 'During Function'];

const facilities = [
  'Classroom Building A',
  'Classroom Building B',
  'Gymnasium',
  'Playground',
  'Athletic Field',
  'Cafeteria',
  'Main Office',
  'Library',
  'Science Lab',
  'Computer Lab',
  'Art Room',
  'Music Room',
  'Auditorium',
  'Parking Lot',
  'Hallway',
  'Restroom',
  'Bus Loop',
  'School Bus'
];

// Action descriptions
const actionDescriptions = [
  'First aid administered, parent notified',
  'Student sent home, incident documented',
  'Parent conference scheduled',
  'Maintenance notified for repairs',
  'Disciplinary referral issued',
  'Area secured and cordoned off',
  'Video surveillance reviewed',
  'Counseling services provided',
  'Report filed with authorities',
  'Safety training scheduled',
  'Safety committee review initiated',
  'Equipment removed from service',
  'Hazard warning signs posted',
  'Safety protocol updated',
  'School nurse assessed student',
  'Administrative investigation started'
];

// Root cause patterns
const rootCausePatterns = [
  'Lack of proper supervision',
  'Equipment malfunction or defect',
  'Inadequate safety protocols',
  'Student behavior issues',
  'Communication breakdown',
  'Insufficient training',
  'Environmental factors',
  'Poor facility maintenance',
  'Policy violation',
  'Overcrowding in area',
  'Distraction during activity',
  'Misunderstanding of rules',
  'Inadequate risk assessment',
  'Weather conditions',
  'Accessibility issues'
];

// Helper function to get a random item from an array
const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to get random items from an array
const getRandomItems = <T,>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to generate a random date within the past year with more school-year weighting
const generateRandomDate = (): Date => {
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  // Define periods with weights
  const periods = [
    { start: 0, end: 30, weight: 3 },         // Last month (3x more likely)
    { start: 31, end: 90, weight: 2 },        // 1-3 months ago (2x more likely)
    { start: 91, end: 180, weight: 1 },       // 3-6 months ago (normal)
    { start: 181, end: 270, weight: 1 },      // 6-9 months ago (normal)
    { start: 271, end: 365, weight: 0.5 }     // 9-12 months ago (half as likely)
  ];
  
  // Create weighted array of days
  let weightedDays: number[] = [];
  for (const period of periods) {
    for (let day = period.start; day <= period.end; day++) {
      // Add the day multiple times based on weight
      for (let w = 0; w < period.weight * 10; w++) {
        weightedDays.push(day);
      }
    }
  }
  
  // Select a random day from the weighted array
  const selectedDay = getRandomItem(weightedDays);
  
  // Create the date by subtracting the selected number of days
  const date = new Date();
  date.setDate(date.getDate() - selectedDay);
  
  // Adjust time to a reasonable hour during the school day (8am-3pm)
  date.setHours(8 + Math.floor(Math.random() * 7), 
                Math.floor(Math.random() * 60), 
                Math.floor(Math.random() * 60));
  
  return date;
};

// Generate ticket ID
const generateTicketId = (index: number): string => {
  const year = new Date().getFullYear();
  const paddedIndex = String(index).padStart(3, '0');
  return `SR-${year}-${paddedIndex}`;
};

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
    // Select a category (popping from our distribution queue)
    const category = categoryQueue[i] || getRandomItem(Object.keys(categoryCountTargets));
    
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
    const facility = location === 'On Campus' ? getRandomItem(facilities) : '';
    
    // Generate people involved
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
    
    // Select reporters and owners
    const reportedBy = getRandomItem(userRefs);
    
    // Generate description based on category and subcategory
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
    
    // Assign an owner (more likely for older or higher priority incidents)
    let owner: UserRef | undefined = undefined;
    
    if (status !== 'Open' || priority === 'Critical' || priority === 'High' || Math.random() < 0.7) {
      owner = getRandomItem(userRefs.filter(u => u.id !== reportedBy.id));
    }
    
    // Generate root cause for closed incidents
    const rootCause = status === 'Closed' ? 
      `${getRandomItem(rootCausePatterns)}. ${getRandomItem([
        'Contributing factors included insufficient monitoring.',
        'Environmental conditions were a factor.',
        'Procedural gaps were identified.',
        'Behavioral factors contributed to the incident.',
        'Training deficiencies were noted as contributing factors.'
      ])}` : undefined;
    
    // Generate actions for in progress or closed incidents
    const actions = status !== 'Open' ? [
      {
        description: getRandomItem(actionDescriptions), 
        responsiblePerson: owner?.name || reportedBy.name, 
        date: new Date(date)
      }
    ] : [];
    
    if (status === 'Closed' && Math.random() < 0.7) {
      // Add a second action for some closed incidents
      const secondActionDate = new Date(date);
      secondActionDate.setDate(secondActionDate.getDate() + Math.floor(Math.random() * 5) + 1);
      
      actions.push({
        description: getRandomItem(actionDescriptions),
        responsiblePerson: owner?.name || reportedBy.name,
        date: secondActionDate
      });
    }
    
    // Generate action items for some incidents with the correct status type
    const actionItems = Math.random() < 0.6 && (status === 'In Progress' || status === 'Closed') ? [
      {
        id: `action-${i}-1`,
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
        assignedTo: owner || reportedBy,
        status: status === 'Closed' ? 'Completed' as const : 'In Progress' as const, // Use type assertion to match the expected literals
        createdBy: reportedBy,
        createdAt: date,
        updatedAt: new Date(date.getTime() + Math.floor(Math.random() * 3) * 86400000) // 0-3 days later
      }
    ] : [];
    
    // Create the incident object
    const incident: Incident = {
      id: (i + 1).toString(),
      ticketId: generateTicketId(i + 1),
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
    
    incidents.push(incident);
  }
  
  // Sort by date (newest first)
  return incidents.sort((a, b) => b.date.getTime() - a.date.getTime());
};
