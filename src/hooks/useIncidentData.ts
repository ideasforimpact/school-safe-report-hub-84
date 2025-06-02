
import { useState, useEffect, useCallback } from 'react';
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

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get client ID from available sources
      let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;

      // If no client ID from context, get from user email
      if (!clientId && user?.email) {
        const { data: empData } = await supabase
          .from('employees')
          .select('client_id')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();
          
        if (empData) {
          clientId = empData.client_id;
        }
      }

      if (!clientId) {
        setIncidents([]);
        return;
      }

      console.log('Fetching incidents for client:', clientId);

      // Direct Supabase query without edge function
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
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching incidents:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Transform the data
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
      console.log(`Successfully fetched ${transformedIncidents.length} incidents`);

    } catch (error: any) {
      console.error('Error fetching incidents:', error);
      setError(error.message);
      toast.error('Failed to load incidents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email]);

  const refetchIncidents = useCallback(async () => {
    await fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return {
    incidents,
    loading,
    error,
    refetchIncidents
  };
};
