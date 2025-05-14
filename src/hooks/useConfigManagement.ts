
import { useCategoryManagement } from './config/useCategoryManagement';
import { useLocationManagement } from './config/useLocationManagement';
import { useEducationalStructureManagement } from './config/useEducationalStructureManagement';
import { useDesignationManagement } from './config/useDesignationManagement';
import { useContributingFactorsManagement, ContributingFactor } from './config/useContributingFactorsManagement';
import { ConfigItem, SubcategoryItem, CampusItem, ClassItem, SectionItem } from '@/contexts/types';

export function useConfigManagement(
  initialCategories: ConfigItem[],
  initialSubcategories: Record<string, SubcategoryItem[]>,
  initialLocations: ConfigItem[],
  initialFacilities: ConfigItem[],
  initialDesignations: ConfigItem[],
  initialCampuses: CampusItem[],
  initialClasses: ClassItem[],
  initialSections: SectionItem[],
  initialContributingFactors: ContributingFactor[] = []
) {
  // Category and subcategory management
  const {
    categories,
    subcategoryMappings,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  } = useCategoryManagement(initialCategories, initialSubcategories);

  // Location and facility management
  const {
    locations,
    facilities,
    addLocation,
    updateLocation,
    deleteLocation,
    addFacility,
    updateFacility,
    deleteFacility
  } = useLocationManagement(initialLocations, initialFacilities);

  // Educational structure management (campuses, classes, sections)
  const {
    campuses,
    classes,
    sections,
    addCampus,
    updateCampus,
    deleteCampus,
    addClass,
    updateClass,
    deleteClass,
    addSection,
    updateSection,
    deleteSection
  } = useEducationalStructureManagement(initialCampuses, initialClasses, initialSections);

  // Designation management
  const {
    designations,
    addDesignation,
    updateDesignation,
    deleteDesignation
  } = useDesignationManagement(initialDesignations);

  // Contributing factors management
  const {
    contributingFactors,
    addContributingFactor,
    updateContributingFactor,
    deleteContributingFactor
  } = useContributingFactorsManagement(initialContributingFactors);

  return {
    // Category and subcategory management
    categories,
    subcategoryMappings,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    
    // Location and facility management
    locations,
    facilities,
    addLocation,
    updateLocation,
    deleteLocation,
    addFacility,
    updateFacility,
    deleteFacility,
    
    // Educational structure management
    campuses,
    classes,
    sections,
    addCampus,
    updateCampus,
    deleteCampus,
    addClass,
    updateClass,
    deleteClass,
    addSection,
    updateSection,
    deleteSection,
    
    // Designation management
    designations,
    addDesignation,
    updateDesignation,
    deleteDesignation,

    // Contributing factors management
    contributingFactors,
    addContributingFactor,
    updateContributingFactor,
    deleteContributingFactor
  };
}
