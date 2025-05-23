
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
  // Get priorities
  getPriorities: async (clientId?: string, activeOnly: boolean = false) => {
    try {
      if (!clientId) {
        console.error('Client ID is required for fetching priorities');
        toast.error('Client information is required');
        return [];
      }

      let query = supabase
        .from('incident_priorities')
        .select('*')
        .eq('client_id', clientId);
        
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

  // Add priority
  addPriority: async (name: string, description: string | null = null, color: string | null = null, weight: number | null = 0, clientId?: string) => {
    try {
      if (!clientId) {
        console.error('Client ID is required for adding priority');
        toast.error('Client information is required');
        throw new Error('Client ID is required');
      }
      
      const { data, error } = await supabase
        .from('incident_priorities')
        .insert([
          { 
            name, 
            description: description || null, 
            color: color || null,
            weight: weight || 0,
            client_id: clientId 
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

  // Update priority
  updatePriority: async (id: string, name: string, description: string | null = null, color: string | null = null, weight: number | null = 0, clientId?: string) => {
    try {
      if (!clientId) {
        console.error('Client ID is required for updating priority');
        toast.error('Client information is required');
        throw new Error('Client ID is required');
      }

      const { data, error } = await supabase
        .from('incident_priorities')
        .update({ 
          name, 
          description: description || null,
          color: color || null,
          weight: weight || 0
        })
        .eq('id', id)
        .eq('client_id', clientId)
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

  // Delete priority
  deletePriority: async (id: string, clientId?: string) => {
    try {
      if (!clientId) {
        console.error('Client ID is required for deleting priority');
        toast.error('Client information is required');
        throw new Error('Client ID is required');
      }

      const { error } = await supabase
        .from('incident_priorities')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId);

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

  // Toggle priority status
  togglePriorityStatus: async (id: string, isActive: boolean, clientId?: string) => {
    try {
      if (!clientId) {
        console.error('Client ID is required for toggling priority status');
        toast.error('Client information is required');
        throw new Error('Client ID is required');
      }

      const { data, error } = await supabase
        .from('incident_priorities')
        .update({ 
          is_active: isActive 
        })
        .eq('id', id)
        .eq('client_id', clientId)
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
