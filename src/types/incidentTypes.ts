
// Re-export all types from the main incident types file
export type {
  IncidentType,
  IncidentCategory,
  IncidentLocation,
  IncidentStatus,
  SchoolFacility,
  Person,
  UserRef,
  Action,
  Comment,
  Incident,
  User,
  Activity
} from '@/types/incident';

// We also need to export the category data
export { subcategories, nearMissSubcategories, unsafeConditionSubcategories } from '@/data/incidentCategories';
