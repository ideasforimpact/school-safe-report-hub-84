
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { reportTypeService, ReportTypeItem } from '@/services/incident/reportTypeService';

// Default report types to use as fallback if database fetch fails
const DEFAULT_REPORT_TYPES: ReportTypeItem[] = [
  { id: '1', name: 'Incident', description: 'A safety incident', is_active: true },
  { id: '2', name: 'Near Miss', description: 'A potential incident that was avoided', is_active: true },
  { id: '3', name: 'Unsafe Condition', description: 'A condition that could lead to an incident', is_active: true }
];

export function useReportTypes() {
  const [reportTypes, setReportTypes] = useState<ReportTypeItem[]>(DEFAULT_REPORT_TYPES);
  const [loading, setLoading] = useState<boolean>(true);
  const { employeeData } = useAuth();

  const fetchReportTypes = async (activeOnly: boolean = true) => {
    try {
      setLoading(true);
      
      if (!employeeData?.clientId) {
        console.warn('Client ID not available for fetching report types');
        setReportTypes(DEFAULT_REPORT_TYPES);
        return;
      }
      
      const types = await reportTypeService.getReportTypes(employeeData.clientId, activeOnly);
      
      if (types && types.length > 0) {
        setReportTypes(types);
      } else {
        console.warn('No report types found in database, using defaults');
        setReportTypes(DEFAULT_REPORT_TYPES);
      }
    } catch (error) {
      console.error('Error in useReportTypes hook:', error);
      setReportTypes(DEFAULT_REPORT_TYPES);
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
