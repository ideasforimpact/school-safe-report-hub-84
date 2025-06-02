
import { 
  Incident, 
  User, 
  Activity,
  ConfigItem,
  SubcategoryItem
} from '@/types/incident';

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
  loading?: boolean;
  error?: string | null;
  
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
  
  addActionItem: (incidentId: string, actionItem: any) => void;
  updateActionItem: (incidentId: string, actionItemId: string, updates: any) => void;
  deleteActionItem: (incidentId: string, actionItemId: string) => void;
  
  addComment: (incidentId: string, comment: any) => void;
  updateComment: (incidentId: string, commentId: string, updates: any) => void;
  deleteComment: (incidentId: string, commentId: string) => void;
  
  getRecentActivities: () => Activity[];
  getIncidentActivities: (incidentId: string) => Activity[];
  generateTicketId: () => string;
  isSubmitting?: boolean;
  
  // New methods for manual loading
  fetchIncidents?: () => Promise<void>;
  setIncidents?: (incidents: Incident[]) => void;
}
