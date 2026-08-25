
import { toast } from "sonner";
import { invokeIncidentConfig } from "@/components/incident/incidentConfigurationEdgeService";

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  client_id?: string | null;
  is_used_by_incident?: boolean;
}

export interface SubcategoryItem {
  id: string;
  name: string;
  description?: string;
  category_id?: string | null;
  client_id?: string | null;
  is_used_by_incident?: boolean;
}

export const categoryService = {
  // Check for duplicate category name within client (and client type, when given)
  checkDuplicateCategory: async (name: string, clientId: string, excludeId?: string, clientTypeId?: string): Promise<boolean> => {
    try {
      return await invokeIncidentConfig<boolean>({
        resource: 'categories',
        operation: 'checkDuplicate',
        clientId,
        clientTypeId,
        excludeId,
        payload: { name: name.trim() },
      });
    } catch (error) {
      console.error('Error checking duplicate category:', error);
      return false;
    }
  },

  // Check for duplicate subcategory name within category
  checkDuplicateSubcategory: async (name: string, categoryId: string, clientId: string, excludeId?: string): Promise<boolean> => {
    try {
      return await invokeIncidentConfig<boolean>({
        resource: 'subcategories',
        operation: 'checkDuplicate',
        clientId,
        categoryId,
        excludeId,
        payload: { name: name.trim() },
      });
    } catch (error) {
      console.error('Error checking duplicate subcategory:', error);
      return false;
    }
  },

  // Categories
  getCategories: async (clientId?: string, clientTypeId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      return await invokeIncidentConfig<CategoryItem[]>({
        resource: 'categories',
        operation: 'list',
        clientId,
        clientTypeId,
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(`Failed to fetch categories: ${error.message}`);
      return [];
    }
  },

  // Server-side create (duplicate check + insert) via the incident-configuration edge function.
  addCategory: async (name: string, description?: string, clientId?: string, clientTypeId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Category name cannot be empty');
      }

      return await invokeIncidentConfig<CategoryItem>({
        resource: 'categories',
        operation: 'create',
        clientId,
        clientTypeId,
        payload: { name: trimmedName, description: description || null },
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error(`Failed to add category: ${error.message}`);
      throw error;
    }
  },

  // Server-side update (duplicate check + update) via the incident-configuration edge function.
  updateCategory: async (id: string, name: string, description?: string, clientId?: string, clientTypeId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Category name cannot be empty');
      }

      return await invokeIncidentConfig<CategoryItem>({
        resource: 'categories',
        operation: 'update',
        id,
        clientId,
        clientTypeId,
        payload: { name: trimmedName, description: description || null },
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(`Failed to update category: ${error.message}`);
      throw error;
    }
  },

  // Server-side delete (reference check + cascading subcategory delete + delete)
  // via the incident-configuration edge function.
  deleteCategory: async (id: string, clientId: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      await invokeIncidentConfig<boolean>({
        resource: 'categories',
        operation: 'delete',
        id,
        clientId,
      });

      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      // Don't show toast here - let the UI component handle the error display
      throw error;
    }
  },

  // Subcategories - Updated to include client_id validation
  getSubcategories: async (categoryId?: string, clientId?: string, clientTypeId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      return await invokeIncidentConfig<SubcategoryItem[]>({
        resource: 'subcategories',
        operation: 'list',
        clientId,
        clientTypeId,
        categoryId,
      });
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast.error(`Failed to fetch subcategories: ${error.message}`);
      return [];
    }
  },

  addSubcategory: async (name: string, categoryId: string, description?: string, clientId?: string, clientTypeId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Subcategory name cannot be empty');
      }

      return await invokeIncidentConfig<SubcategoryItem>({
        resource: 'subcategories',
        operation: 'create',
        clientId,
        clientTypeId,
        payload: { name: trimmedName, description: description || null, categoryId },
      });
    } catch (error) {
      console.error('Error adding subcategory:', error);
      toast.error(`Failed to add subcategory: ${error.message}`);
      throw error;
    }
  },

  updateSubcategory: async (id: string, name: string, categoryId?: string, description?: string, clientId?: string, clientTypeId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Subcategory name cannot be empty');
      }

      return await invokeIncidentConfig<SubcategoryItem>({
        resource: 'subcategories',
        operation: 'update',
        id,
        clientId,
        clientTypeId,
        categoryId,
        payload: { name: trimmedName, description: description || null, categoryId },
      });
    } catch (error) {
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
        resource: 'subcategories',
        operation: 'delete',
        id,
        clientId,
      });

      return true;
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      // Don't show toast here - let the UI component handle the error display
      throw error;
    }
  }
};
