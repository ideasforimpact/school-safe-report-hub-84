import { supabase } from "@/integrations/supabase/client";

export interface IncidentReferenceCheck {
  hasReferences: boolean;
  count: number;
  message: string;
}

export const incidentReferenceService = {
  // Check if a category is referenced by incidents
  checkCategoryReferences: async (categoryId: string, clientId: string): Promise<IncidentReferenceCheck> => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('id', { count: 'exact' })
        .eq('category_id', categoryId)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      const count = data?.length || 0;
      return {
        hasReferences: count > 0,
        count,
        message: count > 0 
          ? `Cannot delete this category because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
          : ''
      };
    } catch (error: any) {
      console.error('Error checking category references:', error);
      return {
        hasReferences: false,
        count: 0,
        message: ''
      };
    }
  },

  // Check if a subcategory is referenced by incidents
  checkSubcategoryReferences: async (subcategoryId: string, clientId: string): Promise<IncidentReferenceCheck> => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('id', { count: 'exact' })
        .eq('subcategory_id', subcategoryId)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      const count = data?.length || 0;
      return {
        hasReferences: count > 0,
        count,
        message: count > 0 
          ? `Cannot delete this subcategory because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
          : ''
      };
    } catch (error: any) {
      console.error('Error checking subcategory references:', error);
      return {
        hasReferences: false,
        count: 0,
        message: ''
      };
    }
  },

  // Check if a priority is referenced by incidents
  checkPriorityReferences: async (priorityId: string, clientId: string): Promise<IncidentReferenceCheck> => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('id', { count: 'exact' })
        .eq('priority_id', priorityId)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      const count = data?.length || 0;
      return {
        hasReferences: count > 0,
        count,
        message: count > 0 
          ? `Cannot delete this priority because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
          : ''
      };
    } catch (error: any) {
      console.error('Error checking priority references:', error);
      return {
        hasReferences: false,
        count: 0,
        message: ''
      };
    }
  },

  // Check if a report type is referenced by incidents
  checkReportTypeReferences: async (typeId: string, clientId: string): Promise<IncidentReferenceCheck> => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('id', { count: 'exact' })
        .eq('type_id', typeId)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      const count = data?.length || 0;
      return {
        hasReferences: count > 0,
        count,
        message: count > 0 
          ? `Cannot delete this report type because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
          : ''
      };
    } catch (error: any) {
      console.error('Error checking report type references:', error);
      return {
        hasReferences: false,
        count: 0,
        message: ''
      };
    }
  },

  // Check if a facility is referenced by incidents
  checkFacilityReferences: async (facilityId: string, clientId: string): Promise<IncidentReferenceCheck> => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('id', { count: 'exact' })
        .eq('facility_id', facilityId)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      const count = data?.length || 0;
      return {
        hasReferences: count > 0,
        count,
        message: count > 0 
          ? `Cannot delete this facility because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
          : ''
      };
    } catch (error: any) {
      console.error('Error checking facility references:', error);
      return {
        hasReferences: false,
        count: 0,
        message: ''
      };
    }
  },

  // Check if a location is referenced by incidents
  checkLocationReferences: async (locationId: string, clientId: string): Promise<IncidentReferenceCheck> => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('id', { count: 'exact' })
        .eq('location_id', locationId)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      const count = data?.length || 0;
      return {
        hasReferences: count > 0,
        count,
        message: count > 0 
          ? `Cannot delete this location because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
          : ''
      };
    } catch (error: any) {
      console.error('Error checking location references:', error);
      return {
        hasReferences: false,
        count: 0,
        message: ''
      };
    }
  }
};