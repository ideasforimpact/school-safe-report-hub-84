/**
 * Employee-related constants
 * Centralized configuration for employee validation rules
 */

/**
 * Employee ID validation constants
 */
export const EMPLOYEE_ID_CONSTANTS = {
  /** Minimum length for employee ID */
  MIN_LENGTH: 3,
  
  /** Maximum length for employee ID */
  MAX_LENGTH: 25,
  
  /** Validation regex pattern - allows alphanumeric and special characters */
  PATTERN: /^.{3,25}$/,
} as const;

/**
 * Get error message for invalid employee ID
 * @returns Error message string
 */
export const getEmployeeIdErrorMessage = (): string => {
  return `Employee ID must be between ${EMPLOYEE_ID_CONSTANTS.MIN_LENGTH} and ${EMPLOYEE_ID_CONSTANTS.MAX_LENGTH} characters`;
};

/**
 * Employee ID validation function
 * @param employeeId - The employee ID to validate
 * @returns true if valid, false otherwise
 */
export const isValidEmployeeId = (employeeId: string): boolean => {
  if (!employeeId) return false;
  return EMPLOYEE_ID_CONSTANTS.PATTERN.test(employeeId);
};

