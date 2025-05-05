
import { useState, useEffect } from 'react';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';
import { toast } from '@/components/ui/sonner';

interface CategoryManagerProps {
  categories: ConfigItem[];
  subcategoryMappings: Record<string, SubcategoryItem[]>;
  addCategory: (name: string) => ConfigItem | void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, name: string) => SubcategoryItem | void;
  updateSubcategory: (categoryId: string, id: string, name: string) => void;
  deleteSubcategory: (categoryId: string, id: string) => void;
}

export function useCategoryManager({
  categories,
  subcategoryMappings,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory
}: CategoryManagerProps) {
  // Local state to track categories and subcategories
  const [localCategories, setLocalCategories] = useState<ConfigItem[]>([]);
  const [localSubcategoryMappings, setLocalSubcategoryMappings] = useState<Record<string, any>>({});

  // Sync local state with context when it changes
  useEffect(() => {
    setLocalCategories(categories);
    setLocalSubcategoryMappings(subcategoryMappings);
  }, [categories, subcategoryMappings]);

  const handleAddCategory = (name: string) => {
    if (!name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    try {
      // Call addCategory
      const result = addCategory(name);
      console.log("Category add result:", result);
      
      // The update to categories will happen in the parent context
      // and will flow down through the categories prop
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add category");
    }
  };

  const handleUpdateCategory = (id: string, name: string) => {
    try {
      updateCategory(id, name);
      // Update local state immediately
      setLocalCategories(prevCategories => prevCategories.map(cat => 
        cat.id === id ? { ...cat, name } : cat
      ));
      console.log("Category updated:", id, name);
      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update category");
    }
  };

  const handleDeleteCategory = (id: string) => {
    try {
      deleteCategory(id);
      // Update local state immediately
      setLocalCategories(prevCategories => prevCategories.filter(cat => cat.id !== id));
      // Also remove from subcategory mappings
      const { [id]: _, ...rest } = localSubcategoryMappings;
      setLocalSubcategoryMappings(rest);
      console.log("Category deleted:", id);
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  const handleAddSubcategory = (categoryId: string, name: string) => {
    try {
      // Call addSubcategory
      const result = addSubcategory(categoryId, name);
      console.log("Subcategory add result:", result);
      
      // The update will happen in the parent context
      // and flow down through the subcategoryMappings prop
      toast.success("Subcategory added successfully");
    } catch (error) {
      console.error("Error adding subcategory:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add subcategory");
    }
  };

  const handleUpdateSubcategory = (categoryId: string, id: string, name: string) => {
    try {
      updateSubcategory(categoryId, id, name);
      // Update local state immediately
      setLocalSubcategoryMappings(prev => ({
        ...prev,
        [categoryId]: (prev[categoryId] || []).map(sub => 
          sub.id === id ? { ...sub, name } : sub
        )
      }));
      toast.success("Subcategory updated successfully");
    } catch (error) {
      console.error("Error updating subcategory:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update subcategory");
    }
  };

  const handleDeleteSubcategory = (categoryId: string, id: string) => {
    try {
      deleteSubcategory(categoryId, id);
      // Update local state immediately
      setLocalSubcategoryMappings(prev => ({
        ...prev,
        [categoryId]: (prev[categoryId] || []).filter(sub => sub.id !== id)
      }));
      toast.success("Subcategory deleted successfully");
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete subcategory");
    }
  };

  return {
    localCategories,
    localSubcategoryMappings,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleAddSubcategory,
    handleUpdateSubcategory,
    handleDeleteSubcategory
  };
}
