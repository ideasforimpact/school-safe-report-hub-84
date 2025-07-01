
import { useState, useEffect } from 'react';
import { reportTypeService, ReportTypeItem } from '@/services/incident/reportTypeService';

export function useReportTypes() {
  const [reportTypes, setReportTypes] = useState<ReportTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportTypes = async (activeOnly: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      // RLS handles client filtering automatically - no need for manual client checks
      const types = await reportTypeService.getReportTypes(activeOnly);
      setReportTypes(types || []);
    } catch (err: any) {
      console.error("Error fetching report types:", err);
      setError(err.message);
      setReportTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportTypes();
  }, []);

  return {
    reportTypes,
    loading,
    error,
    fetchReportTypes
  };
}
