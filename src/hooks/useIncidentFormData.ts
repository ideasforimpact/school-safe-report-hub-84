
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
interface ConfigCacheEntry {
  version: string;
  formData: IncidentFormData;
  employees: Record<string, unknown>[];
  statuses: Record<string, unknown>[];
  students: Record<string, unknown>[];
}
export const configCache = new Map<string, ConfigCacheEntry>();
const fetchInflight = new Map<string, Promise<void>>();
// Version bump — forces a re-fetch after the priorities client_id filter fix
const CACHE_VERSION = 'v3';

function buildCacheKey(clientId: string, clientTypeId: string): string {
  return `${clientId}::${clientTypeId}::${CACHE_VERSION}`;
}

export function clearIncidentFormDataCache(clientId?: string) {
  if (clientId) {
    for (const key of configCache.keys()) {
      if (key.startsWith(`${clientId}::`)) configCache.delete(key);
    }
    for (const key of fetchInflight.keys()) {
      if (key.startsWith(`${clientId}::`)) fetchInflight.delete(key);
    }
  } else {
    configCache.clear();
    fetchInflight.clear();
  }
}

export function useIncidentFormData() {
  const { employeeData, user } = useAuth();
  const clientId = employeeData?.clientId || null;
  const clientTypeId = employeeData?.clientType?.id ?? user?.clientType?.id ?? null;
  const cacheKey = clientId && clientTypeId ? buildCacheKey(clientId, clientTypeId) : null;

  const [formData, setFormData] = useState<IncidentFormData>(() => {
    const cached = cacheKey ? configCache.get(cacheKey) : undefined;
    return cached?.formData || {
      reportTypes: [],
      categories: [],
      subcategories: [],
      locations: [],
      facilities: [],
      priorities: []
    };
  });
  const [employees, setEmployees] = useState<Record<string, unknown>[]>(() => {
    const cached = cacheKey ? configCache.get(cacheKey) : undefined;
    return cached?.employees || [];
  });
  const [statuses, setStatuses] = useState<Record<string, unknown>[]>(() => {
    const cached = cacheKey ? configCache.get(cacheKey) : undefined;
    return cached?.statuses || [];
  });
  const [students, setStudents] = useState<Record<string, unknown>[]>(() => {
    const cached = cacheKey ? configCache.get(cacheKey) : undefined;
    return cached?.students || [];
  });
  const [loading, setLoading] = useState(!(cacheKey && configCache.has(cacheKey)));
  const [error, setError] = useState<string | null>(null);

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
        const entry: ConfigCacheEntry = {
          version: CACHE_VERSION,
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

        console.log('Successfully fetched and cached combined incident form data');
      } catch (err) {
        console.error("Error fetching form data:", err);
        setError(err instanceof Error ? err.message : String(err));
        toast.error("Failed to load data from database");
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
