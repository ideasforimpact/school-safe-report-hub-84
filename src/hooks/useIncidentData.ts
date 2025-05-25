
import { useState, useEffect } from 'react';
import { Incident, IncidentType, IncidentCategory, IncidentLocation, IncidentStatus, Person, Document } from '@/types/incident';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

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

      // Fetch incidents with client_id restriction
      const { data, error: fetchError } = await supabase
        .from('incidents')
        .select(`
          *,
          incident_categories(name),
          incident_subcategories(name),
          incident_status(name),
          incident_priorities(name),
          incident_report_types(name),
          facilities(name),
          created_by_employee:employees!incidents_created_by_fkey(id, first_name, last_name),
          assigned_to_employee:employees!incidents_assigned_to_fkey(id, first_name, last_name)
        `)
        .eq('client_id', state.employeeData.clientId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching incidents:', fetchError);
        throw new Error(`Failed to fetch incidents: ${fetchError.message}`);
      }

      // Transform the data to match our Incident type
      const transformedIncidents: Incident[] = (data || []).map(incident => {
        // Convert people_involved from Json[] to Person[]
        const peopleInvolved: Person[] = Array.isArray(incident.people_involved) 
          ? incident.people_involved.map(person => {
              if (typeof person === 'object' && person !== null && 'name' in person) {
                return {
                  name: (person as any).name || '',
                  role: (person as any).role || 'Other' as 'Student' | 'Staff' | 'Other',
                  notes: (person as any).notes || '',
                  id: (person as any).id || ''
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
          ? incident.documents.map(doc => {
              if (typeof doc === 'object' && doc !== null && 'name' in doc) {
                return {
                  name: (doc as any).name || '',
                  type: (doc as any).type || '',
                  data: (doc as any).data || ''
                };
              }
              return {
                name: String(doc),
                type: '',
                data: ''
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
          priority: incident.incident_priorities?.name as 'Low' | 'Medium' | 'High' | 'Critical' | undefined
        };
      });

      setIncidents(transformedIncidents);
      console.log('Successfully fetched incidents:', transformedIncidents.length);

    } catch (error: any) {
      console.error('Error in fetchIncidents:', error);
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
