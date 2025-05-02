import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useFacilities } from './FacilityContext';
import { generateTicketId, sampleUsers, generateSampleIncidents } from '@/utils/incidentUtils';
import { useIncidentActions } from '@/hooks/useIncidentActions';
import { useActionItems } from '@/hooks/useActionItems';
import { useActivities } from '@/hooks/useActivities';
import { Incident, User, Activity, ActionItem } from '@/types/incident';

// Re-export types from types/incident.ts
export type {
  IncidentType,
  IncidentCategory,
  IncidentLocation,
  IncidentStatus,
  SchoolFacility,
  Person,
  UserRef,
  Action,
  ActionItem,
  Incident,
  User,
  Activity
} from '@/types/incident';

// Re-export subcategories from data/incidentCategories.ts
export {
  subcategories,
  nearMissSubcategories,
  unsafeConditionSubcategories
} from '@/data/incidentCategories';

// Context interface
interface IncidentContextType {
  incidents: Incident[];
  users: User[];
  addIncident: (incident: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'ticketId'>) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  getIncident: (id: string) => Incident | undefined;
  addActionItem: (incidentId: string, actionItem: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActionItem: (incidentId: string, actionItemId: string, updates: Partial<ActionItem>) => void;
  deleteActionItem: (incidentId: string, actionItemId: string) => void;
  getRecentActivities: () => Activity[];
  getIncidentActivities: (incidentId: string) => Activity[];
  generateTicketId: () => string;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const savedIncidents = localStorage.getItem('incidents');
    return savedIncidents ? JSON.parse(savedIncidents) : generateSampleIncidents();
  });

  // Activity tracking with enhanced audit information
  const [activities, setActivities] = useState<Activity[]>(() => {
    const savedActivities = localStorage.getItem('activities');
    return savedActivities ? JSON.parse(savedActivities) : [];
  });

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(activities));
  }, [activities]);

  // Hooks for incident-related operations
  const { addIncident, updateIncident, getIncident, addActivity } = useIncidentActions(
    incidents,
    setIncidents,
    activities,
    setActivities,
    sampleUsers as User[]  // Type assertion to fix the role compatibility issue
  );
  
  // Hooks for action item operations
  const { addActionItem, updateActionItem, deleteActionItem } = useActionItems(
    incidents,
    setIncidents,
    addActivity
  );
  
  // Hooks for activity-related operations
  const { getRecentActivities, getIncidentActivities } = useActivities(incidents, activities);

  return (
    <IncidentContext.Provider value={{ 
      incidents, 
      users: sampleUsers as User[],  // Type assertion to fix the role compatibility issue
      addIncident, 
      updateIncident, 
      getIncident,
      addActionItem,
      updateActionItem,
      deleteActionItem,
      getRecentActivities,
      getIncidentActivities,
      generateTicketId
    }}>
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncidents = () => {
  const context = useContext(IncidentContext);
  if (context === undefined) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
};
