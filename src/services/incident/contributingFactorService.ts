
import { invokeIncidentConfig } from "./incidentConfigurationEdgeService";
import { supabase } from "@/integrations/supabase/client";

export interface ContributingFactorItem {
  id: string;
  name: string;
  description?: string | null;
  weight?: string | null;
  client_id: string | null;
}

export const contributingFactorService = {
  // Check for duplicate contributing factor name within client
  checkDuplicateContributingFactor: async (name: string, clientId: string, excludeId?: string): Promise<boolean> => {
    try {
      return await invokeIncidentConfig<boolean>({
        resource: "contributingFactors",
        operation: "checkDuplicate",
        clientId,
        excludeId,
        payload: { name },
      });
    } catch (error: any) {
      console.error('Error checking duplicate contributing factor:', error);
      return false;
    }
  },

  // Get contributing factors - direct query, no edge function overhead
  getContributingFactors: async (clientId: string) => {
    try {
      if (!clientId) throw new Error('Client ID is required');
      const { data, error } = await supabase
        .from('contributing_factors')
        .select('id, name, description, weight, client_id')
        .eq('client_id', clientId)
        .order('name');
      if (error) throw error;
      return (data ?? []) as ContributingFactorItem[];
    } catch (error: any) {
      console.error('Error fetching contributing factors:', error);
      return [];
    }
  },

  // Add contributing factor - always requiring clientId
  addContributingFactor: async (name: string, description: string, weight: string, clientId: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Contributing factor name cannot be empty');
      }

      return await invokeIncidentConfig<ContributingFactorItem>({
        resource: "contributingFactors",
        operation: "create",
        clientId,
        payload: { name: trimmedName, description, weight },
      });
    } catch (error: any) {
      console.error('Error adding contributing factor:', error);
      throw error;
    }
  },

  // Update contributing factor - always requiring clientId
  updateContributingFactor: async (id: string, name: string, description: string, weight: string, clientId: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Contributing factor name cannot be empty');
      }

      return await invokeIncidentConfig<ContributingFactorItem>({
        resource: "contributingFactors",
        operation: "update",
        clientId,
        id,
        payload: { name: trimmedName, description, weight },
      });
    } catch (error: any) {
      console.error('Error updating contributing factor:', error);
      throw error;
    }
  },

  // Delete contributing factor - clientId can be provided or will be fetched from user
  deleteContributingFactor: async (id: string, clientId?: string) => {
    try {
      await invokeIncidentConfig<boolean>({
        resource: "contributingFactors",
        operation: "delete",
        clientId,
        id,
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting contributing factor:', error);
      throw error;
    }
  }
};
