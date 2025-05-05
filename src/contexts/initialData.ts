import { ConfigItem, SubcategoryItem, SectionItem, ClassItem, CampusItem } from './types';

// Initial configuration data
export const initialCategories: ConfigItem[] = [
  { id: '1', name: 'Physical Injury' },
  { id: '2', name: 'Bullying' },
  { id: '3', name: 'Tech Misuse' },
  { id: '4', name: 'Property Damage' },
  { id: '5', name: 'Health Concern' },
  { id: '6', name: 'Security Breach' },
  { id: '7', name: 'Other' }
];

export const initialSubcategories: Record<string, SubcategoryItem[]> = {
  '1': [ // Physical Injury
    { id: '1-1', name: 'Slipped on wet floor' },
    { id: '1-2', name: 'Playground or sports injury' },
    { id: '1-3', name: 'Injury from furniture or equipment' },
    { id: '1-4', name: 'Science/lab-related accidents' },
    { id: '1-5', name: 'Falls from stairs/benches' },
    { id: '1-6', name: 'Animal/insect bites on campus' },
    { id: '1-7', name: 'Other' }
  ],
  '2': [ // Bullying
    { id: '2-1', name: 'Name-calling, teasing, mocking' },
    { id: '2-2', name: 'Physical fighting or intimidation' },
    { id: '2-3', name: 'Cyberbullying via messages/social media' },
    { id: '2-4', name: 'Spreading rumors or private info' },
    { id: '2-5', name: 'Targeted bullying (caste, appearance, disability)' },
    { id: '2-6', name: 'Other' }
  ],
  '3': [
    { id: '3-1', name: 'Using phone or laptop without permission' },
    { id: '3-2', name: 'Watching inappropriate videos' },
    { id: '3-3', name: 'Taking photos or videos without permission' },
    { id: '3-4', name: 'Cheating using AI tools or online answers' },
    { id: '3-5', name: 'Using VPN to access blocked websites' },
    { id: '3-6', name: 'Sharing or saving obscene or harmful content' },
    { id: '3-7', name: 'Being part of inappropriate online groups' },
    { id: '3-8', name: 'Using school Wi-Fi for wrong purposes' },
    { id: '3-9', name: 'Creating fake accounts of students or staff' },
    { id: '3-10', name: 'Cyberbullying or online harassment' },
    { id: '3-11', name: 'Other' }
  ],
  '4': [
    { id: '4-1', name: 'Vandalism (desks, walls, restrooms)' },
    { id: '4-2', name: 'Damage to lab/sports/classroom equipment' },
    { id: '4-3', name: 'Destruction of library or digital assets' },
    { id: '4-4', name: 'Electrical/plumbing fixture damage' },
    { id: '4-5', name: 'Tampering with CCTV or smart boards' },
    { id: '4-6', name: 'Other' }
  ],
  '5': [
    { id: '5-1', name: 'Fainting, seizures, or sudden illness' },
    { id: '5-2', name: 'Asthma/allergy attacks' },
    { id: '5-3', name: 'Menstrual health emergencies' },
    { id: '5-4', name: 'Accidents causing bleeding/fractures' },
    { id: '5-5', name: 'Food poisoning or dehydration' },
    { id: '5-6', name: 'Suspected communicable disease' },
    { id: '5-7', name: 'Other' }
  ],
  '6': [
    { id: '6-1', name: 'Unauthorized entry of outsiders' },
    { id: '6-2', name: 'Suspicious person or object found' },
    { id: '6-3', name: 'Safety violation' },
    { id: '6-4', name: 'Emergency exits blocked or locked' },
    { id: '6-5', name: 'Other' }
  ],
  '7': [
    { id: '7-1', name: 'Other' }
  ]
};

export const initialLocations: ConfigItem[] = [
  { id: '1', name: 'On Campus' },
  { id: '2', name: 'Off Campus' },
  { id: '3', name: 'In Transit' },
  { id: '4', name: 'During Function' }
];

export const initialFacilities: ConfigItem[] = [
  { id: '1', name: 'Main Building' },
  { id: '2', name: 'Classroom' },
  { id: '3', name: 'School Grounds' },
  { id: '4', name: 'Others' }
];

export const initialDesignations: ConfigItem[] = [
  { id: '1', name: 'Teacher' },
  { id: '2', name: 'Administrator' },
  { id: '3', name: 'Principal' },
  { id: '4', name: 'Coordinator' },
  { id: '5', name: 'Counselor' },
  { id: '6', name: 'Staff' }
];

// Add initial campuses
export const initialCampuses: CampusItem[] = [
  { id: '1', name: 'Main Campus' },
  { id: '2', name: 'North Campus' },
  { id: '3', name: 'South Campus' }
];

// Update initialClasses to have the correct type with campusId
export const initialClasses: ClassItem[] = [
  { id: '1', name: 'Class 1', campusId: '1' },
  { id: '2', name: 'Class 2', campusId: '1' },
  { id: '3', name: 'Class 3', campusId: '2' },
  { id: '4', name: 'Class 4', campusId: '2' },
  { id: '5', name: 'Class 5', campusId: '3' }
];

// Update initialSections to have the correct type with classId
export const initialSections: SectionItem[] = [
  { id: '1', name: 'Section A', classId: '1' }, // Assign to Class 1
  { id: '2', name: 'Section B', classId: '1' }, // Assign to Class 1
  { id: '3', name: 'Section C', classId: '2' }  // Assign to Class 2
];

// Adding sample incident data export to resolve the import error
export const sampleIncidentData = [];
