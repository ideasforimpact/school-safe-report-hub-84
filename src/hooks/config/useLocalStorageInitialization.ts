
import { useState } from 'react';
import { ConfigItem, SubcategoryItem, SectionItem, ClassItem, CampusItem } from '@/contexts/types';

export function useLocalStorageInitialization<T>(key: string, initialValue: T): T {
  return useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  })[0];
}

export function initializeFromLocalStorage(
  initialCategories: ConfigItem[],
  initialSubcategories: Record<string, SubcategoryItem[]>,
  initialLocations: ConfigItem[],
  initialFacilities: ConfigItem[],
  initialDesignations: ConfigItem[] = [],
  initialCampuses: CampusItem[] = [],
  initialClasses: ClassItem[] = [],
  initialSections: SectionItem[] = []
) {
  const categories = useLocalStorageInitialization('categories', initialCategories);
  const subcategoryMappings = useLocalStorageInitialization('subcategories', initialSubcategories);
  const locations = useLocalStorageInitialization('locations', initialLocations);
  const facilities = useLocalStorageInitialization('facilities', initialFacilities);
  const designations = useLocalStorageInitialization('designations', initialDesignations);
  const campuses = useLocalStorageInitialization('campuses', initialCampuses);
  const classes = useLocalStorageInitialization('classes', initialClasses);
  const sections = useLocalStorageInitialization('sections', initialSections);
  
  return {
    categories,
    subcategoryMappings,
    locations,
    facilities,
    designations,
    campuses,
    classes,
    sections
  };
}
