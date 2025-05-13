
import { IncidentCategory, IncidentSubcategory } from '@/types/supabase';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';

// Convert database categories to application format
export const dbToConfigItems = (categories: IncidentCategory[]): ConfigItem[] => {
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name
  }));
};

// Convert database subcategories to application format
export const dbToSubcategoryItems = (subcategories: IncidentSubcategory[]): SubcategoryItem[] => {
  return subcategories.map(subcat => ({
    id: subcat.id,
    name: subcat.name
  }));
};

// Group subcategories by category ID
export const groupSubcategoriesByCategory = (
  subcategories: IncidentSubcategory[]
): Record<string, SubcategoryItem[]> => {
  const grouped: Record<string, SubcategoryItem[]> = {};
  
  subcategories.forEach(subcat => {
    if (!grouped[subcat.category_id]) {
      grouped[subcat.category_id] = [];
    }
    
    grouped[subcat.category_id].push({
      id: subcat.id,
      name: subcat.name
    });
  });
  
  return grouped;
};
