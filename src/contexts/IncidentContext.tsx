import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from "sonner";

// Define all the types that are needed by other files
export interface Campus {
  id: string;
  name: string;
}

export interface Class {
  id: string;
  name: string;
  campusId: string;
}

export interface Section {
  id: string;
  name: string;
  classId: string;
}

// Incident related types
export type IncidentType = 'Incident' | 'Near Miss' | 'Unsafe Condition';
export type IncidentCategory = 'Physical Injury' | 'Bullying' | 'Tech Misuse' | 'Property Damage' | 'Health Concern' | 'Security Breach' | 'Other';
export type IncidentLocation = 'On Campus' | 'Off Campus' | 'In Transit' | 'During Function';
export type IncidentStatus = 'New' | 'Open' | 'In Progress' | 'Closed' | 'On Hold';
export type SchoolFacility = string;

export interface Person {
  name: string;
  role: 'Student' | 'Staff' | 'Other';
  notes?: string;
  id?: string;
}

export interface UserRef {
  id: string;
  name: string;
}

export interface Document {
  name: string;
  type: string;
  data: string; // Base64 encoded data
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
}

export interface Action {
  description: string;
  responsiblePerson: string;
  date: Date;
  image?: string;
  video?: string;
  document?: string;
  files?: FileItem[];
}

