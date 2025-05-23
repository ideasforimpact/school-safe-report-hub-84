
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContributingFactorItem {
  id: string;
  name: string;
  description?: string | null;
  weight?: string | null;
  client_id: string | null;
}

export const contributingFactorService = {
  // Get contributing factors - always requiring clientId
  getContributingFactors: async (clientId: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { data: factors, error } = await supabase
        .from('contributing_factors')
        .select('id, name, description, weight, client_id')
        .eq('client_id', clientId)
        .order('name');

      if (error) {
        throw error;
      }

      return factors as ContributingFactorItem[];
    } catch (error: any) {
      console.error('Error fetching contributing factors:', error);
      toast.error(`Failed to fetch contributing factors: ${error.message}`);
      return [];
    }
  },

  // Add contributing factor - always requiring clientId
  addContributingFactor: async (name: string, description: string, weight: string, clientId: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      const { data, error } = await supabase
        .from('contributing_factors')
        .insert([
          { 
            name, 
            description: description || null, 
            weight: weight || null, 
            client_id: clientId 
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as ContributingFactorItem;
    } catch (error: any) {
      console.error('Error adding contributing factor:', error);
      toast.error(`Failed to add contributing factor: ${error.message}`);
      throw error;
    }
  },

  // Update contributing factor - always requiring clientId
  updateContributingFactor: async (id: string, name: string, description: string, weight: string, clientId: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { data, error } = await supabase
        .from('contributing_factors')
        .update({ 
          name, 
          description: description || null, 
          weight: weight || null 
        })
        .eq('id', id)
        .eq('client_id', clientId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Contributing factor not found or access denied');
      }

      return data as ContributingFactorItem;
    } catch (error: any) {
      console.error('Error updating contributing factor:', error);
      toast.error(`Failed to update contributing factor: ${error.message}`);
      throw error;
    }
  },

  // Delete contributing factor - always requiring clientId
  deleteContributingFactor: async (id: string, clientId: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { error } = await supabase
        .from('contributing_factors')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error deleting contributing factor:', error);
      toast.error(`Failed to delete contributing factor: ${error.message}`);
      throw error;
    }
  }
};
