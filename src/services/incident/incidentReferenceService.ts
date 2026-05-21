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
          ? `Cannot delete this campus because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
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
  },

  // Check if a contributing factor is referenced by incidents
  // Contributing factors are stored in a JSONB array in the contributing_factor column
  checkContributingFactorReferences: async (factorId: string, clientId: string): Promise<IncidentReferenceCheck> => {
    try {
      // Query all incidents with contributing_factor column for this client
      // Since Supabase client doesn't support complex JSONB queries easily,
      // we'll fetch all incidents with contributing_factor and filter in memory
      const { data: allIncidents, error: fetchError } = await supabase
        .from('incidents')
        .select('id, contributing_factor')
        .eq('client_id', clientId)
        .not('contributing_factor', 'is', null);

      if (fetchError) {
        throw fetchError;
      }

      // Count incidents where contributing_factor array contains an object with matching id
      // The id can be either a UUID (from contributing_factors table) or a timestamp string (legacy)
      const matchingIncidents = (allIncidents || []).filter(incident => {
        if (!incident.contributing_factor) return false;
        
        // contributing_factor is a JSONB array of objects
        const factors = Array.isArray(incident.contributing_factor) 
          ? incident.contributing_factor 
          : [];
        
        // Check if any factor in the array has the matching id
        // Compare both as strings to handle UUID and timestamp string formats
        return factors.some((factor: any) => {
          const factorIdStr = String(factor?.id || '').trim();
          const searchIdStr = String(factorId || '').trim();
          return factorIdStr === searchIdStr;
        });
      });

      const finalCount = matchingIncidents.length;
      
      return {
        hasReferences: finalCount > 0,
        count: finalCount,
        message: finalCount > 0 
          ? `Cannot delete this contributing factor because it is currently linked to ${finalCount} incident${finalCount > 1 ? 's' : ''}`
          : ''
      };
    } catch (error: any) {
      console.error('Error checking contributing factor references:', error);
      return {
        hasReferences: false,
        count: 0,
        message: ''
      };
    }
  },

  checkStudentReferences: async (studentId: string, clientId: string): Promise<IncidentReferenceCheck> => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-incidents', {
        body: { 
          clientId: clientId, 
          action: 'check-references',
          studentId: studentId
        }
      });

      if (error) {
        throw error;
      }

      return {
        hasReferences: data.hasReferences || false,
        count: data.count || 0,
        message: data.message || ''
      };
    } catch (error: any) {
      console.error('Error checking student references via edge function:', error);
      return {
        hasReferences: false,
        count: 0,
        message: ''
      };
    }
  },

  // Check if a grade is referenced by students
  checkGradeReferences: async (gradeId: string, clientId: string): Promise<IncidentReferenceCheck> => {
    try {
      // @ts-ignore - grade_id column exists but types may not be updated yet
      const result: any = await supabase
        .from('students')
        .select('id')
        .eq('grade_id', gradeId)
        .eq('client_id', clientId);
      
      if (result.error) {
        throw result.error;
      }

      const count = result.data?.length || 0;
      return {
        hasReferences: count > 0,
        count,
        message: count > 0 
          ? `Cannot delete this grade because it is currently linked to ${count} student${count > 1 ? 's' : ''}`
          : ''
      };
    } catch (error: any) {
      console.error('Error checking grade references:', error);
      return {
        hasReferences: false,
        count: 0,
        message: ''
      };
    }
  },

  // Check if a section is referenced by students
  checkSectionReferences: async (sectionId: string, clientId: string): Promise<IncidentReferenceCheck> => {
    try {
      // @ts-ignore - section_id column exists but types may not be updated yet
      const result: any = await supabase
        .from('students')
        .select('id')
        .eq('section_id', sectionId)
        .eq('client_id', clientId);
      
      if (result.error) {
        throw result.error;
      }

      const count = result.data?.length || 0;
      return {
        hasReferences: count > 0,
        count,
        message: count > 0 
          ? `Cannot delete this section because it is currently linked to ${count} student${count > 1 ? 's' : ''}`
          : ''
      };
    } catch (error: any) {
      console.error('Error checking section references:', error);
      return {
        hasReferences: false,
        count: 0,
        message: ''
      };
    }
  },

  // Check if an employee is referenced by incidents in people_involved column
  checkEmployeeReferences: async (employeeId: string, clientId: string): Promise<IncidentReferenceCheck> => {
    try {
      // Query all incidents with people_involved column for this client
      const { data: allIncidents, error: fetchError } = await supabase
        .from('incidents')
        .select('id, people_involved')
        .eq('client_id', clientId)
        .not('people_involved', 'is', null);

      if (fetchError) {
        throw fetchError;
      }

      // Count incidents where people_involved array contains an object with matching id and role 'Staff'
      const matchingIncidents = (allIncidents || []).filter(incident => {
        if (!incident.people_involved) return false;
        
        // people_involved is a JSONB array of objects
        const people = Array.isArray(incident.people_involved) 
          ? incident.people_involved 
          : [];
        
        // Check if any person in the array has the matching id and role 'Staff'
        return people.some((person: any) => {
          const personIdStr = String(person?.id || '').trim();
          const searchIdStr = String(employeeId || '').trim();
          return personIdStr === searchIdStr && person?.role === 'Staff';
        });
      });

      const finalCount = matchingIncidents.length;
      
      return {
        hasReferences: finalCount > 0,
        count: finalCount,
        message: finalCount > 0 
          ? `Cannot delete this employee because they are currently linked to ${finalCount} incident${finalCount > 1 ? 's' : ''}`
          : ''
      };
    } catch (error: any) {
      console.error('Error checking employee references:', error);
      return {
        hasReferences: false,
        count: 0,
        message: ''
      };
    }
  }
};