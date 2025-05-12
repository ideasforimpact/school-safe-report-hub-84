
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
    return subcategoryMappings.map(subcategory => ({
      value: subcategory.id,
      label: subcategory.name
    }));
  }, [subcategoryMappings]);

  return {
    categoryOptions,
    subcategoryOptions
  };
}
