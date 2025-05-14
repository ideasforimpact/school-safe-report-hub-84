
import { Incident, User, Activity, ActionItem, Comment as IncidentComment } from '@/types/incident';

export interface ConfigItem {
  id: string;
  name: string;
}

export interface SubcategoryItem {
  id: string;
  name: string;
}

export interface SectionItem {
  id: string;
  name: string;
  classId: string;  // Reference to parent class
}

export interface ClassItem extends ConfigItem {
  campusId: string;  // Reference to parent campus
}

export interface CampusItem extends ConfigItem {}

export interface IncidentContextType {
  incidents: Incident[];
  users: User[];
  // Category management
  categories: ConfigItem[];
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  // Subcategory management
  subcategoryMappings: Record<string, SubcategoryItem[]>;
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, id: string, name: string) => void;
  deleteSubcategory: (categoryId: string, id: string) => void;
  // Location management
  locations: ConfigItem[];
  addLocation: (name: string) => void;
  updateLocation: (id: string, name: string) => void;
  deleteLocation: (id: string) => void;
  // Facility management
  facilities: ConfigItem[];
  addFacility: (name: string) => void;
  updateFacility: (id: string, name: string) => void;
  deleteFacility: (id: string) => void;
  // Campus management
  campuses: CampusItem[];
  addCampus: (name: string) => void;
  updateCampus: (id: string, name: string) => void;
  deleteCampus: (id: string) => void;
  // Class management
  classes: ClassItem[];
  addClass: (campusId: string, name: string) => void;
  updateClass: (id: string, campusId: string, name: string) => void;
  deleteClass: (id: string) => void;
  // Section management
  sections: SectionItem[];
  addSection: (classId: string, name: string) => void;
  updateSection: (id: string, classId: string, name: string) => void;
  deleteSection: (id: string) => void;
  // Existing incident operations
  addIncident: (incident: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'ticketId'>) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  getIncident: (id: string) => Incident | undefined;
  // ActionItems operations (renamed to comments in the UI)
  addActionItem: (incidentId: string, actionItem: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActionItem: (incidentId: string, actionItemId: string, updates: Partial<ActionItem>) => void;
  deleteActionItem: (incidentId: string, actionItemId: string) => void;
  // Comments operations
  addComment: (incidentId: string, comment: Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComment: (incidentId: string, commentId: string, updates: Partial<IncidentComment>) => void;
  deleteComment: (incidentId: string, commentId: string) => void;
  getRecentActivities: () => Activity[];
  getIncidentActivities: (incidentId: string) => Activity[];
  generateTicketId: () => string;
  
  // Add these properties for designations
  designations: ConfigItem[];
  addDesignation: (name: string) => void;
  updateDesignation: (id: string, name: string) => void;
  deleteDesignation: (id: string) => void;
}
