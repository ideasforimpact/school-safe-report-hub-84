
// Export from incident/IncidentContext
export {
  IncidentProvider,
  useIncidents,
  subcategories,
  nearMissSubcategories,
  unsafeConditionSubcategories,
  ContributingFactor
} from '@/contexts/IncidentContext';

// Export types from IncidentContext but exclude User to avoid name collision
export type {
  Campus,
  Class,
  Section,
  IncidentType,
  IncidentCategory,
  IncidentLocation,
  IncidentStatus,
  SchoolFacility,
  Person,
  UserRef,
  Document,
  FileItem,
  Action,
  Comment,
  ActionItem,
  Incident,
  Activity,
  ConfigItem,
  SubcategoryItem,
  IncidentContextType
} from '@/contexts/IncidentContext';

// Export auth related items
export * from './auth';

// Export other contexts
export * from './FacilityContext';
export * from './ClientContext';
export * from './StudentContext';
export * from './assessment/AssessmentContext';
export * from './employee-verification';
export * from './feedback/FeedbackContext';
