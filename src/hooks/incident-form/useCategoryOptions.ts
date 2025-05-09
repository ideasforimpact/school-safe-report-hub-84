
import { useEffect, useState } from 'react';
import { useIncidents } from '@/contexts/incident/IncidentContext';

interface CategoryOption {
  value: string;
  label: string;
}

export function useCategoryOptions() {
  const { categories, subcategoryMappings } = useIncidents();
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<CategoryOption[]>([]);

  useEffect(() => {
    // Transform categories data to options format
    const options = categories.map(category => ({
      value: category.id,
      label: category.name
    }));
    
    setCategoryOptions(options);
  }, [categories]);

  return {
    categoryOptions,
    subcategoryOptions
  };
}
