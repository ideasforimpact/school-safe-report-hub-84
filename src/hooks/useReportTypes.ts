
import { useState, useEffect } from 'react';
import { reportTypeService, ReportTypeItem } from '@/services/incident/reportTypeService';

export function useReportTypes(clientTypeKey?: string) {
  const [reportTypes, setReportTypes] = useState<ReportTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportTypes = async (activeOnly: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const types = await reportTypeService.getReportTypes(activeOnly, clientTypeKey);
      // Sort active report types to the top
      const sortedTypes = (types || []).sort((a, b) => {
        // Active items first
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        // Then sort by name alphabetically
        return a.name.localeCompare(b.name);
      });
      
      setReportTypes(sortedTypes);
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
  }, [clientTypeKey]);

  return {
    reportTypes,
    loading,
    error,
    fetchReportTypes
  };
}

// Hook for fetching only active report types (for forms, dropdowns, etc.)
export function useActiveReportTypes() {
  const [reportTypes, setReportTypes] = useState<ReportTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // RLS handles client filtering automatically - no need for manual client checks
      const types = await reportTypeService.getReportTypes(true); // Only active
      
      // Sort by name alphabetically for active report types
      const sortedTypes = (types || []).sort((a, b) => a.name.localeCompare(b.name));
      
      setReportTypes(sortedTypes);
    } catch (err: any) {
      console.error("Error fetching active report types:", err);
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
