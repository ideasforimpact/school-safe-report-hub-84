
import { Person, UserRef } from '@/types/incident';
import { CategoryDefinition } from './types';

// Create a pool of fictional people to use across incidents
export const studentPool: Person[] = [
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

export const staffPool: Person[] = [
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

export const otherPool: Person[] = [
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
export const userRefs: UserRef[] = [
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
export const categoryDefinitions: CategoryDefinition[] = [
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
export const locations = ['On Campus', 'Off Campus', 'In Transit', 'During Function'];

export const facilities = [
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
export const actionDescriptions = [
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
export const rootCausePatterns = [
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