export interface Comment {
  id: string;
  description: string;
  dueDate: Date;
  assignedTo: UserRef;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdBy: UserRef;
  image?: string;
  video?: string;
  document?: string;
  files?: FileItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionItem {
  id: string;
  description: string;
  dueDate: Date;
  assignedTo: UserRef;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
  createdBy: UserRef;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContributingFactor {
  id: string;
  category: string;
  description: string;
  weight: 'Low' | 'Medium' | 'High';
}

export interface Incident {
  id: string;
  ticketId: string;
  type: IncidentType;
  category: IncidentCategory;
  subcategory: string;
  description: string;
  rootCause?: string;
  date: Date;
  location: IncidentLocation;
  peopleInvolved: Person[];
  status: IncidentStatus;
  reportedBy: UserRef;
  owner?: UserRef;
  facility?: SchoolFacility;
  image?: string;
  video?: string;
  document?: string;
  documents?: Document[];
  actions?: Action[];
  comments?: Comment[];
  actionItems?: ActionItem[];
  createdAt: Date;
  updatedAt: Date;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  contributingFactors?: ContributingFactor[];
  wasReopened?: boolean;
  isVoided?: boolean;
  voidReason?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Teacher' | 'Staff' | 'Safety Officer';
}

export interface Activity {
  type: 'incident' | 'action' | 'status' | 'comment' | 'actionItem';
  activity: 'create' | 'update' | 'delete' | 'close' | 'reopen' | 'void';
  entityId: string;
  entityTitle: string;
  user: string;
  userId: string;
  date: Date;
  details?: string;
}

export interface ConfigItem {
  id: string;
  name: string;
}

export interface SubcategoryItem {
  id: string;
  name: string;
  categoryId: string; // Make this consistent with the main types
}

// Export subcategory data
export const subcategories = [
  'Cuts and Bruises',
  'Broken Bones',
  'Head Injury',
  'Sport Injury',
  'Burns',
  'Allergic Reaction'
];

export const nearMissSubcategories = [
  'Almost Fall',
  'Near Collision',
  'Equipment Malfunction',
  'Chemical Spill'
];

export const unsafeConditionSubcategories = [
  'Slippery Surface',
  'Faulty Equipment',
  'Poor Lighting',
  'Obstruction',
  'Exposed Wires'
];

export interface IncidentContextType {
  // Data
  campuses: Campus[];
  classes: Class[];
  sections: Section[];
  incidents: Incident[];
  users: User[];
  categories: ConfigItem[];
  subcategoryMappings: Record<string, SubcategoryItem[]>;
  locations: ConfigItem[];
  facilities: ConfigItem[];
  designations: ConfigItem[];
  
  // Methods
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, id: string, name: string) => void;
  deleteSubcategory: (categoryId: string, id: string) => void;
  
  addLocation: (name: string) => void;
  updateLocation: (id: string, name: string) => void;
  deleteLocation: (id: string) => void;
  
  addFacility: (name: string) => void;
  updateFacility: (id: string, name: string) => void;
  deleteFacility: (id: string) => void;
  
  addCampus: (name: string) => void;
  updateCampus: (id: string, name: string) => void;
  deleteCampus: (id: string) => void;
  
  addClass: (campusId: string, name: string) => void;
  updateClass: (id: string, campusId: string, name: string) => void;
  deleteClass: (id: string) => void;
  
  addSection: (classId: string, name: string) => void;
  updateSection: (id: string, classId: string, name: string) => void;
  deleteSection: (id: string) => void;
  
  addDesignation: (name: string) => void;
  updateDesignation: (id: string, name: string) => void;
  deleteDesignation: (id: string) => void;
  
  addIncident: (incident: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'ticketId'>) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  getIncident: (id: string) => Incident | undefined;
  
  addActionItem: (incidentId: string, actionItem: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActionItem: (incidentId: string, actionItemId: string, updates: Partial<ActionItem>) => void;
  deleteActionItem: (incidentId: string, actionItemId: string) => void;
  
  addComment: (incidentId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComment: (incidentId: string, commentId: string, updates: Partial<Comment>) => void;
  deleteComment: (incidentId: string, commentId: string) => void;
  
  getRecentActivities: () => Activity[];
  getIncidentActivities: (incidentId: string) => Activity[];
  generateTicketId: () => string;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

// Mock implementation for the provider
export const IncidentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initial mock data for campuses, classes and sections
  const [campuses] = useState<Campus[]>([
    { id: 'c1', name: 'Main Campus' },
    { id: 'c2', name: 'North Campus' },
    { id: 'c3', name: 'South Campus' },
  ]);

  const [classes] = useState<Class[]>([
    { id: 'cl1', name: 'Grade 1', campusId: 'c1' },
    { id: 'cl2', name: 'Grade 2', campusId: 'c1' },
    { id: 'cl3', name: 'Grade 3', campusId: 'c1' },
    { id: 'cl4', name: 'Grade 4', campusId: 'c1' },
    { id: 'cl5', name: 'Grade 5', campusId: 'c1' },
    { id: 'cl6', name: 'Grade 1', campusId: 'c2' },
    { id: 'cl7', name: 'Grade 2', campusId: 'c2' },
    { id: 'cl8', name: 'Grade 1', campusId: 'c3' },
  ]);

  const [sections] = useState<Section[]>([
    { id: 's1', name: 'Section A', classId: 'cl1' },
    { id: 's2', name: 'Section B', classId: 'cl1' },
    { id: 's3', name: 'Section A', classId: 'cl2' },
    { id: 's4', name: 'Section B', classId: 'cl2' },
    { id: 's5', name: 'Section A', classId: 'cl3' },
    { id: 's6', name: 'Section A', classId: 'cl4' },
    { id: 's7', name: 'Section A', classId: 'cl5' },
    { id: 's8', name: 'Section A', classId: 'cl6' },
    { id: 's9', name: 'Section B', classId: 'cl6' },
    { id: 's10', name: 'Section A', classId: 'cl7' },
    { id: 's11', name: 'Section A', classId: 'cl8' },
  ]);

  // Mock data for other required properties
  const [incidents] = useState<Incident[]>([]);
  const [users] = useState<User[]>([
    { id: '1', name: 'Admin User', role: 'Admin' },
    { id: '2', name: 'Safety Officer', role: 'Safety Officer' }
  ]);
  const [categories] = useState<ConfigItem[]>([
    { id: 'cat1', name: 'Physical Injury' },
    { id: 'cat2', name: 'Bullying' }
  ]);
  const [subcategoryMappings] = useState<Record<string, SubcategoryItem[]>>({
    cat1: [{ id: 'sub1', name: 'Cuts and Bruises', categoryId: 'cat1' }],
    cat2: [{ id: 'sub2', name: 'Verbal', categoryId: 'cat2' }]
  });
  const [locations] = useState<ConfigItem[]>([
    { id: 'loc1', name: 'On Campus' },
    { id: 'loc2', name: 'Off Campus' }
  ]);
  const [facilities] = useState<ConfigItem[]>([
    { id: 'fac1', name: 'Classroom' },
    { id: 'fac2', name: 'Playground' }
  ]);
  const [designations] = useState<ConfigItem[]>([
    { id: 'des1', name: 'Teacher' },
    { id: 'des2', name: 'Principal' }
  ]);

  // Mock implementations of methods
  const mockFunction = () => {
    toast.info("This feature is not yet implemented");
  };

  const generateTicketId = () => {
    return `INC-${Math.floor(Math.random() * 10000)}`;
  };

  const getIncident = (id: string) => {
    return incidents.find(incident => incident.id === id);
  };

  const getRecentActivities = () => {
    return [] as Activity[];
  };

  const getIncidentActivities = (incidentId: string) => {
    return [] as Activity[];
  };

  // Context value
  const value = {
    campuses,
    classes,
    sections,
    incidents,
    users,
    categories,
    subcategoryMappings,
    locations,
    facilities,
    designations,
    
    addCategory: mockFunction,
    updateCategory: mockFunction,
    deleteCategory: mockFunction,
    
    addSubcategory: mockFunction,
    updateSubcategory: mockFunction,
    deleteSubcategory: mockFunction,
    
    addLocation: mockFunction,
    updateLocation: mockFunction,
    deleteLocation: mockFunction,
    
    addFacility: mockFunction,
    updateFacility: mockFunction,
    deleteFacility: mockFunction,
    
    addCampus: mockFunction,
    updateCampus: mockFunction,
    deleteCampus: mockFunction,
    
    addClass: mockFunction,
    updateClass: mockFunction,
    deleteClass: mockFunction,
    
    addSection: mockFunction,
    updateSection: mockFunction,
    deleteSection: mockFunction,
    
    addDesignation: mockFunction,
    updateDesignation: mockFunction,
    deleteDesignation: mockFunction,
    
    addIncident: mockFunction,
    updateIncident: mockFunction,
    getIncident,
    
    addActionItem: mockFunction,
    updateActionItem: mockFunction,
    deleteActionItem: mockFunction,
    
    addComment: mockFunction,
    updateComment: mockFunction,
    deleteComment: mockFunction,
    
    getRecentActivities,
    getIncidentActivities,
    generateTicketId
  };

  return (
    <IncidentContext.Provider value={value}>
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncidents = () => {
  const context = useContext(IncidentContext);
  if (context === undefined) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
};
