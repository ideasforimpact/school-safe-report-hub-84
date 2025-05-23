import { Incident, User, Activity, ActionItem, Comment } from '@/types/incident';

// Configuration items for dropdowns and settings
export interface ConfigItem {
  id: string;
  name: string;
}

export interface SubcategoryItem extends ConfigItem {
  categoryId?: string;
}

export interface CampusItem extends ConfigItem {
  clientId?: string;
}

export interface ClassItem extends ConfigItem {
  campusId: string;
}

export interface SectionItem {
  id: string;
  name: string;
  classId: string;
  campusId?: string; // Add campusId to SectionItem interface
}

// Re-export types from incident.ts to avoid circular dependencies
export type { IncidentLocation, IncidentStatus, IncidentType } from '@/types/incident';
