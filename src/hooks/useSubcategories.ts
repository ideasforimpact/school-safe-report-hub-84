
import { useState, useEffect } from 'react';

export function useSubcategories(
  categoryId: string, 
  subcategoryMappings: Record<string, {id: string, name: string}[]>,
  setFormData: React.Dispatch<React.SetStateAction<any>>
) {
  // State for available subcategories based on selected category
  const [availableSubcategories, setAvailableSubcategories] = useState<{id: string, name: string}[]>([]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (!categoryId) {
      setAvailableSubcategories([]);
      return;
    }

    // Get subcategories for this category
    const subcats = subcategoryMappings[categoryId] || [];
    setAvailableSubcategories(subcats);
  }, [categoryId, subcategoryMappings]);

  // Reset subcategory when available subcategories change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      subcategory: ''
    }));
  }, [availableSubcategories, setFormData]);

  return {
    availableSubcategories
  };
}
