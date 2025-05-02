
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { generateTicketId, sampleUsers } from '@/utils/incidentUtils';
import { useIncidentActions } from '@/hooks/useIncidentActions';
import { useActionItems } from '@/hooks/useActionItems';
import { useActivities } from '@/hooks/useActivities';
import { useComments } from '@/hooks/useComments';
import { useConfigManagement } from '@/hooks/useConfigManagement';
import { Incident, User, Activity } from '@/types/incident';
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

export const IncidentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
