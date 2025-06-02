
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { incidentService, IncidentRecord } from '@/services/incidentService';
import IncidentsDataTable from '@/components/incidents/IncidentsDataTable';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const IncidentsList = () => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);

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
          console.log('No client ID found');
          setIncidents([]);
          return;
        }

        console.log('Fetching incidents for client:', clientId);
        const fetchedIncidents = await incidentService.fetchIncidents(clientId);
        setIncidents(fetchedIncidents);

      } catch (error: any) {
        console.error('Error fetching incidents:', error);
        toast.error('Failed to load incidents. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email]);

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="w-full">
            <IncidentsHeader />
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8">
          <IncidentsDataTable incidents={incidents} loading={loading} />
        </div>
      </div>
    </Layout>
  );
};

export default IncidentsList;
