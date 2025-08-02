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
    if (isValidating) return false;
    isValidating = true;
    return true;
  },
  endValidation: () => {
    isValidating = false;
  },

  // Logout coordination with cross-tab support
  isLogoutInProgress: () => {
    const sessionFlag = sessionStorage.getItem('is_logout_initiated') === 'true';
    const localFlag = localStorage.getItem('is_logout_initiated') === 'true';
    return isLoggingOut || sessionFlag || localFlag;
  },
  startLogout: () => {
    if (isLoggingOut) return false;
    isLoggingOut = true;
    sessionStorage.setItem('is_logout_initiated', 'true');
    localStorage.setItem('is_logout_initiated', 'true');
    return true;
  },
  endLogout: () => {
    isLoggingOut = false;
    sessionStorage.removeItem('is_logout_initiated');
    localStorage.removeItem('is_logout_initiated');
  },

  // Navigation protection
  canNavigate: (targetPath: string) => {
    if (redirectCounter >= MAX_REDIRECTS) return false;
    redirectCounter++;
    return true;
  },
  resetRedirectCounter: () => {
    redirectCounter = 0;
  },

  // State check with cross-storage monitoring
  shouldBlockOperation: (operation: string) => {
    const sessionLogout = sessionStorage.getItem('is_logout_initiated') === 'true';
    const localLogout = localStorage.getItem('is_logout_initiated') === 'true';
    
    // Never block login operations
    const loginOperations = ['login', 'authentication', 'sso', 'signin', 'oauth'];
    if (loginOperations.some(op => operation.toLowerCase().includes(op))) {
      return false;
    }
    
    return isValidating || isLoggingOut || sessionLogout || localLogout;
  },

  // Emergency reset for stuck states
  emergencyReset: () => {
    isValidating = false;
    isLoggingOut = false;
    redirectCounter = 0;
    sessionStorage.removeItem('is_logout_initiated');
    localStorage.removeItem('is_logout_initiated');
  }
};