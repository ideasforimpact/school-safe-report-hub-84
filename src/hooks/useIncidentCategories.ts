
import { useState, useEffect, useCallback } from "react";
import { categoryService, CategoryItem, SubcategoryItem } from "@/services/incident/categoryService";
import { toast } from "sonner";

export function useIncidentCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, SubcategoryItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData);
      return categoriesData;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubcategories = useCallback(async (categoryId?: string) => {
    try {
      const subcategories = await categoryService.getSubcategories(categoryId);
      
      // Group subcategories by category_id
      const mappings: Record<string, SubcategoryItem[]> = {};
      subcategories.forEach(subcategory => {
        const catId = subcategory.category_id || 'uncategorized';
        if (!mappings[catId]) {
          mappings[catId] = [];
        }
        mappings[catId].push(subcategory);
      });
      
      setSubcategoryMappings(mappings);
      return subcategories;
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const categoriesData = await fetchCategories();
      await fetchSubcategories();
      return categoriesData;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, fetchSubcategories]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const addCategory = async (name: string) => {
    try {
      const newCategory = await categoryService.addCategory(name);
      setCategories(prev => [...prev, newCategory]);
      
      // Initialize empty subcategory list for this category
      setSubcategoryMappings(prev => ({
        ...prev,
        [newCategory.id]: []
      }));
      
      toast.success("Category added successfully");
      return newCategory;
    } catch (err: any) {
      toast.error("Failed to add category");
      setError(err.message);
      throw err;
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      const updatedCategory = await categoryService.updateCategory(id, name);
      setCategories(prev => 
        prev.map(cat => cat.id === id ? updatedCategory : cat)
      );
      toast.success("Category updated successfully");
    } catch (err: any) {
      toast.error("Failed to update category");
      setError(err.message);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      // Remove subcategories for this category
      setSubcategoryMappings(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      
      toast.success("Category deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete category");
      setError(err.message);
      throw err;
    }
  };

  const addSubcategory = async (categoryId: string, name: string) => {
    try {
      const newSubcategory = await categoryService.addSubcategory(name, categoryId);
      
      setSubcategoryMappings(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), newSubcategory]
      }));
      
      toast.success("Subcategory added successfully");
      return newSubcategory;
    } catch (err: any) {
      toast.error("Failed to add subcategory");
      setError(err.message);
      throw err;
    }
  };

  const updateSubcategory = async (categoryId: string, id: string, name: string) => {
    try {
      const updatedSubcategory = await categoryService.updateSubcategory(id, name, categoryId);
      
      setSubcategoryMappings(prev => ({
        ...prev,
        [categoryId]: prev[categoryId]?.map(subcat =>
          subcat.id === id ? updatedSubcategory : subcat
        ) || []
      }));
      
      toast.success("Subcategory updated successfully");
    } catch (err: any) {
      toast.error("Failed to update subcategory");
      setError(err.message);
      throw err;
    }
  };

  const deleteSubcategory = async (categoryId: string, id: string) => {
    try {
      await categoryService.deleteSubcategory(id);
      
      setSubcategoryMappings(prev => ({
        ...prev,
        [categoryId]: prev[categoryId]?.filter(subcat => subcat.id !== id) || []
      }));
      
      toast.success("Subcategory deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete subcategory");
      setError(err.message);
      throw err;
    }
  };

  return {
    categories,
    subcategoryMappings,
    loading,
    error,
    fetchCategories,
    fetchSubcategories,
    fetchAllData,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  };
}
