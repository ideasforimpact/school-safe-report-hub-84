
import { useMemo } from 'react';
import { useIncidents } from '@/contexts/incident/IncidentContext';

export function useCategoryOptions() {
  const { categories, subcategoryMappings } = useIncidents();

  // Convert categories to options format for select components
  const categoryOptions = useMemo(() => {
    return categories.map(category => ({
      value: category.id,
      label: category.name
    }));
  }, [categories]);

  // Get subcategory options based on selected category
  const subcategoryOptions = useMemo(() => {
    // Return all subcategories for now - this will be filtered by the selected category in a parent component
    const allSubcategories = [];
    // Flatten all subcategory mappings into a single array
    Object.values(subcategoryMappings).forEach(subcategoryArray => {
      if (Array.isArray(subcategoryArray)) {
        subcategoryArray.forEach(subcategory => {
          allSubcategories.push({
            value: subcategory.id,
            label: subcategory.name
          });
        });
      }
    });
    return allSubcategories;
  }, [subcategoryMappings]);

  return {
    categoryOptions,
    subcategoryOptions
  };
}
