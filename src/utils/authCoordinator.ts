/**
 * Central coordination utility for authentication state management
 * Prevents race conditions and infinite redirect loops
 */

// Global flags to prevent concurrent operations
let isValidating = false;
let isLoggingOut = false;
let redirectCounter = 0;
const MAX_REDIRECTS = 3;

// Reset counters every 30 seconds to prevent permanent lockouts
setInterval(() => {
  redirectCounter = 0;
}, 30000);

export const authCoordinator = {
  // Session validation coordination
  isValidationInProgress: () => isValidating,
  startValidation: () => {
    if (isValidating) {
      console.log('🔒 AuthCoordinator: Validation already in progress, skipping');
      return false;
    }
    isValidating = true;
    console.log('🚀 AuthCoordinator: Starting validation');
    return true;
  },
  endValidation: () => {
    isValidating = false;
    console.log('✅ AuthCoordinator: Validation completed');
  },

  // Enhanced logout coordination with cross-tab support
  isLogoutInProgress: () => {
    const sessionFlag = sessionStorage.getItem('is_logout_initiated') === 'true';
    const localFlag = localStorage.getItem('is_logout_initiated') === 'true';
    return isLoggingOut || sessionFlag || localFlag;
  },
  startLogout: () => {
    if (isLoggingOut) {
      console.log('🔒 AuthCoordinator: Logout already in progress, skipping');
      return false;
    }
    isLoggingOut = true;
    // Set logout flag in both storages for cross-tab coordination
    sessionStorage.setItem('is_logout_initiated', 'true');
    localStorage.setItem('is_logout_initiated', 'true');
    console.log('🚪 AuthCoordinator: Starting logout with cross-tab support');
    return true;
  },
  endLogout: () => {
    isLoggingOut = false;
    // Clear logout flags from both storages
    sessionStorage.removeItem('is_logout_initiated');
    localStorage.removeItem('is_logout_initiated');
    console.log('✅ AuthCoordinator: Logout completed with cross-tab cleanup');
  },

  // Navigation protection
  canNavigate: (targetPath: string) => {
    if (redirectCounter >= MAX_REDIRECTS) {
      console.log('🛑 AuthCoordinator: Max redirects reached, blocking navigation to:', targetPath);
      return false;
    }
    redirectCounter++;
    console.log(`📍 AuthCoordinator: Navigation allowed to ${targetPath} (attempt ${redirectCounter}/${MAX_REDIRECTS})`);
    return true;
  },
  resetRedirectCounter: () => {
    redirectCounter = 0;
    console.log('🔄 AuthCoordinator: Redirect counter reset');
  },

  // Enhanced state check with cross-storage monitoring
  shouldBlockOperation: (operation: string) => {
    const sessionLogout = sessionStorage.getItem('is_logout_initiated') === 'true';
    const localLogout = localStorage.getItem('is_logout_initiated') === 'true';
    const blocked = isValidating || isLoggingOut || sessionLogout || localLogout;
    if (blocked) {
      console.log(`🚫 AuthCoordinator: Blocking ${operation} - validation: ${isValidating}, logout: ${isLoggingOut}, sessionLogout: ${sessionLogout}, localLogout: ${localLogout}`);
    }
    return blocked;
  },

  // Enhanced emergency reset for stuck states
  emergencyReset: () => {
    console.log('🚨 AuthCoordinator: Emergency reset triggered');
    isValidating = false;
    isLoggingOut = false;
    redirectCounter = 0;
    // Clear logout flags from both storages
    sessionStorage.removeItem('is_logout_initiated');
    localStorage.removeItem('is_logout_initiated');
    console.log('✅ AuthCoordinator: Emergency reset completed with full storage cleanup');
  }
};