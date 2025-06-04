
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  openIncidents: number;
  activeAssessments: number;
  totalEmployees: number;
  verifiedEmployees: number;
  totalVehicles: number;
  verifiedVehicles: number;
  lastMonthIncidents: number;
  lastSixMonthsIncidents: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, employeeData } = useAuth();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const clientId = employeeData?.clientId || user?.clientId;
        
        if (!clientId) {
          setError('Client ID not found');
          return;
        }

        const { data, error: functionError } = await supabase.functions.invoke('dashboard-stats', {
          body: { client_id: clientId }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.success) {
          setStats(data.data);
        } else {
          throw new Error(data?.error || 'Failed to fetch dashboard stats');
        }

      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardStats();
    }
  }, [user, employeeData]);

  return { stats, loading, error };
};
