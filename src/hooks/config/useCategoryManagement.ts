
import { useState } from 'react';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';

export function useCategoryManagement(
  initialCategories: ConfigItem[],
  initialSubcategories: Record<string, SubcategoryItem[]>
) {
  // Categories state
  const [categories, setCategories] = useState<ConfigItem[]>(initialCategories);
  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, SubcategoryItem[]>>(initialSubcategories);

  // Categories management
  const addCategory = (name: string) => {
    const newCategory = {
      id: Date.now().toString(),
      name
    };
    
    setCategories(prev => [...prev, newCategory]);
    
    // Initialize empty subcategory list for this category
    setSubcategoryMappings(prev => ({
      ...prev,
      [newCategory.id]: []
    }));
    
    console.log("Category added:", newCategory);
    return newCategory; // Return the new category so we can use it if needed
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, name } : cat
    ));
    console.log("Category updated:", id, name);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    
    // Remove subcategories for this category
    setSubcategoryMappings(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    
    console.log("Category deleted:", id);
  };

  // Subcategories management
  const addSubcategory = (categoryId: string, name: string) => {
    const newSubcategory = {
      id: `${categoryId}-${Date.now()}`,
      name
    };
    
    setSubcategoryMappings(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), newSubcategory]
    }));
    
    console.log("Subcategory added:", categoryId, newSubcategory);
    return newSubcategory; // Return the new subcategory
  };

  const updateSubcategory = (categoryId: string, id: string, name: string) => {
    setSubcategoryMappings(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].map(subcat =>
        subcat.id === id ? { ...subcat, name } : subcat
      )
    }));
    console.log("Subcategory updated:", categoryId, id, name);
  };

  const deleteSubcategory = (categoryId: string, id: string) => {
    setSubcategoryMappings(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter(subcat => subcat.id !== id)
    }));
    console.log("Subcategory deleted:", categoryId, id);
  };

  return {
    categories,
    subcategoryMappings,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  };
}
