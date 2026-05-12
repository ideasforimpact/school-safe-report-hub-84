// Authentication state persistence utilities
//
// Two namespaced localStorage buckets — one per parallel auth flow — so the
// SSO and backoffice sessions can coexist on the same origin without
// overwriting each other. This mirrors the storageKey scheme used by the
// two Supabase clients in src/integrations/supabase/client.ts.
//
//   /backoffice/*  routes  →  bucket: 'auth_state_backoffice'
//   everything else        →  bucket: 'auth_state_sso'

const SSO_AUTH_STORAGE_KEY = 'auth_state_sso';
const BACKOFFICE_AUTH_STORAGE_KEY = 'auth_state_backoffice';

// Pre-fix single-bucket key — read on first load, then migrated and removed.
const LEGACY_AUTH_STORAGE_KEY = 'auth_state';

export interface PersistedAuthState {
  currentUser: any | null;
  isAuthenticated: boolean;
  isBackofficeUser: boolean;
  authError: string | null;
  configuredModules: any[] | null;
  employeeData: any | null;
  activeClientId?: string | null;
  homeClientId?: string | null;
  isSwitchedContext?: boolean;
  clientManagementReadOnly?: boolean;
  switchedAccessLevel?: 'R' | 'W/R';
  /**
   * @deprecated Custom 24h backoffice JWT — replaced by Supabase's standard
   * access_token + refresh_token (issued by signInWithPassword and stored in
   * the BACKOFFICE_STORAGE_KEY localStorage bucket by the SDK). Kept on the
   * type only so that auth_state rows persisted by older builds still load
   * cleanly during the legacy fallback in validateBackofficeSession.
   */
  jwtToken?: string;
  /**
   * @deprecated Companion to `jwtToken`. See deprecation note above.
   */
  expiresAt?: number;
  sessionType?: 'backoffice' | 'sso';
}

const isBackofficePath = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/backoffice');
};

// Bucket selection for reads is path-driven, since the URL is the most
// reliable signal of which session the current tab is using.
const getKeyForActivePath = (): string =>
  isBackofficePath() ? BACKOFFICE_AUTH_STORAGE_KEY : SSO_AUTH_STORAGE_KEY;

// Bucket selection for writes is session-type-driven so a save initiated
// from a non-backoffice path (e.g. AuthProvider listener at /callback) still
// lands in the correct bucket.
const getKeyForState = (state: PersistedAuthState): string => {
  if (state.sessionType === 'backoffice' || state.isBackofficeUser) {
    return BACKOFFICE_AUTH_STORAGE_KEY;
  }
  if (state.sessionType === 'sso') {
    return SSO_AUTH_STORAGE_KEY;
  }
  // No marker — fall back to active path.
  return getKeyForActivePath();
};

export const saveAuthState = (state: PersistedAuthState): void => {
  try {
    const key = getKeyForState(state);
    const serializedState = JSON.stringify(state);
    localStorage.setItem(key, serializedState);
    console.log('[AUTH-DIAG] saveAuthState: written to localStorage', {
      bucket: key,
      hasCurrentUser: !!state.currentUser,
      currentUserEmail: state.currentUser?.email ?? null,
      isAuthenticated: state.isAuthenticated,
      isBackofficeUser: state.isBackofficeUser,
      sessionType: state.sessionType ?? (state.isBackofficeUser ? '(implied) backoffice' : '(unset)'),
      hasJwtToken: !!state.jwtToken,
      expiresAt: state.expiresAt ? new Date(state.expiresAt).toISOString() : null,
      configuredModulesCount: state.configuredModules?.length ?? 0,
      caller: new Error().stack?.split('\n').slice(2, 4).join(' <- '),
    });
  } catch (error) {
    console.error("❌ saveAuthState: Error saving auth state:", error);
  }
};

export const loadAuthState = (): PersistedAuthState | null => {
  try {
    const key = getKeyForActivePath();
    let serializedState = localStorage.getItem(key);
    let storageType: 'localStorage[active]' | 'legacy(localStorage)' | 'legacy(sessionStorage)' =
      'localStorage[active]';

    // One-shot migration of any pre-fix entry stored under the old single
    // 'auth_state' key. Decide which namespaced bucket it belongs to based on
    // its sessionType / isBackofficeUser, write it there, and remove the
    // legacy entry so this branch is taken at most once per browser.
    if (serializedState === null) {
      const legacyFromSession = sessionStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
      const legacyFromLocal = localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
      const legacyRaw = legacyFromSession ?? legacyFromLocal;
      if (legacyRaw !== null) {
        try {
          const legacyParsed = JSON.parse(legacyRaw) as PersistedAuthState;
          const targetKey =
            legacyParsed.sessionType === 'backoffice' || legacyParsed.isBackofficeUser
              ? BACKOFFICE_AUTH_STORAGE_KEY
              : SSO_AUTH_STORAGE_KEY;
          localStorage.setItem(targetKey, legacyRaw);
          if (legacyFromSession !== null) sessionStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
          if (legacyFromLocal !== null) localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
          if (targetKey === key) {
            serializedState = legacyRaw;
            storageType = legacyFromSession !== null
              ? 'legacy(sessionStorage)'
              : 'legacy(localStorage)';
          }
        } catch {
          // Corrupt legacy entry — drop it so it stops poisoning loads.
          sessionStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
          localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
        }
      }
    }

    if (serializedState === null) {
      console.log('[AUTH-DIAG] loadAuthState: No auth state found', { activeBucket: key });
      return null;
    }

    const parsedState = JSON.parse(serializedState) as PersistedAuthState;
    console.log('[AUTH-DIAG] loadAuthState: Auth state found', {
      bucket: key,
      isBackofficeUser: parsedState.isBackofficeUser,
      hasJwtToken: !!parsedState.jwtToken,
      expiresAt: parsedState.expiresAt ? new Date(parsedState.expiresAt).toISOString() : null,
      sessionType: parsedState.sessionType || (parsedState.isBackofficeUser ? 'backoffice' : 'sso'),
      storageType,
    });

    // Backoffice JWT expiration check.
    const sessionType =
      parsedState.sessionType || (parsedState.isBackofficeUser ? 'backoffice' : 'sso');
    if (sessionType === 'backoffice' && parsedState.jwtToken && parsedState.expiresAt) {
      if (Date.now() > parsedState.expiresAt) {
        console.log('[AUTH-DIAG] loadAuthState: JWT expired for backoffice user, clearing bucket', {
          bucket: key,
          expiresAt: new Date(parsedState.expiresAt).toISOString(),
        });
        clearPersistedAuthState();
        return null;
      }
    }

    return parsedState;
  } catch (error) {
    console.error('[AUTH-DIAG] loadAuthState: Error loading auth state', error);
    return null;
  }
};

// Clears the bucket for the CURRENT session (active path). Leaves the other
// bucket alone so logging out of one flow doesn't sign you out of the other.
// Also wipes any lingering legacy entry.
export const clearPersistedAuthState = (): void => {
  try {
    const key = getKeyForActivePath();
    localStorage.removeItem(key);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    console.log('[AUTH-DIAG] clearPersistedAuthState: cleared bucket', { bucket: key });
  } catch (error) {
    console.error('clearPersistedAuthState: Error', error);
  }
};
