
import { useState, useEffect } from 'react';
import { incidentDataService } from '@/services/incident/incidentDataService';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';

interface IncidentStats {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
}

export const useIncidentStats = () => {
  const [stats, setStats] = useState<IncidentStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { state: employeeState } = useEmployeeStore();
  const { employeeData: authEmployeeData } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;
        
        if (!clientId) {
          setStats({ total: 0, open: 0, inProgress: 0, closed: 0 });
          return;
        }

        const incidentStats = await incidentDataService.getIncidentStats(clientId);
        setStats(incidentStats);

      } catch (err: any) {
        console.error('Error fetching incident stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId]);

  return {
    stats,
    loading,
    error
  };
};
