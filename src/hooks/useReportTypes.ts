
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReportType {
  id: string;
  name: string;
  description?: string;
}

export const useReportTypes = () => {
  const [reportTypes, setReportTypes] = useState<ReportType[]>([
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
          .select('id, name, description')
          .eq('is_active', true)
          .order('name');
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Map the data from the database
          setReportTypes(data.map(type => ({
            id: type.id,
            name: type.name,
            description: type.description || undefined
          })));
        }
      } catch (error) {
        console.error('Error fetching report types:', error);
        // Fallback to default types if fetch fails
        setReportTypes([
          { id: 'Incident', name: 'Incident' },
          { id: 'Near Miss', name: 'Near Miss' },
          { id: 'Unsafe Condition', name: 'Unsafe Condition' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchReportTypes();
  }, []);

  return { reportTypes, loading };
};
