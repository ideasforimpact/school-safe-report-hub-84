// Validation state manager to prevent conflicts and infinite loops
class ValidationStateManager {
  private static instance: ValidationStateManager;
  private isValidating = false;
  private validationCount = 0;
  private lastValidation = 0;
  private maxValidations = 50;
  private minValidationInterval = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): ValidationStateManager {
    if (!ValidationStateManager.instance) {
      ValidationStateManager.instance = new ValidationStateManager();
    }
    return ValidationStateManager.instance;
  }

  canValidate(): boolean {
    const now = Date.now();
    const timeSinceLastValidation = now - this.lastValidation;
    
    // Check if we can validate based on:
    // 1. Not currently validating
    // 2. Haven't exceeded max validations
    // 3. Enough time has passed since last validation
    // 4. No logout in progress
    const logoutInProgress = sessionStorage.getItem('is_logout_initiated') === 'true';
    
    return !this.isValidating && 
           this.validationCount < this.maxValidations && 
           timeSinceLastValidation >= this.minValidationInterval &&
           !logoutInProgress;
  }

  startValidation(): boolean {
    if (!this.canValidate()) {
      console.log('🚫 ValidationStateManager: Validation blocked', {
        isValidating: this.isValidating,
        validationCount: this.validationCount,
        timeSinceLastValidation: Date.now() - this.lastValidation,
        logoutInProgress: sessionStorage.getItem('is_logout_initiated') === 'true'
      });
      return false;
    }

    this.isValidating = true;
    this.validationCount += 1;
    this.lastValidation = Date.now();
    
    console.log('✅ ValidationStateManager: Starting validation', {
      count: this.validationCount,
      timestamp: new Date().toISOString()
    });
    
    return true;
  }

  endValidation(): void {
    this.isValidating = false;
    console.log('🏁 ValidationStateManager: Validation ended');
  }

  reset(): void {
    this.isValidating = false;
    this.validationCount = 0;
    this.lastValidation = 0;
    console.log('🔄 ValidationStateManager: State reset');
  }

  getStats() {
    return {
      isValidating: this.isValidating,
      validationCount: this.validationCount,
      lastValidation: this.lastValidation,
      timeSinceLastValidation: Date.now() - this.lastValidation
    };
  }
}

export const validationStateManager = ValidationStateManager.getInstance();