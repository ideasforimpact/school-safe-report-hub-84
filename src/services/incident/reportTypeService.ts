
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { incidentReferenceService } from "./incidentReferenceService";

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
      let query = supabase
        .from('incident_report_types')
        .select('id')
        .eq('client_id', clientId)
        .ilike('name', name.trim());

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error: any) {
      console.error('Error checking duplicate report type:', error);
      return false;
    }
  },

  // Get report types filtered by client type key
  getReportTypes: async (activeOnly: boolean = false, clientTypeKey?: string) => {
    try {
      let query = supabase
        .from('incident_report_types')
        .select('*');
        
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      if (clientTypeKey) {
        query = query.eq('client_type_key', clientTypeKey);
      }
      const { data, error } = await query.order('name');
      
      if (error) {
        console.error('Error fetching report types:', error);
        return [];
      }

      return data as ReportTypeItem[];
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

      let finalClientId = clientId;

      // If clientId not provided, get it from current user's employee record
      if (!finalClientId) {
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

        finalClientId = employee.client_id;
      }

      // Check for duplicate
      const isDuplicate = await reportTypeService.checkDuplicateReportType(trimmedName, finalClientId);
      if (isDuplicate) {
        throw new Error('A report type with this name already exists');
      }
      
      const { data, error } = await supabase
        .from('incident_report_types')
        .insert([
          { 
            name: trimmedName, 
            description: description || null, 
            client_id: finalClientId 
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding report type:', error);
        throw error;
      }

      return data as ReportTypeItem;
    } catch (error: any) {
      console.error('Error adding report type:', error);
      throw error;
    }
  },

  // Update report type - RLS handles client validation automatically
  updateReportType: async (id: string, name: string, description: string | null = null) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Report type name cannot be empty');
      }

      // Get client_id for duplicate check
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

      // Check for duplicate (excluding current record)
      const isDuplicate = await reportTypeService.checkDuplicateReportType(trimmedName, employee.client_id, id);
      if (isDuplicate) {
        throw new Error('A report type with this name already exists');
      }

      const { data, error } = await supabase
        .from('incident_report_types')
        .update({ 
          name: trimmedName, 
          description: description || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating report type:', error);
        throw error;
      }

      if (!data) {
        const errorMsg = 'Report type not found or access denied';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      return data as ReportTypeItem;
    } catch (error: any) {
      console.error('Error updating report type:', error);
      throw error;
    }
  },

  // Delete report type - RLS handles client validation automatically
  deleteReportType: async (id: string) => {
    try {
      // Get client_id for reference check
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

      // Check if report type is referenced by incidents
      const referenceCheck = await incidentReferenceService.checkReportTypeReferences(id, employee.client_id);
      
      if (referenceCheck.hasReferences) {
        throw new Error(referenceCheck.message);
      }

      const { error } = await supabase
        .from('incident_report_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting report type:', error);
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error deleting report type:', error);
      throw error;
    }
  },

  // Toggle report type status - RLS handles client validation automatically
  toggleReportTypeStatus: async (id: string, isActive: boolean) => {
    try {
      // If deactivating, check if report type is referenced by incidents
      if (!isActive) {
        // Get client_id for reference check
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

        // Check if report type is referenced by incidents
        const referenceCheck = await incidentReferenceService.checkReportTypeReferences(id, employee.client_id);
        
        if (referenceCheck.hasReferences) {
          // Replace "delete" with "deactivate" in the error message
          const deactivateMessage = referenceCheck.message.replace('Cannot delete', 'Cannot deactivate');
          throw new Error(deactivateMessage);
        }
      }

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
        throw error;
      }

      if (!data) {
        const errorMsg = 'Report type not found or access denied';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      return data as ReportTypeItem;
    } catch (error: any) {
      console.error('Error toggling report type status:', error);
      throw error;
    }
  }
};
