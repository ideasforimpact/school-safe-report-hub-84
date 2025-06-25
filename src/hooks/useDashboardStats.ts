
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  openIncidents: number;
  activeAssessments: number;
  totalEmployees: number;
  employeesVerified: number;
  totalVehicles: number;
  vehiclesWithDocuments: number;
  incidentsLastMonth: number;
  incidentsLast6Months: number;
  monthlyIncidentsData: Array<{
    month: string;
    open: number;
    closed: number;
    total: number;
  }>;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    openIncidents: 0,
    activeAssessments: 0,
    totalEmployees: 0,
    employeesVerified: 0,
    totalVehicles: 0,
    vehiclesWithDocuments: 0,
    incidentsLastMonth: 0,
    incidentsLast6Months: 0,
    monthlyIncidentsData: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, employeeData } = useAuth();
  const clientId = employeeData?.clientId || user?.clientId;

  useEffect(() => {
    const fetchStats = async () => {
      if (!clientId) {
        console.log('No client ID available for dashboard stats');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching dashboard stats for client:', clientId);

        // Prepare request body with employee information for role-based filtering
        const requestBody = {
          client_id: clientId,
          employee_id: employeeData?.id || null,
          is_super_admin: employeeData?.isSuperAdmin || false
        };

        console.log('Dashboard stats request:', requestBody);

        const { data, error } = await supabase.functions.invoke('dashboard-stats', {
          body: requestBody
        });

        if (error) {
          throw error;
        }

        console.log('Dashboard stats received:', data);
        setStats(data);

      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [clientId, employeeData?.id, employeeData?.isSuperAdmin]);

  return {
    stats,
    loading,
    error
  };
};
