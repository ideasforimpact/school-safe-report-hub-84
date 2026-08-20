
import { invokeIncidentConfig } from "@/components/incident/incidentConfigurationEdgeService";

export interface ReportTypeItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export const reportTypeService = {
  // Check for duplicate report type name within client
  checkDuplicateReportType: async (name: string, clientId: string, excludeId?: string, clientTypeId?: string): Promise<boolean> => {
    try {
      return await invokeIncidentConfig<boolean>({
        resource: 'reportTypes',
        operation: 'checkDuplicate',
        clientId,
        clientTypeId,
        excludeId,
        payload: { name: name.trim() },
      });
    } catch (error) {
      console.error('Error checking duplicate report type:', error);
      return false;
    }
  },

  // Get report types filtered by client type key, scoped to clientId when provided
  // (matches categoryService.getCategories) so the list reflects the client actually
  // being viewed rather than falling back to the caller's own employee record.
  getReportTypes: async (activeOnly: boolean = false, clientTypeId?: string, clientId?: string) => {
    try {
      return await invokeIncidentConfig<ReportTypeItem[]>({
        resource: 'reportTypes',
        operation: 'list',
        clientId,
        clientTypeId,
        activeOnly,
      });
    } catch (error) {
      console.error('Error fetching report types:', error);
      return [];
    }
  },

  // Add report type - server-side create (duplicate check + insert) via the
  // incident-configuration edge function; client scoping is resolved there.
  addReportType: async (name: string, description: string | null = null, clientId?: string, clientTypeId?: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Report type name cannot be empty');
      }

      return await invokeIncidentConfig<ReportTypeItem>({
        resource: 'reportTypes',
        operation: 'create',
        clientId,
        clientTypeId,
        payload: { name: trimmedName, description: description || null },
      });
    } catch (error) {
      console.error('Error adding report type:', error);
      throw error;
    }
  },

  // Update report type - server-side update (duplicate check + update) via the
  // incident-configuration edge function; client_id is resolved there from
  // the caller's own employee record (via the auth JWT), not fetched here.
  updateReportType: async (id: string, name: string, description: string | null = null, clientTypeId?: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Report type name cannot be empty');
      }

      return await invokeIncidentConfig<ReportTypeItem>({
        resource: 'reportTypes',
        operation: 'update',
        id,
        clientTypeId,
        payload: { name: trimmedName, description: description || null },
      });
    } catch (error) {
      console.error('Error updating report type:', error);
      throw error;
    }
  },

  // Delete report type - server-side reference check + delete via the
  // incident-configuration edge function.
  deleteReportType: async (id: string) => {
    try {
      await invokeIncidentConfig<boolean>({
        resource: 'reportTypes',
        operation: 'delete',
        id,
      });

      return true;
    } catch (error) {
      console.error('Error deleting report type:', error);
      throw error;
    }
  },

  // Toggle report type status - server-side reference check (on deactivate) + update
  // via the incident-configuration edge function.
  toggleReportTypeStatus: async (id: string, isActive: boolean) => {
    try {
      return await invokeIncidentConfig<ReportTypeItem>({
        resource: 'reportTypes',
        operation: 'toggleStatus',
        id,
        payload: { isActive },
      });
    } catch (error) {
      console.error('Error toggling report type status:', error);
      throw error;
    }
  }
};
