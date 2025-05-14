
import { ConfigItem, SubcategoryItem, SectionItem, ClassItem, CampusItem } from '@/contexts/types';
import { ConfigManagement } from './config/types';
import { useCategoryManagement } from './config/useCategoryManagement';
import { useLocationManagement } from './config/useLocationManagement';
import { useDesignationManagement } from './config/useDesignationManagement';
import { useEducationalStructureManagement } from './config/useEducationalStructureManagement';
import { useLocalStoragePersistence } from './config/useLocalStoragePersistence';
import { useState } from 'react';

export function useConfigManagement(
  initialCategories: ConfigItem[],
  initialSubcategories: Record<string, SubcategoryItem[]>,
  initialLocations: ConfigItem[],
  initialFacilities: ConfigItem[],
  initialDesignations: ConfigItem[] = [],
  initialCampuses: CampusItem[] = [],
  initialClasses: ClassItem[] = [],
  initialSections: SectionItem[] = []
): ConfigManagement {
  // Configuration state
  const [categories, setCategories] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, SubcategoryItem[]>>(() => {
    const saved = localStorage.getItem('subcategories');
    return saved ? JSON.parse(saved) : initialSubcategories;
  });

  const [locations, setLocations] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('locations');
    return saved ? JSON.parse(saved) : initialLocations;
  });

  const [facilities, setFacilities] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('facilities');
    return saved ? JSON.parse(saved) : initialFacilities;
  });

  const [designations, setDesignations] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('designations');
    return saved ? JSON.parse(saved) : initialDesignations;
  });

  const [campuses, setCampuses] = useState<CampusItem[]>(() => {
    const saved = localStorage.getItem('campuses');
    return saved ? JSON.parse(saved) : initialCampuses;
  });

  const [classes, setClasses] = useState<ClassItem[]>(() => {
    const saved = localStorage.getItem('classes');
    return saved ? JSON.parse(saved) : initialClasses;
  });

  const [sections, setSections] = useState<SectionItem[]>(() => {
    const saved = localStorage.getItem('sections');
    return saved ? JSON.parse(saved) : initialSections;
  });

  // Get category and subcategory management functions
  const categoryManagement = useCategoryManagement(categories, subcategoryMappings);
  
  // Get location and facility management functions
  const locationManagement = useLocationManagement(locations, facilities);
  
  // Get designation management functions
  const designationManagement = useDesignationManagement(designations);
  
  // Get educational structure management functions
  const educationalStructureManagement = useEducationalStructureManagement(
    campuses,
    classes,
    sections
  );

  // Set up localStorage persistence
  useLocalStoragePersistence({
    categories,
    subcategoryMappings,
    locations,
    facilities,
    designations,
    campuses,
    classes,
    sections
  });

  return {
    // State
    categories,
    subcategoryMappings,
    locations,
    facilities,
    designations,
    campuses,
    classes,
    sections,
    // Functions from category management
    addCategory: categoryManagement.addCategory,
    updateCategory: categoryManagement.updateCategory,
    deleteCategory: categoryManagement.deleteCategory,
    addSubcategory: categoryManagement.addSubcategory,
    updateSubcategory: categoryManagement.updateSubcategory,
    deleteSubcategory: categoryManagement.deleteSubcategory,
    // Functions from location management
    addLocation: locationManagement.addLocation,
    updateLocation: locationManagement.updateLocation,
    deleteLocation: locationManagement.deleteLocation,
    addFacility: locationManagement.addFacility,
    updateFacility: locationManagement.updateFacility,
    deleteFacility: locationManagement.deleteFacility,
    // Functions from designation management
    addDesignation: designationManagement.addDesignation,
    updateDesignation: designationManagement.updateDesignation,
    deleteDesignation: designationManagement.deleteDesignation,
    // Functions from educational structure management
    addCampus: educationalStructureManagement.addCampus,
    updateCampus: educationalStructureManagement.updateCampus,
    deleteCampus: educationalStructureManagement.deleteCampus,
    addClass: educationalStructureManagement.addClass,
    updateClass: educationalStructureManagement.updateClass,
    deleteClass: educationalStructureManagement.deleteClass,
    addSection: educationalStructureManagement.addSection,
    updateSection: educationalStructureManagement.updateSection,
    deleteSection: educationalStructureManagement.deleteSection
  };
}
