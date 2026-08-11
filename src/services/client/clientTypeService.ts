import { supabase } from '@/integrations/supabase/client';

export interface ClientTypeOption {
  id: string;
  key: string;
  name: string;
}

// The client_type lookup table rarely changes, but was previously fetched
// fresh on every Add/Edit dialog mount. Cached in memory for the lifetime
// of the page load, and exposed here (rather than inside BasicInfoTab) so
// callers like ClientManagement can warm the cache as soon as the page
// loads — well before any dialog opens — instead of only fetching lazily
// the moment a dialog first mounts.
let cachedClientTypes: ClientTypeOption[] | null = null;
let cachedClientTypesPromise: Promise<ClientTypeOption[]> | null = null;

export const getClientTypes = async (): Promise<ClientTypeOption[]> => {
  if (cachedClientTypes) return cachedClientTypes;

  if (!cachedClientTypesPromise) {
    cachedClientTypesPromise = supabase
      .from('client_type')
      .select('id, key, name')
      .order('name')
      .then(({ data, error }) => {
        if (error) throw error;
        cachedClientTypes = data || [];
        return cachedClientTypes;
      })
      .catch((error) => {
        // Let the next caller retry instead of caching a failed fetch forever.
        cachedClientTypesPromise = null;
        throw error;
      });
  }

  return cachedClientTypesPromise;
};
