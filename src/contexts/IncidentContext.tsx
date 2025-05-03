import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ConfigItem, SubcategoryItem, IncidentContextType } from './types';
import { useConfigManagement } from '@/hooks/useConfigManagement'; // Import useConfigManagement
import { sampleIncidentData } from './initialData';

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  const {
    categories,
    subcategoryMappings,
    locations,
    facilities,
    designations, // Add this
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
    addDesignation,  // Add this
    updateDesignation, // Add this
    deleteDesignation // Add this
  } = useConfigManagement(
    sampleIncidentData.categories,
    sampleIncidentData.subcategories,
    sampleIncidentData.locations,
    sampleIncidentData.facilities,
    [] // Add initial empty array for designations
  );

  const value: IncidentContextType = {
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

