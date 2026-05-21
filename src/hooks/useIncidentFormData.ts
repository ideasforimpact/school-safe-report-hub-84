
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
let configCache: { [clientId: string]: any } = {};
let fetchInflight: { [clientId: string]: Promise<void> } = {};

export function useIncidentFormData() {
  const { employeeData } = useAuth();
  const [formData, setFormData] = useState<IncidentFormData>(() => {
    const cached = configCache[employeeData?.clientId || ''];
    return cached?.formData || {
      reportTypes: [],
      categories: [],
      subcategories: [],
      locations: [],
      facilities: [],
      priorities: []
    };
  });
  const [employees, setEmployees] = useState<any[]>(() => {
    const cached = configCache[employeeData?.clientId || ''];
    return cached?.employees || [];
  });
  const [statuses, setStatuses] = useState<any[]>(() => {
    const cached = configCache[employeeData?.clientId || ''];
    return cached?.statuses || [];
  });
  const [students, setStudents] = useState<any[]>(() => {
    const cached = configCache[employeeData?.clientId || ''];
    return cached?.students || [];
  });
  const [loading, setLoading] = useState(!configCache[employeeData?.clientId || '']);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const clientId = employeeData?.clientId;
    if (!clientId) {
      setLoading(false);
      return;
    }

    // Already cached — apply immediately without a network call
    if (configCache[clientId]) {
      const cached = configCache[clientId];
      setFormData(cached.formData);
      setEmployees(cached.employees);
      setStatuses(cached.statuses);
      setStudents(cached.students);
      setLoading(false);
      return;
    }

    // Another hook instance is already fetching — piggyback on it
    if (fetchInflight[clientId]) {
      fetchInflight[clientId].then(() => {
        const cached = configCache[clientId];
        if (cached) {
          setFormData(cached.formData);
          setEmployees(cached.employees);
          setStatuses(cached.statuses);
          setStudents(cached.students);
        }
        setLoading(false);
      });
      return;
    }

    setLoading(true);

    const doFetch = async () => {
      try {
        console.log('Fetching combined incident form data for client:', clientId);

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) throw new Error("No authentication token available");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-incidents`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ operation: 'get_config', clientId })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          const { data } = result;
          const newFormData = {
            reportTypes: data.reportTypes || [],
            categories: data.categories || [],
            subcategories: data.subcategories || [],
            locations: data.locations || [],
            facilities: data.facilities || [],
            priorities: data.priorities || []
          };

          configCache[clientId] = {
            formData: newFormData,
            employees: data.employees || [],
            statuses: data.statuses || [],
            students: data.students || []
          };

          setFormData(newFormData);
          setEmployees(data.employees || []);
          setStatuses(data.statuses || []);
          setStudents(data.students || []);

          console.log('Successfully fetched and cached combined incident form data');
        } else {
          throw new Error("Failed to fetch data from edge function");
        }
      } catch (err: any) {
        console.error("Error fetching form data:", err);
        setError(err.message);
        toast.error("Failed to load data from database");
      } finally {
        setLoading(false);
        delete fetchInflight[clientId];
      }
    };

    fetchInflight[clientId] = doFetch();
  }, [employeeData?.clientId]);
  
  return {
    formData,
    employees,
    statuses,
    students,
    loading,
    error
  };
}
