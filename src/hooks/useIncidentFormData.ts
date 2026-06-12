
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from '@/contexts/auth/useAuth';

export interface IncidentFormData {
  reportTypes: { id: string; name: string; description: string | null }[];
  categories: { id: string; name: string; description: string | null }[];
  subcategories: { id: string; name: string; category_id: string | null }[];
  locations: { id: string; name: string; }[];
  facilities: { id: string; name: string; campus_id: string }[];
  priorities: { id: string; name: string; color: string | null }[];
}

// Module-level cache keyed by `clientId::clientTypeId`
let configCache: { [key: string]: { version: string; formData: IncidentFormData; employees: any[]; statuses: any[]; students: any[] } } = {};
let fetchInflight: { [key: string]: Promise<void> } = {};
const CACHE_VERSION = 'v6';

export function clearIncidentFormDataCache(clientId?: string) {
  if (clientId) {
    Object.keys(configCache).forEach(k => { if (k.startsWith(clientId)) delete configCache[k]; });
  } else {
    configCache = {};
  }
}

export function useIncidentFormData() {
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId;
  const clientTypeId = employeeData?.clientType?.id;
  const cacheKey = clientId && clientTypeId ? `${clientId}::${clientTypeId}` : clientId || '';

  const [formData, setFormData] = useState<IncidentFormData>(() => {
    return configCache[cacheKey]?.formData || {
      reportTypes: [], categories: [], subcategories: [],
      locations: [], facilities: [], priorities: []
    };
  });
  const [employees, setEmployees] = useState<any[]>(() => configCache[cacheKey]?.employees || []);
  const [statuses, setStatuses] = useState<any[]>(() => configCache[cacheKey]?.statuses || []);
  const [students, setStudents] = useState<any[]>(() => configCache[cacheKey]?.students || []);
  const [loading, setLoading] = useState(!configCache[cacheKey]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }

    // Hit cache
    if (configCache[cacheKey]?.version === CACHE_VERSION) {
      const cached = configCache[cacheKey];
      setFormData(cached.formData);
      setEmployees(cached.employees);
      setStatuses(cached.statuses);
      setStudents(cached.students);
      setLoading(false);
      return;
    }

    // Piggyback on in-flight request
    if (fetchInflight[cacheKey]) {
      fetchInflight[cacheKey].then(() => {
        const cached = configCache[cacheKey];
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
        const { data, error } = await supabase.functions.invoke('fetch-incidents', {
          body: { operation: 'get_config', clientId, clientTypeId: clientTypeId || null }
        });

        if (error) throw error;
        if (!data?.success) throw new Error('Failed to fetch incident form data');

        const d = data.data;
        const newFormData: IncidentFormData = {
          reportTypes: d.reportTypes || [],
          categories: d.categories || [],
          subcategories: d.subcategories || [],
          locations: d.locations || [],
          facilities: d.facilities || [],
          priorities: d.priorities || [],
        };

        configCache[cacheKey] = {
          version: CACHE_VERSION,
          formData: newFormData,
          employees: d.employees || [],
          statuses: d.statuses || [],
          students: d.students || [],
        };

        setFormData(newFormData);
        setEmployees(d.employees || []);
        setStatuses(d.statuses || []);
        setStudents(d.students || []);
      } catch (err: any) {
        console.error('Error fetching incident form data:', err);
        setError(err.message);
        toast.error('Failed to load incident form data');
      } finally {
        setLoading(false);
        delete fetchInflight[cacheKey];
      }
    };

    fetchInflight[cacheKey] = doFetch();
  }, [clientId, clientTypeId]);

  return { formData, employees, statuses, students, loading, error };
}
