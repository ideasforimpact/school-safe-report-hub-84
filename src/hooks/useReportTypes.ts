
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReportType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

// Default report types to use as fallback if database fetch fails
const DEFAULT_REPORT_TYPES: ReportType[] = [
  { id: '1', name: 'Incident', description: 'A safety incident', is_active: true },
  { id: '2', name: 'Near Miss', description: 'A potential incident that was avoided', is_active: true },
  { id: '3', name: 'Unsafe Condition', description: 'A condition that could lead to an incident', is_active: true }
];

export function useReportTypes() {
  const [reportTypes, setReportTypes] = useState<ReportType[]>(DEFAULT_REPORT_TYPES);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReportTypes = async (activeOnly: boolean = true) => {
    try {
      setLoading(true);
      
      if (!supabase) {
        console.warn('Supabase client not available, using default report types');
        return;
      }
      
      let query = supabase
        .from('incident_report_types')
        .select('*');
      
      // Only fetch active report types if specified
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching report types:', error);
        toast.error('Failed to load report types, using defaults');
        return;
      }
      
      if (data && data.length > 0) {
        setReportTypes(data);
      } else {
        console.warn('No report types found in database, using defaults');
      }
    } catch (error) {
      console.error('Error in useReportTypes hook:', error);
      toast.error('Failed to load report types, using defaults');
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
    fetchReportTypes
  };
}
