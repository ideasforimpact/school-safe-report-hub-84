
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReportTypeItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export const reportTypeService = {
  // Get report types - RLS handles client filtering automatically
  getReportTypes: async (activeOnly: boolean = false) => {
    try {
      let query = supabase
        .from('incident_report_types')
        .select('*');
        
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        console.error('Error fetching report types:', error);
        toast.error(`Failed to fetch report types: ${error.message}`);
        return [];
      }

      return data as ReportTypeItem[];
    } catch (error: any) {
      console.error('Error fetching report types:', error);
      toast.error(`Failed to fetch report types: ${error.message}`);
      return [];
    }
  },

  // Add report type - RLS handles client validation automatically
  addReportType: async (name: string, description: string | null = null) => {
    try {
      // Get client_id from current user's employee record for data attribution
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('client_id')
        .eq('user_id', user.id)
        .single();

      if (employeeError || !employee) {
        throw new Error('Employee record not found');
      }
      
      const { data, error } = await supabase
        .from('incident_report_types')
        .insert([
          { 
            name, 
            description: description || null, 
            client_id: employee.client_id 
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding report type:', error);
        toast.error(`Failed to add report type: ${error.message}`);
        throw error;
      }

      return data as ReportTypeItem;
    } catch (error: any) {
      console.error('Error adding report type:', error);
      toast.error(`Failed to add report type: ${error.message}`);
      throw error;
    }
  },

  // Update report type - RLS handles client validation automatically
  updateReportType: async (id: string, name: string, description: string | null = null) => {
    try {
      const { data, error } = await supabase
        .from('incident_report_types')
        .update({ 
          name, 
          description: description || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating report type:', error);
        toast.error(`Failed to update report type: ${error.message}`);
        throw error;
      }

      if (!data) {
        const errorMsg = 'Report type not found or access denied';
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      return data as ReportTypeItem;
    } catch (error: any) {
      console.error('Error updating report type:', error);
      toast.error(`Failed to update report type: ${error.message}`);
      throw error;
    }
  },

  // Delete report type - RLS handles client validation automatically
  deleteReportType: async (id: string) => {
    try {
      const { error } = await supabase
        .from('incident_report_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting report type:', error);
        toast.error(`Failed to delete report type: ${error.message}`);
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error deleting report type:', error);
      toast.error(`Failed to delete report type: ${error.message}`);
      throw error;
    }
  },

  // Toggle report type status - RLS handles client validation automatically
  toggleReportTypeStatus: async (id: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('incident_report_types')
        .update({ 
          is_active: isActive 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling report type status:', error);
        toast.error(`Failed to update report type status: ${error.message}`);
        throw error;
      }

      if (!data) {
        const errorMsg = 'Report type not found or access denied';
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      return data as ReportTypeItem;
    } catch (error: any) {
      console.error('Error toggling report type status:', error);
      toast.error(`Failed to update report type status: ${error.message}`);
      throw error;
    }
  }
};
