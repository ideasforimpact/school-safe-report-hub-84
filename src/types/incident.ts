
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
export type IncidentStatus = 'New' | 'Open' | 'In Progress' | 'Closed' | 'On Hold';

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

export interface Document {
  name: string;
  type: string;
  data: string; // Base64 encoded data
}

export interface Action {
  description: string;
  responsiblePerson: string;
  date: Date;
  image?: string;
  video?: string;
  document?: string;
  files?: FileItem[]; // New field for multiple files
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
  url?: string; // Added for storage URLs
  path?: string; // Added for storage paths
}

export interface Comment {
  id: string;
  description: string;
  dueDate: Date;
  assignedTo: UserRef;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdBy: UserRef;
  image?: string; // Kept for backward compatibility
  video?: string; // Kept for backward compatibility
  document?: string; // Kept for backward compatibility
  files?: FileItem[]; // New field for multiple files
  createdAt: Date;
  updatedAt: Date;
}

// Renamed ActionItem to Comment
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

// Contributing Factors interface
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
  comments?: Comment[]; // Updated to use the new comments column from database
  actionItems?: ActionItem[]; // Keep for backward compatibility
  createdAt: Date;
  updatedAt: Date;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  contributingFactors?: ContributingFactor[]; // Added contributing factors
  wasReopened?: boolean; // Flag to indicate if the ticket was reopened after being closed
  isVoided?: boolean; // Flag to indicate if the incident record is voided
  voidReason?: string; // Reason why the incident was voided
  reopen?: number; // Number of times incident has been reopened, default 0
  // New fields from database
  rootCauseAnalysis?: string; // Maps to root_cause_analysis column
  actionTaken?: string; // Maps to action_taken column
  contributingFactor?: ContributingFactor[]; // Maps to contributing_factor jsonb column
  createdBy?: string; // Employee ID who created the incident
  assignedTo?: string; // Employee ID who is assigned to the incident
}

// Create a user type for dropdown selection
export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Teacher' | 'Staff' | 'Safety Officer';
}

// Activity history with enhanced audit information
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
