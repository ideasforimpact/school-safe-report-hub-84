
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { incidentReferenceService } from "./incidentReferenceService";

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
      let query = supabase
        .from('incident_categories')
        .select('id')
        .eq('client_id', clientId)
        .ilike('name', name.trim());

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error: any) {
      console.error('Error checking duplicate category:', error);
      return false;
    }
  },

  // Check for duplicate subcategory name within category
  checkDuplicateSubcategory: async (name: string, categoryId: string, clientId: string, excludeId?: string): Promise<boolean> => {
    try {
      let query = supabase
        .from('incident_subcategories')
        .select('id')
        .eq('category_id', categoryId)
        .eq('client_id', clientId)
        .ilike('name', name.trim());

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error: any) {
      console.error('Error checking duplicate subcategory:', error);
      return false;
    }
  },

  // Categories
  getCategories: async (clientId?: string, clientTypeKey?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      let query = supabase
        .from('incident_categories')
        .select('*')
        .eq('client_id', clientId)
        .order('name');

      if (clientTypeKey) {
        query = query.eq('client_type_key', clientTypeKey);
      }

      const { data: categories, error } = await query;

      if (error) {
        throw error;
      }

      return categories as CategoryItem[];
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

      // Check for duplicate
      const isDuplicate = await categoryService.checkDuplicateCategory(trimmedName, clientId);
      if (isDuplicate) {
        throw new Error('A category with this name already exists');
      }
      
      const { data, error } = await supabase
        .from('incident_categories')
        .insert([
          { name: trimmedName, description: description || null, client_id: clientId, is_active: true }
        ])
        .select();

      if (error) {
        throw error;
      }

      return data[0] as CategoryItem;
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

      // Check for duplicate (excluding current record)
      const isDuplicate = await categoryService.checkDuplicateCategory(trimmedName, clientId, id);
      if (isDuplicate) {
        throw new Error('A category with this name already exists');
      }

      const { data, error } = await supabase
        .from('incident_categories')
        .update({ name: trimmedName, description: description || null })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      return data[0] as CategoryItem;
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

      // Check if category is referenced by incidents
      const referenceCheck = await incidentReferenceService.checkCategoryReferences(id, clientId);
      console.log('Reference check result:', referenceCheck);
      
      if (referenceCheck.hasReferences) {
        throw new Error(referenceCheck.message);
      }

      // First, delete related subcategories
      console.log('Deleting related subcategories...');
      const { error: subcatError } = await supabase
        .from('incident_subcategories')
        .delete()
        .eq('category_id', id)
        .eq('client_id', clientId);

      if (subcatError) {
        console.error('Error deleting subcategories:', subcatError);
        throw subcatError;
      }

      console.log('Deleting category...');
      const { error } = await supabase
        .from('incident_categories')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }

      console.log('Category deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting category:', error);
      // Don't show toast here - let the UI component handle the error display
      throw error;
    }
  },

  // Subcategories - Updated to include client_id validation
  getSubcategories: async (categoryId?: string, clientId?: string, clientTypeKey?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      let query = supabase
        .from('incident_subcategories')
        .select('*')
        .eq('client_id', clientId);
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (clientTypeKey) {
        query = query.eq('client_type_key', clientTypeKey);
      }
      const { data: subcategories, error } = await query.order('name');

      if (error) {
        throw error;
      }

      return subcategories as SubcategoryItem[];
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

      // Check for duplicate within the same category
      const isDuplicate = await categoryService.checkDuplicateSubcategory(trimmedName, categoryId, clientId);
      if (isDuplicate) {
        throw new Error('A subcategory with this name already exists in this category');
      }

      const { data, error } = await supabase
        .from('incident_subcategories')
        .insert([
          { 
            name: trimmedName, 
            category_id: categoryId, 
            description: description || null, 
            client_id: clientId,
            is_active: true 
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      return data[0] as SubcategoryItem;
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

      // For update, we need to know the category ID to check duplicates
      if (!categoryId) {
        // Get current category ID if not provided
        const { data: currentData } = await supabase
          .from('incident_subcategories')
          .select('category_id')
          .eq('id', id)
          .eq('client_id', clientId)
          .single();
        
        if (currentData) {
          categoryId = currentData.category_id;
        }
      }

      if (categoryId) {
        // Check for duplicate within the same category (excluding current record)
        const isDuplicate = await categoryService.checkDuplicateSubcategory(trimmedName, categoryId, clientId, id);
        if (isDuplicate) {
          throw new Error('A subcategory with this name already exists in this category');
        }
      }

      let updateData: any = { name: trimmedName, description: description || null };
      
      if (categoryId) {
        updateData.category_id = categoryId;
      }
      
      const { data, error } = await supabase
        .from('incident_subcategories')
        .update(updateData)
        .eq('id', id)
        .eq('client_id', clientId)
        .select();

      if (error) {
        throw error;
      }

      if (data.length === 0) {
        throw new Error('Subcategory not found or access denied');
      }

      return data[0] as SubcategoryItem;
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

      // Check if subcategory is referenced by incidents
      const referenceCheck = await incidentReferenceService.checkSubcategoryReferences(id, clientId);
      
      if (referenceCheck.hasReferences) {
        throw new Error(referenceCheck.message);
      }

      const { error } = await supabase
        .from('incident_subcategories')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error deleting subcategory:', error);
      // Don't show toast here - let the UI component handle the error display
      throw error;
    }
  }
};
