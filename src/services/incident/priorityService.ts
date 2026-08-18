
import { invokeIncidentConfig } from "@/components/incident/incidentConfigurationEdgeService";

export interface PriorityItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  weight: number | null;
  is_active: boolean;
}

export const priorityService = {
  // Check for duplicate priority name within client (and client type, when given)
  checkDuplicatePriority: async (name: string, clientId: string, excludeId?: string, clientTypeId?: string): Promise<boolean> => {
    try {
      return await invokeIncidentConfig<boolean>({
        resource: 'priorities',
        operation: 'checkDuplicate',
        clientId,
        clientTypeId,
        excludeId,
        payload: { name: name.trim() },
      });
    } catch (error) {
      console.error('Error checking duplicate priority:', error);
      return false;
    }
  },

  // Get priorities filtered by client type key, scoped to clientId when provided
  // (matches categoryService.getCategories) so the list reflects the client actually
  // being viewed rather than falling back to the caller's own employee record.
  getPriorities: async (activeOnly: boolean = false, clientTypeId?: string, clientId?: string) => {
    try {
      return await invokeIncidentConfig<PriorityItem[]>({
        resource: 'priorities',
        operation: 'list',
        clientId,
        clientTypeId,
        activeOnly,
      });
    } catch (error) {
      console.error('Error fetching priorities:', error);
      return [];
    }
  },

  // Add priority - server-side create (duplicate check + insert) via the
  // incident-configuration edge function; client scoping is resolved there.
  addPriority: async (name: string, description: string | null = null, color: string | null = null, weight: number | null = 0, clientId?: string, clientTypeId?: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Priority name cannot be empty');
      }

      return await invokeIncidentConfig<PriorityItem>({
        resource: 'priorities',
        operation: 'create',
        clientId,
        clientTypeId,
        payload: {
          name: trimmedName,
          description: description || null,
          color: color || null,
          weight: weight || 0,
        },
      });
    } catch (error) {
      console.error('Error adding priority:', error);
      throw error;
    }
  },

  // Update priority - server-side update (duplicate check + update) via the
  // incident-configuration edge function; client_id is resolved there from
  // the caller's own employee record (via the auth JWT), not fetched here.
  updatePriority: async (id: string, name: string, description: string | null = null, color: string | null = null, weight: number | null = 0, clientTypeId?: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Priority name cannot be empty');
      }

      return await invokeIncidentConfig<PriorityItem>({
        resource: 'priorities',
        operation: 'update',
        id,
        clientTypeId,
        payload: {
          name: trimmedName,
          description: description || null,
          color: color || null,
          weight: weight || 0,
        },
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      throw error;
    }
  },

  // Delete priority - server-side reference check + delete via the
  // incident-configuration edge function.
  deletePriority: async (id: string) => {
    try {
      await invokeIncidentConfig<boolean>({
        resource: 'priorities',
        operation: 'delete',
        id,
      });

      return true;
    } catch (error) {
      console.error('Error deleting priority:', error);
      throw error;
    }
  },

  // Toggle priority status - server-side reference check (on deactivate) + update
  // via the incident-configuration edge function.
  togglePriorityStatus: async (id: string, isActive: boolean) => {
    try {
      return await invokeIncidentConfig<PriorityItem>({
        resource: 'priorities',
        operation: 'toggleStatus',
        id,
        payload: { isActive },
      });
    } catch (error) {
      console.error('Error toggling priority status:', error);
      throw error;
    }
  }
};
