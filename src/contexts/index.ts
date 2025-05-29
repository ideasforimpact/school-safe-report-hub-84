
// Re-export contexts for easier imports
export * from './auth';
export * from './employee/EmployeeContext';
export * from './StudentContext';
export * from './incident';
export * from './employee-verification';
export * from './FacilityContext';
export * from './assessment/AssessmentContext';

// Explicitly re-export ClientContext to avoid naming conflicts
export { ClientProvider, useClient, ClientContext } from './ClientContext';
export type { Client as ClientContextType } from './ClientContext';
