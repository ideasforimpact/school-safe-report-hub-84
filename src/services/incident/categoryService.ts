
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  // Categories
  getCategories: async (clientId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      let query = supabase
        .from('incident_categories')
        .select('*')
        .order('name');

      if (clientId) {
        query = query.eq('client_id', clientId);
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
      
      const { data, error } = await supabase
        .from('incident_categories')
        .insert([
          { name, description: description || null, client_id: clientId, is_active: true }
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

  updateCategory: async (id: string, name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('incident_categories')
        .update({ name, description: description || null })
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

  deleteCategory: async (id: string) => {
    try {
      // First, delete related subcategories
      await supabase
        .from('incident_subcategories')
        .delete()
        .eq('category_id', id);

      const { error } = await supabase
        .from('incident_categories')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(`Failed to delete category: ${error.message}`);
      throw error;
    }
  },

  // Subcategories - Updated to include client_id validation
  getSubcategories: async (categoryId?: string, clientId?: string) => {
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

      const { data, error } = await supabase
        .from('incident_subcategories')
        .insert([
          { 
            name, 
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

      let updateData: any = { name, description: description || null };
      
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
      toast.error(`Failed to delete subcategory: ${error.message}`);
      throw error;
    }
  }
};
