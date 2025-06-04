
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DashboardStats {
  openIncidents: {
    count: number;
    list: any[];
  };
  verificationStatus: {
    pending: number;
    total: number;
    percentage: number;
  };
  totalAssessments: {
    count: number;
    list: any[];
  };
  openCriticalIncidents: {
    count: number;
    list: any[];
  };
  todayIncidents: {
    count: number;
    list: any[];
  };
  weekIncidents: {
    count: number;
    list: any[];
  };
}

export const useDashboardStats = (clientId: string | null) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!clientId) {
        setStats(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching dashboard stats for client:', clientId);

        const { data, error } = await supabase.functions.invoke('dashboard-stats', {
          body: { clientId }
        });

        if (error) {
          console.error('Error calling dashboard-stats function:', error);
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch dashboard stats');
        }

        console.log('Dashboard stats received:', data.stats);
        setStats(data.stats);

      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message || 'Failed to fetch dashboard statistics');
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [clientId]);

  return {
    stats,
    loading,
    error,
    refetch: () => {
      if (clientId) {
        fetchDashboardStats();
      }
    }
  };
};
