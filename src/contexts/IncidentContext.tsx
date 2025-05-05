
// Re-export everything from the new file structure
export * from './incident/IncidentContext';

// Re-export types needed by other components
export type { 
  IncidentType, 
  IncidentCategory, 
  IncidentLocation, 
  IncidentStatus, 
  SchoolFacility, 
  Activity,
  Incident
} from '@/types/incident';

// Re-export subcategory data
export { 
  subcategories, 
  nearMissSubcategories, 
  unsafeConditionSubcategories 
} from '@/data/incidentCategories';
