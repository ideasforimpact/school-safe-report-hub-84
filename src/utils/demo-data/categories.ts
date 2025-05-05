
import { CategoryDefinition } from './types';

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
