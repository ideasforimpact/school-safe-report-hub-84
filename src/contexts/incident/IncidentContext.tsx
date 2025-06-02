
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

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  // Local state for incidents - no automatic fetching
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // Manual fetch function that can be called when needed
  const fetchIncidents = async () => {
    // This will be implemented by components that need it
    return Promise.resolve();
  };

  // Wrapper function for refetching
  const refetchIncidents = async () => {
    await fetchIncidents();
  };

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

  // Incident actions
  const {
    addIncident: originalAddIncident,
    updateIncident: originalUpdateIncident,
    getIncident,
    addActivity,
    isSubmitting
  } = useIncidentActions(incidents, refetchIncidents, activities, setActivities, users);

  // Wrapper functions
  const addIncident = async (incidentData: any) => {
    const result = await originalAddIncident(incidentData);
    await new Promise(resolve => setTimeout(resolve, 300));
    return result;
  };

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    const result = await originalUpdateIncident(id, updates);
    await new Promise(resolve => setTimeout(resolve, 200));
    return result;
  };

  // Use hooks
  const {
    getRecentActivities,
    getIncidentActivities
  } = useActivities(incidents, activities);

  const {
    addComment,
    updateComment,
    deleteComment
  } = useComments(incidents, () => {}, activities, setActivities, users);

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
    isSubmitting,
    // Add new methods for manual incident loading
    fetchIncidents,
    loading,
    error,
    setIncidents
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
