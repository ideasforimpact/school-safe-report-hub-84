
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ConfigItem, SubcategoryItem, IncidentContextType, SectionItem } from './types';
import { useConfigManagement } from '@/hooks/useConfigManagement'; 
import { initialCategories, initialSubcategories, initialLocations, initialFacilities, initialDesignations, initialClasses, initialSections } from './initialData';
import { generateSampleIncidents } from '@/utils/sampleIncidentData';

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  const [incidents, setIncidents] = useState(generateSampleIncidents());
  const [users] = useState<IncidentContextType['users']>([]);

  const {
    categories,
    subcategoryMappings,
    locations,
    facilities,
    designations,
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
    initialClasses,
    initialSections  // Now this is correctly typed as SectionItem[]
  );

  // Stub implementation for required methods
  const addIncident = () => {};
  const updateIncident = () => {};
  const getIncident = () => undefined;
  const addActionItem = () => {};
  const updateActionItem = () => {};
  const deleteActionItem = () => {};
  const addComment = () => {};
  const updateComment = () => {};
  const deleteComment = () => {};
  const getRecentActivities = () => [];
  const getIncidentActivities = () => [];
  const generateTicketId = () => `SR-${Math.floor(Math.random() * 1000000)}-${Math.floor(Math.random() * 1000)}`;

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
    classes,
    addClass,
    updateClass,
    deleteClass,
    sections,
    addSection,
    updateSection,
    deleteSection,
    // Add the required methods to satisfy the IncidentContextType
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
    generateTicketId
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
