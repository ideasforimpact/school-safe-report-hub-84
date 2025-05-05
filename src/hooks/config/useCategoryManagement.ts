
import { useState, useEffect } from 'react';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';

export function useCategoryManagement(
  initialCategories: ConfigItem[],
  initialSubcategories: Record<string, SubcategoryItem[]>
) {
  // Categories state
  const [categories, setCategories] = useState<ConfigItem[]>(initialCategories);
  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, SubcategoryItem[]>>(initialSubcategories);

  // Load from localStorage on mount and ensure initialCategories are present
  useEffect(() => {
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      try {
        const parsedCategories = JSON.parse(savedCategories);
        
        // Check if Digital Safety exists
        const digitalSafetyExists = parsedCategories.some(
          (cat: ConfigItem) => cat.name.toLowerCase() === 'digital safety'
        );
        
        if (!digitalSafetyExists) {
          // Add Digital Safety if it doesn't exist
          const digitalSafetyCategory = {
            id: Date.now().toString(),
            name: 'Digital Safety'
          };
          const updatedCategories = [...parsedCategories, digitalSafetyCategory];
          localStorage.setItem('categories', JSON.stringify(updatedCategories));
          setCategories(updatedCategories);
          
          // Initialize empty subcategory for Digital Safety
          setSubcategoryMappings(prev => {
            const updated = {
              ...prev,
              [digitalSafetyCategory.id]: []
            };
            localStorage.setItem('subcategories', JSON.stringify(updated));
            return updated;
          });
          
          console.log("Digital Safety category added during initialization");
        } else {
          setCategories(parsedCategories);
        }
      } catch (e) {
        console.error('Error parsing categories from localStorage', e);
        setCategories(initialCategories);
      }
    } else {
      // No categories in localStorage, use initialCategories and ensure Digital Safety exists
      const digitalSafetyExists = initialCategories.some(
        cat => cat.name.toLowerCase() === 'digital safety'
      );
      
      if (!digitalSafetyExists) {
        const digitalSafetyCategory = {
          id: Date.now().toString(),
          name: 'Digital Safety'
        };
        const updatedCategories = [...initialCategories, digitalSafetyCategory];
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        setCategories(updatedCategories);
        
        // Initialize empty subcategory for Digital Safety
        setSubcategoryMappings(prev => {
          const updated = {
            ...prev,
            [digitalSafetyCategory.id]: []
          };
          localStorage.setItem('subcategories', JSON.stringify(updated));
          return updated;
        });
        
        console.log("Digital Safety category added during initialization with empty localStorage");
      } else {
        setCategories(initialCategories);
        localStorage.setItem('categories', JSON.stringify(initialCategories));
      }
    }

    const savedSubcategories = localStorage.getItem('subcategories');
    if (savedSubcategories) {
      try {
        setSubcategoryMappings(JSON.parse(savedSubcategories));
      } catch (e) {
        console.error('Error parsing subcategories from localStorage', e);
        setSubcategoryMappings(initialSubcategories);
      }
    } else {
      localStorage.setItem('subcategories', JSON.stringify(initialSubcategories));
    }
  }, []);

  // Categories management
  const addCategory = (name: string) => {
    if (!name.trim()) {
      throw new Error("Category name cannot be empty");
    }
    
    const newCategory = {
      id: Date.now().toString(),
      name: name.trim()
    };
    
    setCategories(prev => {
      // Check for duplicate category names
      const exists = prev.some(cat => cat.name.toLowerCase() === name.trim().toLowerCase());
      if (exists) {
        throw new Error(`Category "${name}" already exists`);
      }
      const updated = [...prev, newCategory];
      // Save to localStorage
      localStorage.setItem('categories', JSON.stringify(updated));
      return updated;
    });
    
    // Initialize empty subcategory list for this category
    setSubcategoryMappings(prev => {
      const updated = {
        ...prev,
        [newCategory.id]: []
      };
      // Save to localStorage
      localStorage.setItem('subcategories', JSON.stringify(updated));
      return updated;
    });
    
    console.log("Category added:", newCategory);
    return newCategory; // Return the new category so we can use it if needed
  };

  const updateCategory = (id: string, name: string) => {
    if (!name.trim()) {
      throw new Error("Category name cannot be empty");
    }
    
    setCategories(prev => {
      const updated = prev.map(cat => 
        cat.id === id ? { ...cat, name: name.trim() } : cat
      );
      // Save to localStorage
      localStorage.setItem('categories', JSON.stringify(updated));
      return updated;
    });
    console.log("Category updated:", id, name);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => {
      const updated = prev.filter(cat => cat.id !== id);
      // Save to localStorage
      localStorage.setItem('categories', JSON.stringify(updated));
      return updated;
    });
    
    // Remove subcategories for this category
    setSubcategoryMappings(prev => {
      const { [id]: _, ...rest } = prev;
      // Save to localStorage
      localStorage.setItem('subcategories', JSON.stringify(rest));
      return rest;
    });
    
    console.log("Category deleted:", id);
  };

  // Subcategories management
  const addSubcategory = (categoryId: string, name: string) => {
    if (!name.trim()) {
      throw new Error("Subcategory name cannot be empty");
    }
    
    const newSubcategory = {
      id: `${categoryId}-${Date.now()}`,
      name: name.trim()
    };
    
    setSubcategoryMappings(prev => {
      const updated = {
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), newSubcategory]
      };
      // Save to localStorage
      localStorage.setItem('subcategories', JSON.stringify(updated));
      return updated;
    });
    
    console.log("Subcategory added:", categoryId, newSubcategory);
    return newSubcategory; // Return the new subcategory
  };

  const updateSubcategory = (categoryId: string, id: string, name: string) => {
    if (!name.trim()) {
      throw new Error("Subcategory name cannot be empty");
    }
    
    setSubcategoryMappings(prev => {
      const updated = {
        ...prev,
        [categoryId]: prev[categoryId].map(subcat =>
          subcat.id === id ? { ...subcat, name: name.trim() } : subcat
        )
      };
      // Save to localStorage
      localStorage.setItem('subcategories', JSON.stringify(updated));
      return updated;
    });
    console.log("Subcategory updated:", categoryId, id, name);
  };

  const deleteSubcategory = (categoryId: string, id: string) => {
    setSubcategoryMappings(prev => {
      const updated = {
        ...prev,
        [categoryId]: prev[categoryId].filter(subcat => subcat.id !== id)
      };
      // Save to localStorage
      localStorage.setItem('subcategories', JSON.stringify(updated));
      return updated;
    });
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
