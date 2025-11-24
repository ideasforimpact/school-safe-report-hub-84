
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { incidentReferenceService } from "./incidentReferenceService";

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
      let query = supabase
        .from('contributing_factors')
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
      console.error('Error checking duplicate contributing factor:', error);
      return false;
    }
  },

  // Get contributing factors - always requiring clientId
  getContributingFactors: async (clientId: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { data: factors, error } = await supabase
        .from('contributing_factors')
        .select('id, name, description, weight, client_id')
        .eq('client_id', clientId)
        .order('name');

      if (error) {
        throw error;
      }

      return factors as ContributingFactorItem[];
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

      // Check for duplicate
      const isDuplicate = await contributingFactorService.checkDuplicateContributingFactor(trimmedName, clientId);
      if (isDuplicate) {
        throw new Error('A contributing factor with this name already exists');
      }
      
      const { data, error } = await supabase
        .from('contributing_factors')
        .insert([
          { 
            name: trimmedName, 
            description: description || null, 
            weight: weight || null, 
            client_id: clientId 
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as ContributingFactorItem;
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

      // Check for duplicate (excluding current record)
      const isDuplicate = await contributingFactorService.checkDuplicateContributingFactor(trimmedName, clientId, id);
      if (isDuplicate) {
        throw new Error('A contributing factor with this name already exists');
      }

      const { data, error } = await supabase
        .from('contributing_factors')
        .update({ 
          name: trimmedName, 
          description: description || null, 
          weight: weight || null 
        })
        .eq('id', id)
        .eq('client_id', clientId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Contributing factor not found or access denied');
      }

      return data as ContributingFactorItem;
    } catch (error: any) {
      console.error('Error updating contributing factor:', error);
      throw error;
    }
  },

  // Delete contributing factor - clientId can be provided or will be fetched from user
  deleteContributingFactor: async (id: string, clientId?: string) => {
    try {
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

      if (!finalClientId) {
        throw new Error('Client ID is required');
      }

      // Check if contributing factor is referenced by incidents
      const referenceCheck = await incidentReferenceService.checkContributingFactorReferences(id, finalClientId);
      
      if (referenceCheck.hasReferences) {
        throw new Error(referenceCheck.message);
      }

      const { error } = await supabase
        .from('contributing_factors')
        .delete()
        .eq('id', id)
        .eq('client_id', finalClientId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error deleting contributing factor:', error);
      throw error;
    }
  }
};
