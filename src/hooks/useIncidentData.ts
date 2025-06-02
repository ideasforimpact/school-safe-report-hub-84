
import { useState, useEffect, useCallback, useRef } from 'react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Incident } from '@/types/incident';
import { toast } from 'sonner';

// Cache to prevent duplicate requests
let cachedIncidents: Incident[] = [];
let lastFetchTime = 0;
let isCurrentlyFetching = false;
const CACHE_DURATION = 5000; // 5 seconds cache

export const useIncidentData = () => {
  const [incidents, setIncidents] = useState<Incident[]>(cachedIncidents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchIncidents = useCallback(async (forceRefresh = false) => {
    // Prevent duplicate requests
    if (isCurrentlyFetching && !forceRefresh) {
      return;
    }

    // Use cache if recent and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && cachedIncidents.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      setIncidents(cachedIncidents);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      isCurrentlyFetching = true;

      // Get client and employee IDs
      let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;
      let employeeId = employeeState.employeeData?.id || authEmployeeData?.id;

      // If no employee data from state, try to fetch from database using user email
      if (!employeeId && user?.email) {
        const { data: empData, error: empError } = await supabase
          .from('employees')
          .select('id, client_id')
          .eq('email', user.email.toLowerCase())
          .single();
          
        if (empData && !empError) {
          employeeId = empData.id;
          clientId = empData.client_id;
        }
      }

      if (!clientId) {
        console.warn('No client ID found, cannot fetch incidents');
        setIncidents([]);
        return;
      }

      console.log('Fetching incidents with client ID:', clientId);

      // Call the optimized fetch-incidents edge function
      const { data, error: fetchError } = await supabase.functions.invoke('fetch-incidents', {
        body: { clientId, employeeId }
      });

      if (fetchError) {
        console.error('Error from fetch-incidents function:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch incidents');
      }

      if (!data || !data.success) {
        console.error('Fetch incidents function returned error:', data);
        throw new Error(data?.error || 'Failed to fetch incidents');
      }

      console.log('Raw incidents data from function:', data.incidents);

      // Transform the data to match our Incident interface
      const transformedIncidents: Incident[] = (data.incidents || []).map((inc: any) => ({
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
          id: inc.created_by_employee?.id || '',
          name: inc.created_by_employee ? 
            `${inc.created_by_employee.first_name} ${inc.created_by_employee.last_name}` : 
            'Unknown'
        },
        owner: inc.assigned_employee ? {
          id: inc.assigned_employee.id,
          name: `${inc.assigned_employee.first_name} ${inc.assigned_employee.last_name}`
        } : undefined,
        facility: inc.facilities?.name || '',
        documents: Array.isArray(inc.documents) ? inc.documents : [],
        createdAt: new Date(inc.created_at),
        updatedAt: new Date(inc.updated_at),
        priority: inc.incident_priorities?.name as 'Low' | 'Medium' | 'High' | 'Critical' || 'Medium',
        comments: Array.isArray(inc.comments) ? inc.comments : []
      }));

      console.log('Transformed incidents:', transformedIncidents);
      
      // Update cache
      cachedIncidents = transformedIncidents;
      lastFetchTime = now;
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
      isCurrentlyFetching = false;
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
