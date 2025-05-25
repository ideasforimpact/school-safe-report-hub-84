
import { useState, useEffect } from 'react';
import { Incident, IncidentType, IncidentCategory, IncidentLocation, IncidentStatus, Person, Document, ContributingFactor } from '@/types/incident';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { toast } from 'sonner';

export function useIncidentData() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state } = useEmployeeStore();

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user has client_id access
      if (!state.employeeData?.clientId) {
        throw new Error("Access denied: No client association found");
      }

      console.log('Fetching incidents for client:', state.employeeData.clientId);

      // Call the edge function to fetch incidents
      const { data, error: functionError } = await supabase.functions.invoke('fetch-incidents', {
        body: {
          client_id: state.employeeData.clientId,
          employee_id: state.employeeData.id
        }
      });

      if (functionError) {
        throw new Error(`Failed to fetch incidents: ${functionError.message}`);
      }

      if (!data || !data.incidents) {
        throw new Error('No incidents data received');
      }

      console.log('Fetched incidents data:', data.incidents);

      // Transform the data to match our Incident type
      const transformedIncidents: Incident[] = data.incidents.map((incident: any) => {
        // Convert people_involved from Json[] to Person[]
        const peopleInvolved: Person[] = Array.isArray(incident.people_involved) 
          ? incident.people_involved.map((person: any) => {
              if (typeof person === 'object' && person !== null && 'name' in person) {
                return {
                  name: person.name || '',
                  role: person.role || 'Other' as 'Student' | 'Staff' | 'Other',
                  notes: person.notes || '',
                  id: person.id || ''
                };
              }
              return {
                name: String(person),
                role: 'Other' as 'Student' | 'Staff' | 'Other',
                notes: '',
                id: ''
              };
            })
          : [];

        // Convert documents from Json[] to Document[]
        const documents: Document[] = Array.isArray(incident.documents)
          ? incident.documents.map((doc: any) => {
              if (typeof doc === 'object' && doc !== null && 'name' in doc) {
                return {
                  name: doc.name || '',
                  type: doc.type || '',
                  data: doc.data || ''
                };
              }
              return {
                name: String(doc),
                type: '',
                data: ''
              };
            })
          : [];

        // Convert contributing_factor from Json[] to ContributingFactor[]
        const contributingFactor: ContributingFactor[] = Array.isArray(incident.contributing_factor)
          ? incident.contributing_factor.map((factor: any) => {
              if (typeof factor === 'object' && factor !== null) {
                return {
                  id: factor.id || '',
                  category: factor.category || '',
                  description: factor.description || '',
                  weight: factor.weight || 'Low' as 'Low' | 'Medium' | 'High'
                };
              }
              return {
                id: '',
                category: '',
                description: String(factor),
                weight: 'Low' as 'Low' | 'Medium' | 'High'
              };
            })
          : [];

        return {
          id: incident.id,
          ticketId: incident.ticket_id,
          type: (incident.incident_report_types?.name || 'Incident') as IncidentType,
          category: (incident.incident_categories?.name || 'Other') as IncidentCategory,
          subcategory: incident.incident_subcategories?.name || '',
          description: incident.description || '',
          date: new Date(incident.date),
          location: 'On Campus' as IncidentLocation,
          peopleInvolved,
          status: (incident.incident_status?.name || 'New') as IncidentStatus,
          reportedBy: {
            id: incident.created_by_employee?.id || incident.created_by,
            name: incident.created_by_employee 
              ? `${incident.created_by_employee.first_name} ${incident.created_by_employee.last_name}`
              : 'Unknown User'
          },
          owner: incident.assigned_to_employee ? {
            id: incident.assigned_to_employee.id,
            name: `${incident.assigned_to_employee.first_name} ${incident.assigned_to_employee.last_name}`
          } : undefined,
          facility: incident.facilities?.name,
          documents,
          createdAt: new Date(incident.created_at),
          updatedAt: new Date(incident.updated_at),
          priority: incident.incident_priorities?.name as 'Low' | 'Medium' | 'High' | 'Critical' | undefined,
          // New fields from database
          rootCauseAnalysis: incident.root_cause_analysis || undefined,
          actionTaken: incident.action_taken || undefined,
          contributingFactor: contributingFactor.length > 0 ? contributingFactor : undefined
        };
      });

      console.log('Transformed incidents:', transformedIncidents);
      setIncidents(transformedIncidents);

    } catch (error: any) {
      console.error('Error fetching incidents:', error);
      setError(error.message);
      toast.error(error.message);
      setIncidents([]); // Clear incidents on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state.employeeData?.clientId) {
      fetchIncidents();
    } else if (!state.isLoading) {
      // Only show error if not still loading employee data
      setError("Access denied: No client association found");
      setLoading(false);
    }
  }, [state.employeeData?.clientId, state.isLoading]);

  return {
    incidents,
    loading,
    error,
    refetchIncidents: fetchIncidents
  };
}
