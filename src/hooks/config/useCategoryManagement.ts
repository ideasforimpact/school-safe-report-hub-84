
import { useState, useEffect } from 'react';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';

export function useCategoryManagement(
  initialCategories: ConfigItem[],
  initialSubcategories: Record<string, SubcategoryItem[]>
) {
  // Categories state
  const [categories, setCategories] = useState<ConfigItem[]>([]);
  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, SubcategoryItem[]>>({});
  const [initialized, setInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      // First, try to load categories from localStorage
      const savedCategories = localStorage.getItem('categories');
      const parsedCategories = savedCategories ? JSON.parse(savedCategories) : initialCategories;
      
      // Set initial categories state
      setCategories(parsedCategories);
      
      // Load subcategories
      const savedSubcategories = localStorage.getItem('subcategories');
      const parsedSubcategories = savedSubcategories ? 
        JSON.parse(savedSubcategories) : initialSubcategories;
      
      setSubcategoryMappings(parsedSubcategories);
      
      // Save initial data to localStorage if not already there
      if (!savedCategories) {
        localStorage.setItem('categories', JSON.stringify(parsedCategories));
      }
      
      if (!savedSubcategories) {
        localStorage.setItem('subcategories', JSON.stringify(parsedSubcategories));
      }

      setInitialized(true);
    } catch (e) {
      console.error('Error initializing category management:', e);
      // Fall back to initialCategories if there's an error
      setCategories(initialCategories);
      setSubcategoryMappings(initialSubcategories);
      setInitialized(true);
    }
  }, [initialCategories, initialSubcategories]);

  // Categories management
  const addCategory = (name: string): ConfigItem => {
    if (!name.trim()) {
      throw new Error("Category name cannot be empty");
    }
    
    // Check for duplicate category names before modifying state
    const nameToCheck = name.trim().toLowerCase();
    const exists = categories.some(cat => cat.name.toLowerCase() === nameToCheck);
    
    if (exists) {
      throw new Error(`Category "${name}" already exists`);
    }

    const newCategory = {
      id: Date.now().toString(),
      name: name.trim()
    };
    
    // Update categories state
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    
    // Save to localStorage
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    
    // Initialize empty subcategory list for this category
    const updatedSubcategories = {
      ...subcategoryMappings,
      [newCategory.id]: []
    };
    setSubcategoryMappings(updatedSubcategories);
    
    // Save subcategories to localStorage
    localStorage.setItem('subcategories', JSON.stringify(updatedSubcategories));
    
    console.log("Category added:", newCategory);
    return newCategory; // Return the new category
  };

  const updateCategory = (id: string, name: string) => {
    if (!name.trim()) {
      throw new Error("Category name cannot be empty");
    }
    
    // Check if the new name already exists for another category
    const nameToCheck = name.trim().toLowerCase();
    const exists = categories.some(cat => 
      cat.id !== id && cat.name.toLowerCase() === nameToCheck
    );
    
    if (exists) {
      throw new Error(`Category "${name}" already exists`);
    }

    // Find if the category exists
    const categoryExists = categories.some(cat => cat.id === id);
    if (!categoryExists) {
      throw new Error(`Category with ID "${id}" not found`);
    }
    
    // Update categories state
    const updatedCategories = categories.map(cat => 
      cat.id === id ? { ...cat, name: name.trim() } : cat
    );
    
    setCategories(updatedCategories);
    
    // Save to localStorage
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    console.log("Category updated:", id, name);
  };

  const deleteCategory = (id: string) => {
    // Check if the category exists
    const categoryExists = categories.some(cat => cat.id === id);
    if (!categoryExists) {
      throw new Error(`Category with ID "${id}" not found`);
    }
    
    // Update categories state
    const updatedCategories = categories.filter(cat => cat.id !== id);
    setCategories(updatedCategories);
    
    // Save to localStorage
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    
    // Remove subcategories for this category
    const { [id]: removedCategory, ...remainingSubcategories } = subcategoryMappings;
    setSubcategoryMappings(remainingSubcategories);
    
    // Save subcategories to localStorage
    localStorage.setItem('subcategories', JSON.stringify(remainingSubcategories));
    
    console.log("Category deleted:", id);
  };

  // Subcategories management
  const addSubcategory = (categoryId: string, name: string): SubcategoryItem => {
    if (!name.trim()) {
      throw new Error("Subcategory name cannot be empty");
    }
    
    // Check if the category exists
    const categoryExists = categories.some(cat => cat.id === categoryId);
    if (!categoryExists) {
      throw new Error(`Category with ID "${categoryId}" not found`);
    }
    
    // Check for duplicate subcategory names
    const nameToCheck = name.trim().toLowerCase();
    const categorySubcategories = subcategoryMappings[categoryId] || [];
    const exists = categorySubcategories.some(
      subcat => subcat.name.toLowerCase() === nameToCheck
    );
    
    if (exists) {
      throw new Error(`Subcategory "${name}" already exists in this category`);
    }
    
    const newSubcategory = {
      id: `${categoryId}-${Date.now()}`,
      name: name.trim()
    };
    
    // Update subcategories state
    const updatedSubcategories = {
      ...subcategoryMappings,
      [categoryId]: [...(subcategoryMappings[categoryId] || []), newSubcategory]
    };
    
    setSubcategoryMappings(updatedSubcategories);
    
    // Save to localStorage
    localStorage.setItem('subcategories', JSON.stringify(updatedSubcategories));
    
    console.log("Subcategory added:", categoryId, newSubcategory);
    return newSubcategory; // Return the new subcategory
  };

  const updateSubcategory = (categoryId: string, id: string, name: string) => {
    if (!name.trim()) {
      throw new Error("Subcategory name cannot be empty");
    }
    
    // Check if the category exists
    const categoryExists = categories.some(cat => cat.id === categoryId);
    if (!categoryExists) {
      throw new Error(`Category with ID "${categoryId}" not found`);
    }
    
    // Check if the subcategory exists
    const subcategoryExists = (subcategoryMappings[categoryId] || []).some(subcat => subcat.id === id);
    if (!subcategoryExists) {
      throw new Error(`Subcategory with ID "${id}" not found in category "${categoryId}"`);
    }
    
    // Check for duplicate subcategory names
    const nameToCheck = name.trim().toLowerCase();
    const categorySubcategories = subcategoryMappings[categoryId] || [];
    const exists = categorySubcategories.some(
      subcat => subcat.id !== id && subcat.name.toLowerCase() === nameToCheck
    );
    
    if (exists) {
      throw new Error(`Subcategory "${name}" already exists in this category`);
    }
    
    // Update subcategories state
    const updatedSubcategories = {
      ...subcategoryMappings,
      [categoryId]: (subcategoryMappings[categoryId] || []).map(subcat =>
        subcat.id === id ? { ...subcat, name: name.trim() } : subcat
      )
    };
    
    setSubcategoryMappings(updatedSubcategories);
    
    // Save to localStorage
    localStorage.setItem('subcategories', JSON.stringify(updatedSubcategories));
    console.log("Subcategory updated:", categoryId, id, name);
  };

  const deleteSubcategory = (categoryId: string, id: string) => {
    // Check if the category exists
    const categoryExists = categories.some(cat => cat.id === categoryId);
    if (!categoryExists) {
      throw new Error(`Category with ID "${categoryId}" not found`);
    }
    
    // Check if the subcategory exists
    const subcategoryExists = (subcategoryMappings[categoryId] || []).some(subcat => subcat.id === id);
    if (!subcategoryExists) {
      throw new Error(`Subcategory with ID "${id}" not found in category "${categoryId}"`);
    }
    
    // Update subcategories state
    const updatedSubcategories = {
      ...subcategoryMappings,
      [categoryId]: (subcategoryMappings[categoryId] || []).filter(
        subcat => subcat.id !== id
      )
    };
    
    setSubcategoryMappings(updatedSubcategories);
    
    // Save to localStorage
    localStorage.setItem('subcategories', JSON.stringify(updatedSubcategories));
    console.log("Subcategory deleted:", categoryId, id);
  };

  return {
    categories,
    subcategoryMappings,
    initialized,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  };
}
