
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
      const clientTypeKey = employeeData?.clientType?.key;
      if (!employeeData?.clientId || !clientTypeKey) {
        console.log('No client ID or type available for fetching incident form data');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching incident form data for client:', employeeData.clientId, 'type:', clientTypeKey);

        // Fetch report types filtered by client type
        let reportTypesQuery = supabase
          .from('incident_report_types')
          .select('id, name, description')
          .eq('is_active', true);
        if (clientTypeKey) reportTypesQuery = reportTypesQuery.eq('client_type_key', clientTypeKey);
        const { data: reportTypes, error: reportTypesError } = await reportTypesQuery;
        if (reportTypesError) throw reportTypesError;
        // Fetch categories filtered by client_id and client type
        let categoriesQuery = supabase
          .from('incident_categories')
          .select('id, name, description')
          .eq('is_active', true)
          .eq('client_id', employeeData.clientId);
        if (clientTypeKey) categoriesQuery = categoriesQuery.eq('client_type_key', clientTypeKey);
        const { data: categories, error: categoriesError } = await categoriesQuery;
        if (categoriesError) throw categoriesError;

        // Fetch subcategories filtered by client_id and client type
        let subcategoriesQuery = supabase
          .from('incident_subcategories')
          .select('id, name, category_id')
          .eq('is_active', true)
          .eq('client_id', employeeData.clientId);
        if (clientTypeKey) subcategoriesQuery = subcategoriesQuery.eq('client_type_key', clientTypeKey);
        const { data: subcategories, error: subcategoriesError } = await subcategoriesQuery;
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
        
        // Fetch priorities filtered by client type
        let prioritiesQuery = supabase
          .from('incident_priorities')
          .select('id, name, color, weight')
          .eq('is_active', true)
          .order('weight', { ascending: true });
        if (clientTypeKey) prioritiesQuery = prioritiesQuery.eq('client_type_key', clientTypeKey);
        const { data: priorities, error: prioritiesError } = await prioritiesQuery;
          
        if (prioritiesError) throw prioritiesError;
        
        setFormData({
          reportTypes: reportTypes || [],
          categories: categories || [],
          subcategories: subcategories || [],
          locations: locations || [],
          facilities: facilities || [],
          priorities: priorities || []
        });

        console.log('Successfully fetched incident form data:', {
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
  }, [employeeData?.clientId, employeeData?.clientType?.key]);
  
  return {
    formData,
    loading,
    error
  };
}
