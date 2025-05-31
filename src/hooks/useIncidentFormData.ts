
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfigItem } from '@/contexts/types';
import { useAuth } from '@/contexts/auth/useAuth';

export interface IncidentFormData {
  reportTypes: { id: string; name: string; description: string | null }[];
  categories: { id: string; name: string; description: string | null }[];
  subcategories: { id: string; name: string; category_id: string | null }[];
  locations: { id: string; name: string; }[];
  facilities: { id: string; name: string; campus_id: string }[];
  priorities: { id: string; name: string; color: string | null }[];
}

export function useIncidentFormData() {
  const { employeeData } = useAuth();
  const [formData, setFormData] = useState<IncidentFormData>({
    reportTypes: [],
    categories: [],
    subcategories: [],
    locations: [],
    facilities: [],
    priorities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      if (!employeeData?.clientId) {
        //console.log('No client ID available for fetching incident form data');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        //console.log('Fetching incident form data for client:', employeeData.clientId);

        // Fetch report types filtered by client_id
        const { data: reportTypes, error: reportTypesError } = await supabase
          .from('incident_report_types')
          .select('id, name, description')
          .eq('is_active', true)
          .eq('client_id', employeeData.clientId);
          
        if (reportTypesError) throw reportTypesError;
        
        // Fetch categories filtered by client_id
        const { data: categories, error: categoriesError } = await supabase
          .from('incident_categories')
          .select('id, name, description')
          .eq('is_active', true)
          .eq('client_id', employeeData.clientId);
          
        if (categoriesError) throw categoriesError;
        
        // Fetch subcategories filtered by client_id
        const { data: subcategories, error: subcategoriesError } = await supabase
          .from('incident_subcategories')
          .select('id, name, category_id')
          .eq('is_active', true)
          .eq('client_id', employeeData.clientId);
          
        if (subcategoriesError) throw subcategoriesError;
        
        // Fetch locations (campuses) filtered by client_id
        const { data: locations, error: locationsError } = await supabase
          .from('campuses')
          .select('id, name')
          .eq('client_id', employeeData.clientId);
          
        if (locationsError) throw locationsError;
        
        // Fetch facilities filtered by client_id
        const { data: facilities, error: facilitiesError } = await supabase
          .from('facilities')
          .select('id, name, campus_id')
          .eq('client_id', employeeData.clientId);
          
        if (facilitiesError) throw facilitiesError;
        
        // Fetch priorities filtered by client_id
        const { data: priorities, error: prioritiesError } = await supabase
          .from('incident_priorities')
          .select('id, name, color, weight')
          .eq('is_active', true)
          .eq('client_id', employeeData.clientId)
          .order('weight', { ascending: true });
          
        if (prioritiesError) throw prioritiesError;
        
        setFormData({
          reportTypes: reportTypes || [],
          categories: categories || [],
          subcategories: subcategories || [],
          locations: locations || [],
          facilities: facilities || [],
          priorities: priorities || []
        });

        //console.log('Successfully fetched incident form data:', {
          reportTypes: reportTypes?.length || 0,
          categories: categories?.length || 0,
          subcategories: subcategories?.length || 0,
          locations: locations?.length || 0,
          facilities: facilities?.length || 0,
          priorities: priorities?.length || 0
        });
      } catch (err: any) {
        console.error("Error fetching form data:", err);
        setError(err.message);
        toast.error("Failed to load data from database");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [employeeData?.clientId]);
  
  return {
    formData,
    loading,
    error
  };
}
