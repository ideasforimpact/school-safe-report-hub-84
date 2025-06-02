
import { Incident, User, Activity, ActionItem, Comment } from '@/types/incident';

// Configuration items for dropdowns and settings
export interface ConfigItem {
  id: string;
  name: string;
}

// Use the SubcategoryItem from the main types file
export interface SubcategoryItem {
  id: string;
  name: string;
  categoryId: string; // Required to match types/incident
}

export interface CampusItem extends ConfigItem {
  clientId?: string;
}

export interface ClassItem extends ConfigItem {
  campusId: string;
}

export interface SectionItem extends ConfigItem {
  classId: string;
  campusId?: string;
}

// Re-export types from incident.ts to avoid circular dependencies
export type { IncidentLocation, IncidentStatus, IncidentType } from '@/types/incident';
