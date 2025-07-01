
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PriorityItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  weight: number | null;
  is_active: boolean;
}

export const priorityService = {
  // Get priorities - RLS handles client filtering automatically
  getPriorities: async (activeOnly: boolean = false) => {
    try {
      let query = supabase
        .from('incident_priorities')
        .select('*');
        
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('weight');
      
      if (error) {
        console.error('Error fetching priorities:', error);
        toast.error(`Failed to fetch priorities: ${error.message}`);
        return [];
      }

      return data as PriorityItem[];
    } catch (error: any) {
      console.error('Error fetching priorities:', error);
      toast.error(`Failed to fetch priorities: ${error.message}`);
      return [];
    }
  },

  // Add priority - RLS handles client validation automatically
  addPriority: async (name: string, description: string | null = null, color: string | null = null, weight: number | null = 0) => {
    try {
      // Get client_id from current user's employee record for data attribution
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('client_id')
        .eq('user_id', user.id)
        .single();

      if (employeeError || !employee) {
        throw new Error('Employee record not found');
      }
      
      const { data, error } = await supabase
        .from('incident_priorities')
        .insert([
          { 
            name, 
            description: description || null, 
            color: color || null,
            weight: weight || 0,
            client_id: employee.client_id 
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding priority:', error);
        toast.error(`Failed to add priority: ${error.message}`);
        throw error;
      }

      return data as PriorityItem;
    } catch (error: any) {
      console.error('Error adding priority:', error);
      toast.error(`Failed to add priority: ${error.message}`);
      throw error;
    }
  },

  // Update priority - RLS handles client validation automatically
  updatePriority: async (id: string, name: string, description: string | null = null, color: string | null = null, weight: number | null = 0) => {
    try {
      const { data, error } = await supabase
        .from('incident_priorities')
        .update({ 
          name, 
          description: description || null,
          color: color || null,
          weight: weight || 0
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating priority:', error);
        toast.error(`Failed to update priority: ${error.message}`);
        throw error;
      }

      if (!data) {
        const errorMsg = 'Priority not found or access denied';
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      return data as PriorityItem;
    } catch (error: any) {
      console.error('Error updating priority:', error);
      toast.error(`Failed to update priority: ${error.message}`);
      throw error;
    }
  },

  // Delete priority - RLS handles client validation automatically
  deletePriority: async (id: string) => {
    try {
      const { error } = await supabase
        .from('incident_priorities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting priority:', error);
        toast.error(`Failed to delete priority: ${error.message}`);
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error deleting priority:', error);
      toast.error(`Failed to delete priority: ${error.message}`);
      throw error;
    }
  },

  // Toggle priority status - RLS handles client validation automatically
  togglePriorityStatus: async (id: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('incident_priorities')
        .update({ 
          is_active: isActive 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling priority status:', error);
        toast.error(`Failed to update priority status: ${error.message}`);
        throw error;
      }

      if (!data) {
        const errorMsg = 'Priority not found or access denied';
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      return data as PriorityItem;
    } catch (error: any) {
      console.error('Error toggling priority status:', error);
      toast.error(`Failed to update priority status: ${error.message}`);
      throw error;
    }
  }
};
