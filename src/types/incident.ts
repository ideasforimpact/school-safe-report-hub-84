
// Types for Incident Management System
export type IncidentType = 'Incident' | 'Near Miss' | 'Unsafe Condition';
export type IncidentCategory = 
  'Physical Injury' | 
  'Bullying' | 
  'Tech Misuse' | 
  'Property Damage' | 
  'Health Concern' |
  'Security Breach' |
  'Other';

export type IncidentLocation = 'On Campus' | 'Off Campus' | 'In Transit' | 'During Function';
export type IncidentStatus = 'Open' | 'In Progress' | 'Closed';

// School Facilities - dynamically loaded from FacilityContext
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

export interface Action {
  description: string;
  responsiblePerson: string;
  date: Date;
  image?: string;
  video?: string;
  document?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  dueDate: Date;
  assignedTo: UserRef;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdBy: UserRef;
  image?: string;
  video?: string;
  document?: string;
  createdAt: Date;
  updatedAt: Date;
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
  actions?: Action[];
  actionItems?: ActionItem[];
  createdAt: Date;
  updatedAt: Date;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
}

// Create a user type for dropdown selection
export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Teacher' | 'Staff' | 'Safety Officer';
}

// Activity history with enhanced audit information
export interface Activity {
  type: 'incident' | 'action' | 'status' | 'actionItem';
  activity: 'create' | 'update' | 'delete' | 'close' | 'reopen';
  entityId: string;
  entityTitle: string;
  user: string;
  userId: string;
  date: Date;
  details?: string;
}
