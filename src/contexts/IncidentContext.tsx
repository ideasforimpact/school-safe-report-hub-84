
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { generateTicketId, sampleUsers } from '@/utils/incidentUtils';
import { useIncidentActions } from '@/hooks/useIncidentActions';
import { useActionItems } from '@/hooks/useActionItems';
import { useActivities } from '@/hooks/useActivities';
import { useComments } from '@/hooks/useComments';
import { useConfigManagement } from '@/hooks/useConfigManagement';
import { Incident, User, Activity, Comment as IncidentComment } from '@/types/incident';
import { generateSampleIncidents } from '@/utils/sampleIncidentData';
import { subcategories, nearMissSubcategories, unsafeConditionSubcategories } from '@/data/incidentCategories';
import { IncidentContextType } from './types';
import { initialCategories, initialSubcategories, initialLocations, initialFacilities } from './initialData';

// Re-export types and incident category data
export * from '@/types/incidentTypes';
export { subcategories, nearMissSubcategories, unsafeConditionSubcategories } from '@/data/incidentCategories';
export type { ConfigItem, SubcategoryItem } from './types';

// Create the context with a default undefined value
const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

// Helper function to safely save data to localStorage
const safelySetLocalStorage = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Error saving to localStorage: ${key}`, error);
    return false;
  }
};

// Helper function to safely get data from localStorage
const safelyGetLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading from localStorage: ${key}`, error);
    return defaultValue;
  }
};

export const IncidentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize incidents with sample data, but don't load from localStorage if it would exceed quota
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    return safelyGetLocalStorage<Incident[]>('incidents', generateSampleIncidents());
  });

  // Activity tracking with enhanced audit information
  const [activities, setActivities] = useState<Activity[]>(() => {
    return safelyGetLocalStorage<Activity[]>('activities', []);
  });

  // Save data to localStorage whenever they change, but handle quota errors gracefully
  useEffect(() => {
    const incidentsJson = JSON.stringify(incidents);
    // Only save if it's not too large (approximately checking)
    if (incidentsJson.length < 4000000) { // ~4MB limit as a safe threshold
      safelySetLocalStorage('incidents', incidentsJson);
    } else {
      console.warn('Incidents data too large for localStorage, not saving');
    }
  }, [incidents]);

  useEffect(() => {
    safelySetLocalStorage('activities', JSON.stringify(activities));
  }, [activities]);

  // Use our new configuration management hook
  const configManagement = useConfigManagement(
    initialCategories,
    initialSubcategories,
    initialLocations,
    initialFacilities
  );

  // Hooks for incident-related operations
  const { addIncident, updateIncident, getIncident, addActivity } = useIncidentActions(
    incidents,
    setIncidents,
    activities,
    setActivities,
    sampleUsers as User[] // Type assertion to fix the role compatibility issue
  );
  
  // Hooks for action item operations
  const { addActionItem, updateActionItem, deleteActionItem } = useActionItems(
    incidents,
    setIncidents,
    addActivity
  );

  // Hooks for comment operations
  const { addComment, updateComment, deleteComment } = useComments(
    incidents,
    setIncidents,
    addActivity
  );
  
  // Hooks for activity-related operations
  const { getRecentActivities, getIncidentActivities } = useActivities(incidents, activities);

  // Create the context value object
  const contextValue: IncidentContextType = {
    incidents, 
    users: sampleUsers as User[],
    // Configuration from our hook
    ...configManagement,
    // Incident operations
    addIncident, 
    updateIncident, 
    getIncident,
    // ActionItems operations
    addActionItem,
    updateActionItem,
    deleteActionItem,
    // Comment operations
    addComment,
    updateComment,
    deleteComment,
    // Activity operations
    getRecentActivities,
    getIncidentActivities,
    generateTicketId
  };

  return (
    <IncidentContext.Provider value={contextValue}>
      {children}
    </IncidentContext.Provider>
  );
};

// Hook to use the incident context
export const useIncidents = () => {
  const context = useContext(IncidentContext);
  if (context === undefined) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
};
