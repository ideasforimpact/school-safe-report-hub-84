// DigiLocker session cache storage — sessionStorage so it survives a page refresh
// within the same tab, not just a React context remount. Standalone (not defined
// inside EmployeeVerificationContext) so auth logout can clear it directly without
// depending on that context being mounted.
export interface DigiLockerSession {
  token: string;
  clientId: string;
  expiresAt: number;
}

const DIGILOCKER_SESSION_STORAGE_KEY = 'digilocker_session_cache';

export function readDigiLockerSessionCache(): DigiLockerSession | null {
  try {
    const raw = sessionStorage.getItem(DIGILOCKER_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.token === 'string' && typeof parsed?.clientId === 'string' && typeof parsed?.expiresAt === 'number') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeDigiLockerSessionCache(session: DigiLockerSession): void {
  try {
    sessionStorage.setItem(DIGILOCKER_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable (private browsing, quota, disabled) — fall back to no cache.
  }
}

export function clearDigiLockerSessionCache(): void {
  try {
    sessionStorage.removeItem(DIGILOCKER_SESSION_STORAGE_KEY);
  } catch {
    // Ignore — nothing to clean up if storage isn't accessible.
  }
}
