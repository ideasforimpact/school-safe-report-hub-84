
import { invokeIncidentConfig } from "./incidentConfigurationEdgeService";
import { supabase } from "@/integrations/supabase/client";

export interface ReportTypeItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export const reportTypeService = {
  // Check for duplicate report type name within client
  checkDuplicateReportType: async (name: string, clientId: string, excludeId?: string): Promise<boolean> => {
    try {
      return await invokeIncidentConfig<boolean>({
        resource: "reportTypes",
        operation: "checkDuplicate",
        clientId,
        excludeId,
        payload: { name },
      });
    } catch (error: any) {
      console.error('Error checking duplicate report type:', error);
      return false;
    }
  },

  // Get report types - direct query, no edge function overhead
  getReportTypes: async (activeOnly: boolean = false, clientId?: string) => {
    try {
      let query = supabase
        .from('incident_report_types')
        .select('id, name, description, is_active')
        .order('name');
      if (activeOnly) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ReportTypeItem[];
    } catch (error: any) {
      console.error('Error fetching report types:', error);
      return [];
    }
  },

  // Add report type - RLS handles client validation automatically
  addReportType: async (name: string, description: string | null = null, clientId?: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Report type name cannot be empty');
      }

      return await invokeIncidentConfig<ReportTypeItem>({
        resource: "reportTypes",
        operation: "create",
        clientId,
        payload: { name: trimmedName, description },
      });
    } catch (error: any) {
      console.error('Error adding report type:', error);
      throw error;
    }
  },

  // Update report type - RLS handles client validation automatically
  updateReportType: async (id: string, name: string, description: string | null = null, clientId?: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Report type name cannot be empty');
      }

      return await invokeIncidentConfig<ReportTypeItem>({
        resource: "reportTypes",
        operation: "update",
        clientId,
        id,
        payload: { name: trimmedName, description },
      });
    } catch (error: any) {
      console.error('Error updating report type:', error);
      throw error;
    }
  },

  // Delete report type - RLS handles client validation automatically
  deleteReportType: async (id: string, clientId?: string) => {
    try {
      await invokeIncidentConfig<boolean>({
        resource: "reportTypes",
        operation: "delete",
        clientId,
        id,
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting report type:', error);
      throw error;
    }
  },

  // Toggle report type status - RLS handles client validation automatically
  toggleReportTypeStatus: async (id: string, isActive: boolean, clientId?: string) => {
    try {
      return await invokeIncidentConfig<ReportTypeItem>({
        resource: "reportTypes",
        operation: "toggleStatus",
        clientId,
        id,
        payload: { isActive },
      });
    } catch (error: any) {
      console.error('Error toggling report type status:', error);
      throw error;
    }
  }
};
