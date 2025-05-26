import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { IncidentContextType } from './types';
import { useConfigManagement } from '@/hooks/useConfigManagement'; 
import { 
  initialCategories, 
  initialSubcategories, 
  initialLocations, 
  initialFacilities, 
  initialDesignations, 
  initialCampuses, 
  initialClasses, 
  initialSections 
} from './initialData';
import { useIncidentActions } from '@/hooks/useIncidentActions';
import { useActivities } from '@/hooks/useActivities';
import { useComments } from '@/hooks/useComments';
import { useActionItems } from '@/hooks/useActionItems';
import { generateTicketId } from '@/utils/incidentUtils';
import { Activity, Incident } from '@/types/incident';
import { useIncidentData } from '@/hooks/useIncidentData';

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  // Use the data fetching hook that includes client_id restrictions
  const { incidents: fetchedIncidents, loading, error, refetchIncidents } = useIncidentData();
  
  // Local state that syncs with fetched incidents
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users] = useState<IncidentContextType['users']>([
    { 
      id: '1', 
      name: 'Admin User',
      role: 'Admin'
    },
    { 
      id: '2', 
      name: 'Safety Officer',
      role: 'Safety Officer'
    },
    { 
      id: '3', 
      name: 'Teacher User',
      role: 'Teacher'
    }
  ]);

  // Sync local incidents state with fetched incidents - with enhanced logging
  useEffect(() => {
    console.log('IncidentContext: Syncing fetched incidents with context state');
    console.log('Fetched incidents count:', fetchedIncidents.length);
    console.log('Fetched incidents IDs:', fetchedIncidents.map(inc => inc.id));
    
    // Ensure we have a complete new array reference for React to detect changes
    const newIncidents = [...fetchedIncidents];
    setIncidents(newIncidents);
    
    console.log('IncidentContext: Context state updated with incidents count:', newIncidents.length);
  }, [fetchedIncidents, fetchedIncidents.length]); // Added dependency on length to catch array changes

  // Monitor local state changes
  useEffect(() => {
    console.log('IncidentContext: Local incidents state changed, count:', incidents.length);
    console.log('IncidentContext: Local incidents IDs:', incidents.map(inc => inc.id));
  }, [incidents, incidents.length]);

  const {
    categories,
    subcategoryMappings,
    locations,
    facilities,
    designations,
    campuses,
    classes,
    sections,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addLocation,
    updateLocation,
    deleteLocation,
    addFacility,
    updateFacility,
    deleteFacility,
    addDesignation,
    updateDesignation,
    deleteDesignation,
    addCampus,
    updateCampus,
    deleteCampus,
    addClass,
    updateClass,
    deleteClass,
    addSection,
    updateSection,
    deleteSection
  } = useConfigManagement(
    initialCategories,
    initialSubcategories,
    initialLocations,
    initialFacilities,
    initialDesignations,
    initialCampuses,
    initialClasses,
    initialSections
  );

  // Enhanced incident actions that automatically refetch after operations
  const {
    addIncident: originalAddIncident,
    updateIncident: originalUpdateIncident,
    getIncident,
    addActivity,
    isSubmitting
  } = useIncidentActions(incidents, refetchIncidents, activities, setActivities, users);

  // Wrapper for addIncident that ensures proper state synchronization
  const addIncident = async (incidentData: any) => {
    console.log('IncidentContext: Adding new incident');
    const result = await originalAddIncident(incidentData);
    console.log('IncidentContext: Incident added, triggering additional sync');
    // Additional delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 300));
    return result;
  };

  // Wrapper for updateIncident that refetches data
  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    console.log('IncidentContext: Updating incident', id);
    const result = await originalUpdateIncident(id, updates);
    // Additional delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 200));
    return result;
  };

  // Use the activities hook
  const {
    getRecentActivities,
    getIncidentActivities
  } = useActivities(incidents, activities);

  // Use the comments hook - create a dummy setIncidents function since we don't need it
  const {
    addComment,
    updateComment,
    deleteComment
  } = useComments(incidents, () => {}, activities, setActivities, users);

  // Use the action items hook
  const {
    addActionItem,
    updateActionItem,
    deleteActionItem
  } = useActionItems();

  const value: IncidentContextType = {
    incidents,
    users,
    categories,
    addCategory,
    deleteCategory,
    updateCategory,
    subcategoryMappings,
    addSubcategory,
    deleteSubcategory,
    updateSubcategory,
    locations,
    addLocation,
    deleteLocation,
    updateLocation,
    facilities,
    addFacility,
    deleteFacility,
    updateFacility,
    designations,
    addDesignation,
    updateDesignation,
    deleteDesignation,
    campuses,
    addCampus,
    updateCampus,
    deleteCampus,
    classes,
    addClass,
    updateClass,
    deleteClass,
    sections,
    addSection,
    updateSection,
    deleteSection,
    addIncident,
    updateIncident,
    getIncident,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    addComment,
    updateComment,
    deleteComment,
    getRecentActivities,
    getIncidentActivities,
    generateTicketId,
    isSubmitting
  };

  return (
    <IncidentContext.Provider value={value}>
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncidents = () => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
};

// Re-export types needed by other components
export type { IncidentContextType };
