
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfigItem } from '@/contexts/types';

export interface IncidentFormData {
  reportTypes: { id: string; name: string; description: string | null }[];
  categories: { id: string; name: string; description: string | null }[];
  subcategories: { id: string; name: string; category_id: string | null }[];
  locations: { id: string; name: string; }[];
  facilities: { id: string; name: string; campus_id: string }[];
  priorities: { id: string; name: string; color: string | null }[];
}

export function useIncidentFormData() {
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
      setLoading(true);
      try {
        // Fetch report types
        const { data: reportTypes, error: reportTypesError } = await supabase
          .from('incident_report_types')
          .select('id, name, description')
          .eq('is_active', true);
          
        if (reportTypesError) throw reportTypesError;
        
        // Fetch categories
        const { data: categories, error: categoriesError } = await supabase
          .from('incident_categories')
          .select('id, name, description')
          .eq('is_active', true);
          
        if (categoriesError) throw categoriesError;
        
        // Fetch subcategories
        const { data: subcategories, error: subcategoriesError } = await supabase
          .from('incident_subcategories')
          .select('id, name, category_id')
          .eq('is_active', true);
          
        if (subcategoriesError) throw subcategoriesError;
        
        // Fetch locations (campuses)
        const { data: locations, error: locationsError } = await supabase
          .from('campuses')
          .select('id, name');
          
        if (locationsError) throw locationsError;
        
        // Fetch facilities
        const { data: facilities, error: facilitiesError } = await supabase
          .from('facilities')
          .select('id, name, campus_id');
          
        if (facilitiesError) throw facilitiesError;
        
        // Fetch priorities
        const { data: priorities, error: prioritiesError } = await supabase
          .from('incident_priorities')
          .select('id, name, color, weight')
          .eq('is_active', true)
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
      } catch (err: any) {
        console.error("Error fetching form data:", err);
        setError(err.message);
        toast.error("Failed to load data from database");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  return {
    formData,
    loading,
    error
  };
}
