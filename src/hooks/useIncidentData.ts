
import { useState, useEffect } from 'react';
import { Incident } from '@/types/incident';
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
      const transformedIncidents: Incident[] = (data || []).map(incident => ({
        id: incident.id,
        ticketId: incident.ticket_id,
        type: incident.incident_report_types?.name || 'Incident',
        category: incident.incident_categories?.name || 'Other',
        subcategory: incident.incident_subcategories?.name || '',
        description: incident.description || '',
        date: new Date(incident.date),
        location: 'On Campus', // You might want to add a locations table lookup
        peopleInvolved: incident.people_involved || [],
        status: incident.incident_status?.name || 'New',
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
        documents: incident.documents || [],
        createdAt: new Date(incident.created_at),
        updatedAt: new Date(incident.updated_at),
        priority: incident.incident_priorities?.name
      }));

      setIncidents(transformedIncidents);
      console.log('Successfully fetched incidents:', transformedIncidents.length);

    } catch (error) {
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
    } else if (!state.loading) {
      // Only show error if not still loading employee data
      setError("Access denied: No client association found");
      setLoading(false);
    }
  }, [state.employeeData?.clientId, state.loading]);

  return {
    incidents,
    loading,
    error,
    refetchIncidents: fetchIncidents
  };
}
