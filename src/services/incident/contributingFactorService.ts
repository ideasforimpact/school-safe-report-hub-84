
import { invokeIncidentConfig } from "@/components/incident/incidentConfigurationEdgeService";

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
    } catch (error) {
      console.error('Error checking duplicate contributing factor:', error);
      return false;
    }
  },

  // Get contributing factors - always requiring clientId
  getContributingFactors: async (clientId: string, clientTypeId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      return await invokeIncidentConfig<ContributingFactorItem[]>({
        resource: 'contributingFactors',
        operation: 'list',
        clientId,
        clientTypeId,
      });
    } catch (error) {
      console.error('Error fetching contributing factors:', error);
      return [];
    }
  },

  // Add contributing factor - always requiring clientId
  addContributingFactor: async (name: string, description: string, weight: string, clientId: string, clientTypeId?: string) => {
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
        clientTypeId,
        payload: { name: trimmedName, description, weight },
      });
    } catch (error) {
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
    } catch (error) {
      console.error('Error updating contributing factor:', error);
      throw error;
    }
  },

  // Delete contributing factor - server-side reference check + delete via the
  // incident-configuration edge function; when clientId isn't given, it's
  // resolved there from the caller's own employee record (via the auth JWT).
  deleteContributingFactor: async (id: string, clientId?: string) => {
    try {
      await invokeIncidentConfig<boolean>({
        resource: 'contributingFactors',
        operation: 'delete',
        id,
        clientId,
      });

      return true;
    } catch (error) {
      console.error('Error deleting contributing factor:', error);
      throw error;
    }
  }
};
