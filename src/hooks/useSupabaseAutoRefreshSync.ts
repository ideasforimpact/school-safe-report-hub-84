import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncSupabaseAutoRefreshToActivePath } from '@/integrations/supabase/client';

/**
 * Keeps Supabase's auto-refresh running ONLY on the client whose bucket
 * matches the current URL path.
 *
 * Without this hook, both `ssoRawClient` and `backofficeRawClient` would
 * keep firing their independent auto-refresh timers in parallel as long as
 * each had a valid session in its bucket — meaning a user who's logged into
 * both flows would see TWO `/auth/v1/token?grant_type=refresh_token`
 * requests every refresh interval.
 *
 * On every route change (including SPA navigations within React Router) we
 * call `syncSupabaseAutoRefreshToActivePath()`, which:
 *   • starts auto-refresh on the active path's client
 *   • stops auto-refresh on the inactive client
 *   • is idempotent (no-op when the active path hasn't actually changed)
 *
 * The inactive client still refreshes on demand when something calls
 * `getSession()` on it — but only when actually needed, not on a timer.
 *
 * Mount this hook globally (e.g. inside ModuleSyncProvider) so it covers
 * every route the app exposes.
 */
export const useSupabaseAutoRefreshSync = (): void => {
  const location = useLocation();

  useEffect(() => {
    syncSupabaseAutoRefreshToActivePath();
  }, [location.pathname]);
};
