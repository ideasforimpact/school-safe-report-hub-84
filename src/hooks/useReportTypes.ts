
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { reportTypeService, ReportTypeItem } from '@/services/incident/reportTypeService';

export function useReportTypes() {
  const [reportTypes, setReportTypes] = useState<ReportTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { employeeData } = useAuth();

  const fetchReportTypes = async (activeOnly: boolean = true) => {
    try {
      setLoading(true);
      
      if (!employeeData?.clientId) {
        console.warn('Client ID not available for fetching report types');
        setReportTypes([]);
        return;
      }
      
      const types = await reportTypeService.getReportTypes(employeeData.clientId, activeOnly);
      setReportTypes(types || []);
    } catch (error) {
      console.error('Error in useReportTypes hook:', error);
      setReportTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportTypes();
  }, [employeeData?.clientId]);

  return {
    reportTypes,
    loading,
    fetchReportTypes
  };
}
