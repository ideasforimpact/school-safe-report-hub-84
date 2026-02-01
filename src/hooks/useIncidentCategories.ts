
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
  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, [employeeData?.clientId]);

  // Category operations
  const addCategory = async (name: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await categoryService.addCategory(name, undefined, employeeData.clientId);
      
      // Refresh data from server to ensure consistency
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
      
      // Refresh data from server to ensure consistency
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
      toast.success('Category updated successfully');
    } catch (error: any) {
      console.error('Error updating category:', error);
      // The service already shows the error toast, so we don't need to show another one
      throw error; // Re-throw to let the component handle it
    }
  };

  const deleteCategory = async (id: string) => {
    console.log('Hook: deleteCategory called with id:', id);
    
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      console.log('Hook: Calling categoryService.deleteCategory...');
      await categoryService.deleteCategory(id, employeeData.clientId);
      console.log('Hook: Category service delete completed successfully');
      
      // Refresh data from server to ensure consistency
      console.log('Hook: Refreshing data from server...');
      const [categoriesData, subcategoriesData] = await Promise.all([
        categoryService.getCategories(employeeData.clientId),
        categoryService.getSubcategories(undefined, employeeData.clientId)
      ]);

      console.log('Hook: Received refreshed data:', { 
        categoriesCount: categoriesData.length, 
        subcategoriesCount: subcategoriesData.length 
      });

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
      console.log('Hook: State updated successfully');
      toast.success('Category deleted successfully');
    } catch (error: any) {
      console.error('Hook: Error deleting category:', error);
      // Re-throw the error so the component can handle it and show the specific error message
      throw error;
    }
  };

  // Subcategory operations - Ensure client_id is passed
  const addSubcategory = async (categoryId: string, name: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await categoryService.addSubcategory(name, categoryId, undefined, employeeData.clientId);
      
      // Refresh subcategories from server to ensure consistency
      const subcategoriesData = await categoryService.getSubcategories(undefined, employeeData.clientId);
      
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
      
      // Refresh subcategories from server to ensure consistency
      const subcategoriesData = await categoryService.getSubcategories(undefined, employeeData.clientId);
      
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
      
      // Refresh subcategories from server to ensure consistency
      const subcategoriesData = await categoryService.getSubcategories(undefined, employeeData.clientId);
      
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
      toast.success('Subcategory deleted successfully');
    } catch (error: any) {
      console.error('Error deleting subcategory:', error);
      // Re-throw the error so the component can handle it and show the specific error message
      throw error;
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
    deleteSubcategory,
    loadData
  };
}
