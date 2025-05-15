
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReportTypeItem {
  id: string;
  name: string;
}

export const useReportTypes = () => {
  const [reportTypes, setReportTypes] = useState<ReportTypeItem[]>([
    { id: 'Incident', name: 'Incident' },
    { id: 'Near Miss', name: 'Near Miss' },
    { id: 'Unsafe Condition', name: 'Unsafe Condition' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportTypes = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('incident_report_types')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setReportTypes(data);
        }
      } catch (error) {
        console.error('Error fetching report types:', error);
        // Use fallback values if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchReportTypes();
  }, []);

  return { reportTypes, loading };
};
