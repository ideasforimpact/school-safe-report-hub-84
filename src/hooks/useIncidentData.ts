
import { useState, useEffect, useCallback, useRef } from 'react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Incident } from '@/types/incident';
import { toast } from 'sonner';

export const useIncidentData = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchIncidents = useCallback(async (forceRefresh = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Get client ID from multiple sources
      let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;

      // If no client ID from context, try to get from user email (use maybeSingle to avoid error)
      if (!clientId && user?.email) {
        const { data: empData, error: empError } = await supabase
          .from('employees')
          .select('client_id')
          .eq('email', user.email.toLowerCase())
          .maybeSingle(); // Use maybeSingle instead of single
          
        if (empData && !empError) {
          clientId = empData.client_id;
        }
      }

      if (!clientId) {
        console.log('No client ID found, showing empty incidents list');
        setIncidents([]);
        return;
      }

      console.log('Fetching incidents for client:', clientId);

      // Simple direct query to incidents table
      const { data: incidents, error } = await supabase
        .from('incidents')
        .select(`
          id,
          ticket_id,
          description,
          date,
          people_involved,
          documents,
          comments,
          created_at,
          updated_at,
          incident_report_types:type_id(name),
          incident_categories:category_id(name),
          incident_subcategories:subcategory_id(name),
          campuses:location_id(name),
          facilities:facility_id(name),
          incident_priorities:priority_id(name),
          incident_status:status_id(name),
          created_by_employee:employees!created_by(first_name, last_name),
          assigned_employee:employees!assigned_to(first_name, last_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching incidents:', error);
        throw new Error(`Failed to fetch incidents: ${error.message}`);
      }

      console.log(`Successfully fetched ${incidents?.length || 0} incidents`);

      // Transform the data to match our Incident interface
      const transformedIncidents: Incident[] = (incidents || []).map((inc: any) => ({
        id: inc.id,
        ticketId: inc.ticket_id,
        type: inc.incident_report_types?.name || 'Unknown',
        category: inc.incident_categories?.name || 'Unknown',
        subcategory: inc.incident_subcategories?.name || '',
        description: inc.description || '',
        date: new Date(inc.date),
        location: inc.campuses?.name || 'Unknown',
        peopleInvolved: Array.isArray(inc.people_involved) ? inc.people_involved : [],
        status: inc.incident_status?.name || 'Unknown',
        reportedBy: {
          id: inc.created_by || '',
          name: inc.created_by_employee ? 
            `${inc.created_by_employee.first_name} ${inc.created_by_employee.last_name}` : 
            'Unknown'
        },
        owner: inc.assigned_employee ? {
          id: inc.assigned_to,
          name: `${inc.assigned_employee.first_name} ${inc.assigned_employee.last_name}`
        } : undefined,
        facility: inc.facilities?.name || '',
        documents: Array.isArray(inc.documents) ? inc.documents : [],
        createdAt: new Date(inc.created_at),
        updatedAt: new Date(inc.updated_at),
        priority: inc.incident_priorities?.name as 'Low' | 'Medium' | 'High' | 'Critical' || 'Medium',
        comments: Array.isArray(inc.comments) ? inc.comments : []
      }));

      setIncidents(transformedIncidents);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Error fetching incidents:', error);
      setError(error.message);
      toast.error('Failed to load incidents: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email]);

  const refetchIncidents = useCallback(async () => {
    console.log('Force refetching incidents...');
    await fetchIncidents(true);
  }, [fetchIncidents]);

  useEffect(() => {
    fetchIncidents();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchIncidents]);

  return {
    incidents,
    loading,
    error,
    refetchIncidents
  };
};
