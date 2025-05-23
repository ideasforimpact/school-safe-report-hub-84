
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
        throw new Error('Client ID is required');
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
        throw error;
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
        throw error;
      }

      if (!data) {
        throw new Error('Priority not found or access denied');
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
        throw new Error('Client ID is required');
      }

      const { error } = await supabase
        .from('incident_priorities')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) {
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
        throw error;
      }

      if (!data) {
        throw new Error('Priority not found or access denied');
      }

      return data as PriorityItem;
    } catch (error: any) {
      console.error('Error toggling priority status:', error);
      toast.error(`Failed to update priority status: ${error.message}`);
      throw error;
    }
  }
};
