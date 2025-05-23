
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReportTypeItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export const reportTypeService = {
  // Get report types
  getReportTypes: async (clientId?: string, activeOnly: boolean = false) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      let query = supabase
        .from('incident_report_types')
        .select('*')
        .eq('client_id', clientId);
        
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        throw error;
      }

      return data as ReportTypeItem[];
    } catch (error: any) {
      console.error('Error fetching report types:', error);
      toast.error(`Failed to fetch report types: ${error.message}`);
      return [];
    }
  },

  // Add report type
  addReportType: async (name: string, description: string | null = null, clientId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      const { data, error } = await supabase
        .from('incident_report_types')
        .insert([
          { 
            name, 
            description: description || null, 
            client_id: clientId 
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as ReportTypeItem;
    } catch (error: any) {
      console.error('Error adding report type:', error);
      toast.error(`Failed to add report type: ${error.message}`);
      throw error;
    }
  },

  // Update report type
  updateReportType: async (id: string, name: string, description: string | null = null, clientId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { data, error } = await supabase
        .from('incident_report_types')
        .update({ 
          name, 
          description: description || null
        })
        .eq('id', id)
        .eq('client_id', clientId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Report type not found or access denied');
      }

      return data as ReportTypeItem;
    } catch (error: any) {
      console.error('Error updating report type:', error);
      toast.error(`Failed to update report type: ${error.message}`);
      throw error;
    }
  },

  // Delete report type
  deleteReportType: async (id: string, clientId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { error } = await supabase
        .from('incident_report_types')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error deleting report type:', error);
      toast.error(`Failed to delete report type: ${error.message}`);
      throw error;
    }
  },

  // Toggle report type status
  toggleReportTypeStatus: async (id: string, isActive: boolean, clientId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { data, error } = await supabase
        .from('incident_report_types')
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
        throw new Error('Report type not found or access denied');
      }

      return data as ReportTypeItem;
    } catch (error: any) {
      console.error('Error toggling report type status:', error);
      toast.error(`Failed to update report type status: ${error.message}`);
      throw error;
    }
  }
};
