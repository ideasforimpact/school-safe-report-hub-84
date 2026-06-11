
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { incidentReferenceService } from "./incidentReferenceService";

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
      let query = supabase
        .from('incident_priorities')
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
      console.error('Error checking duplicate priority:', error);
      return false;
    }
  },

  // Get priorities - RLS handles client filtering automatically
  getPriorities: async (activeOnly: boolean = false) => {
    try {
      let query = supabase
        .from('incident_priorities')
        .select('*');
        
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('weight');
      
      if (error) {
        console.error('Error fetching priorities:', error);
        return [];
      }

      return data as PriorityItem[];
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

      let finalClientId = clientId;

      // If clientId not provided, get it from current user's employee record
      if (!finalClientId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        console.log(user.id,"userData");
        
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
      const isDuplicate = await priorityService.checkDuplicatePriority(trimmedName, finalClientId);
      if (isDuplicate) {
        throw new Error('A priority with this name already exists');
      }
      
      const { data, error } = await supabase
        .from('incident_priorities')
        .insert([
          { 
            name: trimmedName, 
            description: description || null, 
            color: color || null,
            weight: weight || 0,
            client_id: finalClientId 
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding priority:', error);
        throw error;
      }

      return data as PriorityItem;
    } catch (error: any) {
      console.error('Error adding priority:', error);
      throw error;
    }
  },

  // Update priority - RLS handles client validation automatically
  updatePriority: async (id: string, name: string, description: string | null = null, color: string | null = null, weight: number | null = 0) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Priority name cannot be empty');
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
      const isDuplicate = await priorityService.checkDuplicatePriority(trimmedName, employee.client_id, id);
      if (isDuplicate) {
        throw new Error('A priority with this name already exists');
      }

      const { data, error } = await supabase
        .from('incident_priorities')
        .update({ 
          name: trimmedName, 
          description: description || null,
          color: color || null,
          weight: weight || 0
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating priority:', error);
        throw error;
      }

      if (!data) {
        const errorMsg = 'Priority not found or access denied';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      return data as PriorityItem;
    } catch (error: any) {
      console.error('Error updating priority:', error);
      throw error;
    }
  },

  // Delete priority - RLS handles client validation automatically
  deletePriority: async (id: string) => {
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

      // Check if priority is referenced by incidents
      const referenceCheck = await incidentReferenceService.checkPriorityReferences(id, employee.client_id);
      
      if (referenceCheck.hasReferences) {
        throw new Error(referenceCheck.message);
      }

      const { error } = await supabase
        .from('incident_priorities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting priority:', error);
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error deleting priority:', error);
      throw error;
    }
  },

  // Toggle priority status - RLS handles client validation automatically
  togglePriorityStatus: async (id: string, isActive: boolean) => {
    try {
      // If deactivating, check if priority is referenced by incidents
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

        // Check if priority is referenced by incidents
        const referenceCheck = await incidentReferenceService.checkPriorityReferences(id, employee.client_id);
        
        if (referenceCheck.hasReferences) {
          // Replace "delete" with "deactivate" in the error message
          const deactivateMessage = referenceCheck.message.replace('Cannot delete', 'Cannot deactivate');
          throw new Error(deactivateMessage);
        }
      }

      const { data, error } = await supabase
        .from('incident_priorities')
        .update({ 
          is_active: isActive 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling priority status:', error);
        throw error;
      }

      if (!data) {
        const errorMsg = 'Priority not found or access denied';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      return data as PriorityItem;
    } catch (error: any) {
      console.error('Error toggling priority status:', error);
      throw error;
    }
  }
};
