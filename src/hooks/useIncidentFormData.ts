
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

interface CacheEntry {
  formData: IncidentFormData;
  employees: any[];
  statuses: any[];
  students: any[];
}

const EMPTY_FORM_DATA: IncidentFormData = {
  reportTypes: [], categories: [], subcategories: [],
  locations: [], facilities: [], priorities: [],
};

// Module-level cache — keyed by `clientId::clientTypeId`.
// Only populated once both IDs are known.
const configCache = new Map<string, CacheEntry>();
const fetchInflight = new Map<string, Promise<void>>();

export function clearIncidentFormDataCache(clientId?: string) {
  if (clientId) {
    for (const key of configCache.keys()) {
      if (key.startsWith(`${clientId}::`)) configCache.delete(key);
    }
    fetchInflight.delete(clientId);
  } else {
    configCache.clear();
    fetchInflight.clear();
  }
}

export function useIncidentFormData() {
  const { employeeData } = useAuth();
  const clientId     = employeeData?.clientId    ?? null;
  const clientTypeId = employeeData?.clientType?.id ?? null;

  // Only build a cache key once both IDs are available
  const cacheKey = clientId && clientTypeId ? `${clientId}::${clientTypeId}` : null;

  const cached = cacheKey ? configCache.get(cacheKey) : null;

  const [formData,  setFormData]  = useState<IncidentFormData>(cached?.formData  ?? EMPTY_FORM_DATA);
  const [employees, setEmployees] = useState<any[]>(cached?.employees ?? []);
  const [statuses,  setStatuses]  = useState<any[]>(cached?.statuses  ?? []);
  const [students,  setStudents]  = useState<any[]>(cached?.students  ?? []);
  const [loading,   setLoading]   = useState(cached == null);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    // Wait until both IDs are resolved
    if (!clientId || !clientTypeId || !cacheKey) {
      setLoading(false);
      return;
    }

    // Already cached — apply and stop
    const existing = configCache.get(cacheKey);
    if (existing) {
      setFormData(existing.formData);
      setEmployees(existing.employees);
      setStatuses(existing.statuses);
      setStudents(existing.students);
      setLoading(false);
      return;
    }

    // Piggyback on an in-flight request for the same key
    const inflight = fetchInflight.get(cacheKey);
    if (inflight) {
      inflight.then(() => {
        const entry = configCache.get(cacheKey);
        if (entry) {
          setFormData(entry.formData);
          setEmployees(entry.employees);
          setStatuses(entry.statuses);
          setStudents(entry.students);
        }
        setLoading(false);
      });
      return;
    }

    setLoading(true);

    const doFetch = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('fetch-incidents', {
          body: { operation: 'get_config', clientId, clientTypeId },
        });

        if (fnError) throw fnError;
        if (!data?.success) throw new Error('Failed to fetch incident form data');

        const d = data.data;
        const entry: CacheEntry = {
          formData: {
            reportTypes:   d.reportTypes   || [],
            categories:    d.categories    || [],
            subcategories: d.subcategories || [],
            locations:     d.locations     || [],
            facilities:    d.facilities    || [],
            priorities:    d.priorities    || [],
          },
          employees: d.employees || [],
          statuses:  d.statuses  || [],
          students:  d.students  || [],
        };

        configCache.set(cacheKey, entry);

        setFormData(entry.formData);
        setEmployees(entry.employees);
        setStatuses(entry.statuses);
        setStudents(entry.students);
      } catch (err: any) {
        console.error('Error fetching incident form data:', err);
        setError(err.message);
        toast.error('Failed to load incident form data');
      } finally {
        setLoading(false);
        fetchInflight.delete(cacheKey);
      }
    };

    const promise = doFetch();
    fetchInflight.set(cacheKey, promise);
  }, [clientId, clientTypeId, cacheKey]);

  return { formData, employees, statuses, students, loading, error };
}
