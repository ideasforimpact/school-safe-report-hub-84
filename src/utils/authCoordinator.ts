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

  // Logout coordination
  isLogoutInProgress: () => {
    const sessionFlag = sessionStorage.getItem('is_logout_initiated') === 'true';
    return isLoggingOut || sessionFlag;
  },
  startLogout: () => {
    if (isLoggingOut) {
      console.log('🔒 AuthCoordinator: Logout already in progress, skipping');
      return false;
    }
    isLoggingOut = true;
    sessionStorage.setItem('is_logout_initiated', 'true');
    console.log('🚪 AuthCoordinator: Starting logout');
    return true;
  },
  endLogout: () => {
    isLoggingOut = false;
    sessionStorage.removeItem('is_logout_initiated');
    console.log('✅ AuthCoordinator: Logout completed');
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

  // Comprehensive state check
  shouldBlockOperation: (operation: string) => {
    const blocked = isValidating || isLoggingOut || sessionStorage.getItem('is_logout_initiated') === 'true';
    if (blocked) {
      console.log(`🚫 AuthCoordinator: Blocking ${operation} - validation: ${isValidating}, logout: ${isLoggingOut}`);
    }
    return blocked;
  },

  // Emergency reset for stuck states
  emergencyReset: () => {
    console.log('🚨 AuthCoordinator: Emergency reset triggered');
    isValidating = false;
    isLoggingOut = false;
    redirectCounter = 0;
    sessionStorage.removeItem('is_logout_initiated');
    console.log('✅ AuthCoordinator: Emergency reset completed');
  }
};