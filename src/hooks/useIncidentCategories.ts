
import { useState, useEffect } from 'react';
import { categoryService, CategoryItem, SubcategoryItem } from '@/services/incident/categoryService';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from 'sonner';

export function useIncidentCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, SubcategoryItem[]>>({});
  const [loading, setLoading] = useState(true);
  const { employeeData } = useAuth();

  // Load categories and subcategories on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        if (!employeeData?.clientId) {
          toast.error('Client information not available');
          return;
        }

        const [categoriesData, subcategoriesData] = await Promise.all([
          categoryService.getCategories(employeeData.clientId),
          categoryService.getSubcategories(undefined, employeeData.clientId)
        ]);

        setCategories(categoriesData);
        
        // Group subcategories by category_id
        const mappings: Record<string, SubcategoryItem[]> = {};
        subcategoriesData.forEach(sub => {
          if (sub.category_id) {
            if (!mappings[sub.category_id]) {
              mappings[sub.category_id] = [];
            }
            mappings[sub.category_id].push(sub);
          }
        });
        
        setSubcategoryMappings(mappings);
      } catch (error) {
        console.error('Error loading categories and subcategories:', error);
        toast.error('Failed to load categories and subcategories');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [employeeData?.clientId]);

  // Category operations
  const addCategory = async (name: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      const newCategory = await categoryService.addCategory(name, undefined, employeeData.clientId);
      setCategories(prev => [...prev, newCategory]);
      setSubcategoryMappings(prev => ({
        ...prev,
        [newCategory.id]: []
      }));
      toast.success('Category added successfully');
    } catch (error: any) {
      console.error('Error adding category:', error);
      // The service already shows the error toast, so we don't need to show another one
      throw error; // Re-throw to let the component handle it
    }
  };

  const updateCategory = async (id: string, name: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await categoryService.updateCategory(id, name, undefined, employeeData.clientId);
      setCategories(prev => prev.map(cat => 
        cat.id === id ? { ...cat, name } : cat
      ));
      toast.success('Category updated successfully');
    } catch (error: any) {
      console.error('Error updating category:', error);
      // The service already shows the error toast, so we don't need to show another one
      throw error; // Re-throw to let the component handle it
    }
  };

  const deleteCategory = async (id: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await categoryService.deleteCategory(id, employeeData.clientId);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      setSubcategoryMappings(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      // Error toast is already handled by the service
    }
  };

  // Subcategory operations - Ensure client_id is passed
  const addSubcategory = async (categoryId: string, name: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      const newSubcategory = await categoryService.addSubcategory(name, categoryId, undefined, employeeData.clientId);
      setSubcategoryMappings(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), newSubcategory]
      }));
      toast.success('Subcategory added successfully');
    } catch (error: any) {
      console.error('Error adding subcategory:', error);
      // The service already shows the error toast, so we don't need to show another one
      throw error; // Re-throw to let the component handle it
    }
  };

  const updateSubcategory = async (categoryId: string, id: string, name: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await categoryService.updateSubcategory(id, name, categoryId, undefined, employeeData.clientId);
      setSubcategoryMappings(prev => ({
        ...prev,
        [categoryId]: prev[categoryId].map(subcat =>
          subcat.id === id ? { ...subcat, name } : subcat
        )
      }));
      toast.success('Subcategory updated successfully');
    } catch (error: any) {
      console.error('Error updating subcategory:', error);
      // The service already shows the error toast, so we don't need to show another one
      throw error; // Re-throw to let the component handle it
    }
  };

  const deleteSubcategory = async (categoryId: string, id: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await categoryService.deleteSubcategory(id, employeeData.clientId);
      setSubcategoryMappings(prev => ({
        ...prev,
        [categoryId]: prev[categoryId].filter(subcat => subcat.id !== id)
      }));
      toast.success('Subcategory deleted successfully');
    } catch (error) {
      console.error('Error deleting subcategory:', error);
    }
  };

  return {
    categories,
    subcategoryMappings,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  };
}
