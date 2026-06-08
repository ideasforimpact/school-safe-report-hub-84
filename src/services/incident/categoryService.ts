
import { toast } from "sonner";
import { invokeIncidentConfig } from "./incidentConfigurationEdgeService";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  client_id?: string | null;
}

export interface SubcategoryItem {
  id: string;
  name: string;
  description?: string;
  category_id?: string | null;
  client_id?: string | null;
}

export const categoryService = {
  // Check for duplicate category name within client
  checkDuplicateCategory: async (name: string, clientId: string, excludeId?: string): Promise<boolean> => {
    try {
      return await invokeIncidentConfig<boolean>({
        resource: "categories",
        operation: "checkDuplicate",
        clientId,
        excludeId,
        payload: { name },
      });
    } catch (error: any) {
      console.error('Error checking duplicate category:', error);
      return false;
    }
  },

  // Check for duplicate subcategory name within category
  checkDuplicateSubcategory: async (name: string, categoryId: string, clientId: string, excludeId?: string): Promise<boolean> => {
    try {
      return await invokeIncidentConfig<boolean>({
        resource: "subcategories",
        operation: "checkDuplicate",
        clientId,
        categoryId,
        excludeId,
        payload: { name },
      });
    } catch (error: any) {
      console.error('Error checking duplicate subcategory:', error);
      return false;
    }
  },

  // Categories
  getCategories: async (clientId?: string) => {
    try {
      if (!clientId) throw new Error('Client ID is required');
      const { data, error } = await supabase
        .from('incident_categories')
        .select('*')
        .eq('client_id', clientId)
        .order('name');
      if (error) throw error;
      return (data ?? []) as CategoryItem[];
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error(`Failed to fetch categories: ${error.message}`);
      return [];
    }
  },

  addCategory: async (name: string, description?: string, clientId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Category name cannot be empty');
      }

      return await invokeIncidentConfig<CategoryItem>({
        resource: "categories",
        operation: "create",
        clientId,
        payload: { name: trimmedName, description },
      });
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast.error(`Failed to add category: ${error.message}`);
      throw error;
    }
  },

  updateCategory: async (id: string, name: string, description?: string, clientId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Category name cannot be empty');
      }

      return await invokeIncidentConfig<CategoryItem>({
        resource: "categories",
        operation: "update",
        clientId,
        id,
        payload: { name: trimmedName, description },
      });
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast.error(`Failed to update category: ${error.message}`);
      throw error;
    }
  },

  deleteCategory: async (id: string, clientId: string) => {
    try {
      console.log('Attempting to delete category:', { id, clientId });
      
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      await invokeIncidentConfig<boolean>({
        resource: "categories",
        operation: "delete",
        clientId,
        id,
      });
      console.log('Category deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting category:', error);
      // Don't show toast here - let the UI component handle the error display
      throw error;
    }
  },

  // Subcategories - Updated to include client_id validation
  getSubcategories: async (categoryId?: string, clientId?: string) => {
    try {
      if (!clientId) throw new Error('Client ID is required');
      let query = supabase
        .from('incident_subcategories')
        .select('*')
        .eq('client_id', clientId)
        .order('name');
      if (categoryId) query = query.eq('category_id', categoryId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as SubcategoryItem[];
    } catch (error: any) {
      console.error('Error fetching subcategories:', error);
      toast.error(`Failed to fetch subcategories: ${error.message}`);
      return [];
    }
  },

  addSubcategory: async (name: string, categoryId: string, description?: string, clientId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Subcategory name cannot be empty');
      }

      return await invokeIncidentConfig<SubcategoryItem>({
        resource: "subcategories",
        operation: "create",
        clientId,
        payload: { name: trimmedName, categoryId, description },
      });
    } catch (error: any) {
      console.error('Error adding subcategory:', error);
      toast.error(`Failed to add subcategory: ${error.message}`);
      throw error;
    }
  },

  updateSubcategory: async (id: string, name: string, categoryId?: string, description?: string, clientId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Subcategory name cannot be empty');
      }

      return await invokeIncidentConfig<SubcategoryItem>({
        resource: "subcategories",
        operation: "update",
        clientId,
        id,
        categoryId,
        payload: { name: trimmedName, categoryId, description },
      });
    } catch (error: any) {
      console.error('Error updating subcategory:', error);
      toast.error(`Failed to update subcategory: ${error.message}`);
      throw error;
    }
  },

  deleteSubcategory: async (id: string, clientId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      await invokeIncidentConfig<boolean>({
        resource: "subcategories",
        operation: "delete",
        clientId,
        id,
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting subcategory:', error);
      // Don't show toast here - let the UI component handle the error display
      throw error;
    }
  }
};
