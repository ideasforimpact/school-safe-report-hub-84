import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setConfiguredModules } from '@/store/employeeActions';
import { getCurrentUser, getIsBackofficeUser } from '@/store/authSelectors';
import { saveAuthState, loadAuthState } from '@/store/authPersistence';
import { getBackofficeDefaultPath } from '@/components/layout/sidebar/sidebarConfig';

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

// Backoffice paths that are NOT derived from modules table rows. The user
// must remain on these even when no module slug matches.
const NON_MODULE_BACKOFFICE_SEGMENTS = new Set<string>([
  '',
  'login',
  'profile',
  'settings',
]);

/**
 * Realtime backoffice module sync.
 *
 * - On mount (and when the user becomes a backoffice user), fetches the
 *   current `modules` rows where `level='backoffice' AND active=true`.
 * - Subscribes to changes on the `modules` table (requires the table to be
 *   in the `supabase_realtime` publication — see the
 *   `enable_realtime_modules_table` migration).
 * - When a row that involves backoffice modules changes, refetches the
 *   active list and updates Redux + the persisted `auth_state` so the
 *   sidebar redraws and a refresh stays in sync.
 * - If the user is currently on a backoffice route whose corresponding
 *   module just became inactive (or was deleted), they are redirected to
 *   the new first-available module via `getBackofficeDefaultPath`.
 *
 * Mount this hook once globally for the whole app (e.g. inside
 * `ModuleSyncProvider`). It no-ops for non-backoffice users.
 */
export const useRefreshBackofficeModules = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useEmployeeStore();
  const currentUser = getCurrentUser(state);
  const isBackofficeUser = getIsBackofficeUser(state);

  // Always-current view of the location pathname so the realtime callback
  // does not capture a stale value.
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  const fetchAndSync = useCallback(async () => {
    if (!currentUser || !isBackofficeUser) return;

    try {
      const { data: modulesData, error } = await supabase
        .from('modules')
        .select('*')
        .eq('level', 'backoffice')
        .eq('active', true)
        .order('order', { ascending: true, nullsFirst: false });
      console.log(modulesData,'modulesData of modules');
      
      if (error) {
        console.warn('useRefreshBackofficeModules: fetch error', error);
        return;
      }
      if (!modulesData) return;

      const backofficeModules = modulesData.map((module: any) => ({
        id: module.id,
        name: module.name,
        key: module.name.toLowerCase().replace(/\s+/g, '_'),
        icon: module.icon || 'LayoutDashboard',
        level: module.level,
        enabled: module.active,
        accessLevel: {},
        url: module.url,
        order: module.order,
        active: module.active,
        created_at: module.created_at,
        updated_at: module.updated_at,
      }));
      console.log(backofficeModules,'backofficeModules modules');
      
      dispatch(setConfiguredModules(backofficeModules));

      const persisted = loadAuthState();
      if (persisted) {
        saveAuthState({
          ...persisted,
          configuredModules: backofficeModules,
        });
      }

      // If the user is on a route whose backing module is no longer active,
      // redirect them to the first available module.
      const currentPath = pathnameRef.current;
      console.log(currentPath,'currentPath');
      
      if (
        currentPath.startsWith('/backoffice/') &&
        currentPath !== '/backoffice/login'
      ) {
        const segments = currentPath.split('/').filter(Boolean); // ['backoffice', '<slug>', ...]
        const currentSlug = segments[1] ?? '';
        console.log(currentSlug,'currentSlug');
        console.log(!NON_MODULE_BACKOFFICE_SEGMENTS.has(currentSlug),'!NON_MODULE_BACKOFFICE_SEGMENTS.has(currentSlug)');
        
        if (!NON_MODULE_BACKOFFICE_SEGMENTS.has(currentSlug)) {
          const stillActive = backofficeModules.some(
            (m) => slugify(m.name) === currentSlug
          );
          console.log(!stillActive);
          
          if (!stillActive) {
            const fallback = getBackofficeDefaultPath(backofficeModules);
            console.log(fallback,'fallbackfallback');
            
            if (fallback !== currentPath) {
              toast.info(
                'This module was just deactivated. Redirecting to your first available module…'
              );
              navigate(fallback, { replace: true });
            }
          }
        }
      }
    } catch (err) {
      console.warn('useRefreshBackofficeModules: unexpected error', err);
    }
  }, [currentUser, isBackofficeUser, dispatch, navigate]);

  // Initial fetch and refetch when user becomes a backoffice user.
  useEffect(() => {
    if (!currentUser || !isBackofficeUser) return;
    fetchAndSync();
  }, [currentUser, isBackofficeUser, fetchAndSync]);

  // Realtime subscription on the modules table — fires for every INSERT /
  // UPDATE / DELETE. Filters to events that involve a backoffice-level row
  // (level may differ between OLD and NEW on UPDATE).
  useEffect(() => {
    if (!currentUser || !isBackofficeUser) return;

    const channel = supabase
      .channel('backoffice-modules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modules',
        },
        (payload) => {
          const newRow = (payload.new as any) || {};
          const oldRow = (payload.old as any) || {};
          const involvesBackoffice =
            newRow.level === 'backoffice' || oldRow.level === 'backoffice';
          if (!involvesBackoffice) return;

          console.log('Backoffice modules realtime change:', {
            event: payload.eventType,
            new: newRow,
            old: oldRow,
          });
          fetchAndSync();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, isBackofficeUser, fetchAndSync]);
};
