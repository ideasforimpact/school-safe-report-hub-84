
import { invokeIncidentConfig } from "./incidentConfigurationEdgeService";
import { supabase } from "@/integrations/supabase/client";

export interface PriorityItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  weight: number | null;
  is_active: boolean;
}

export const priorityService = {
  // Check for duplicate priority name within client
  checkDuplicatePriority: async (name: string, clientId: string, excludeId?: string): Promise<boolean> => {
    try {
      return await invokeIncidentConfig<boolean>({
        resource: "priorities",
        operation: "checkDuplicate",
        clientId,
        excludeId,
        payload: { name },
      });
    } catch (error: any) {
      console.error('Error checking duplicate priority:', error);
      return false;
    }
  },

  // Get priorities - direct query, no edge function overhead
  getPriorities: async (activeOnly: boolean = false, clientId?: string) => {
    try {
      let query = supabase
        .from('incident_priorities')
        .select('id, name, description, color, weight, is_active')
        .order('weight');
      if (activeOnly) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PriorityItem[];
    } catch (error: any) {
      console.error('Error fetching priorities:', error);
      return [];
    }
  },

  // Add priority - RLS handles client validation automatically
  addPriority: async (name: string, description: string | null = null, color: string | null = null, weight: number | null = 0, clientId?: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Priority name cannot be empty');
      }

      return await invokeIncidentConfig<PriorityItem>({
        resource: "priorities",
        operation: "create",
        clientId,
        payload: { name: trimmedName, description, color, weight },
      });
    } catch (error: any) {
      console.error('Error adding priority:', error);
      throw error;
    }
  },

  // Update priority - RLS handles client validation automatically
  updatePriority: async (id: string, name: string, description: string | null = null, color: string | null = null, weight: number | null = 0, clientId?: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Priority name cannot be empty');
      }

      return await invokeIncidentConfig<PriorityItem>({
        resource: "priorities",
        operation: "update",
        clientId,
        id,
        payload: { name: trimmedName, description, color, weight },
      });
    } catch (error: any) {
      console.error('Error updating priority:', error);
      throw error;
    }
  },

  // Delete priority - RLS handles client validation automatically
  deletePriority: async (id: string, clientId?: string) => {
    try {
      await invokeIncidentConfig<boolean>({
        resource: "priorities",
        operation: "delete",
        clientId,
        id,
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting priority:', error);
      throw error;
    }
  },

  // Toggle priority status - RLS handles client validation automatically
  togglePriorityStatus: async (id: string, isActive: boolean, clientId?: string) => {
    try {
      return await invokeIncidentConfig<PriorityItem>({
        resource: "priorities",
        operation: "toggleStatus",
        clientId,
        id,
        payload: { isActive },
      });
    } catch (error: any) {
      console.error('Error toggling priority status:', error);
      throw error;
    }
  }
};
