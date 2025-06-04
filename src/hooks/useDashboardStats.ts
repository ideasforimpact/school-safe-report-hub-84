
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

export interface DashboardStatsData {
  openIncidents: {
    count: number;
    incidents: Array<{
      id: string;
      status: string;
      priority: string;
      created_at: string;
    }>;
  };
  verificationStatus: {
    pending: number;
    total: number;
    percentage: number;
  };
  totalAssessments: {
    count: number;
    assessments: Array<{
      id: string;
      created_at: string;
    }>;
  };
  openCriticalIncidents: {
    count: number;
    incidents: Array<{
      id: string;
      status: string;
      priority: string;
      created_at: string;
    }>;
  };
  todayIncidents: {
    count: number;
    incidents: Array<{
      id: string;
      status: string;
      priority: string;
      created_at: string;
    }>;
  };
  weekIncidents: {
    count: number;
    incidents: Array<{
      id: string;
      status: string;
      priority: string;
      created_at: string;
    }>;
  };
  transportSafety: {
    vehiclesRequiringAction: number;
    totalVehicles: number;
    vehicles: Array<{
      id: string;
      status: string;
      verification_status: string;
    }>;
  };
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, employeeData } = useAuth();

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const clientId = employeeData?.clientId || user?.clientId;
      
      if (!clientId) {
        throw new Error('Client ID not available');
      }

      console.log('Fetching dashboard statistics for client:', clientId);

      const { data, error } = await supabase.functions.invoke('dashboard-stats', {
        body: { client_id: clientId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch dashboard statistics');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch dashboard statistics');
      }

      console.log('Dashboard statistics received:', data.data);
      setStats(data.data);

    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeData?.clientId || user?.clientId) {
      fetchDashboardStats();
    }
  }, [employeeData?.clientId, user?.clientId]);

  return {
    stats,
    loading,
    error,
    refetch: fetchDashboardStats
  };
};
