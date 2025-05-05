
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ConfigItem, SubcategoryItem, IncidentContextType, SectionItem, CampusItem, ClassItem } from './types';
import { useConfigManagement } from '@/hooks/useConfigManagement'; 
import { initialCategories, initialSubcategories, initialLocations, initialFacilities, initialDesignations, initialCampuses, initialClasses, initialSections } from './initialData';
import { generateSampleIncidents } from '@/utils/sampleIncidentData';
import { useIncidentActions } from '@/hooks/useIncidentActions';
import { Activity, Incident, Comment } from '@/types/incident';

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  const [incidents, setIncidents] = useState(generateSampleIncidents());
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

  // Use the incident actions hook
  const {
    addIncident,
    updateIncident,
    getIncident,
    addActivity
  } = useIncidentActions(incidents, setIncidents, activities, setActivities, users);

  // Implement the required methods
  const addActionItem = () => {};
  
  const updateActionItem = () => {};
  
  const deleteActionItem = () => {};
  
  const addComment = (incidentId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newComment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now
    };
    
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId
          ? {
              ...incident,
              comments: [...(incident.comments || []), newComment]
            }
          : incident
      )
    );
    
    return newComment;
  };
  
  const updateComment = () => {};
  
  const deleteComment = () => {};
  
  const getRecentActivities = () => activities.slice(0, 10);
  
  const getIncidentActivities = (incidentId: string) => 
    activities.filter(activity => activity.entityId === incidentId);
  
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
