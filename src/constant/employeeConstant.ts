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

export const EMPLOYEE_NAME_CONSTANTS = {
  MIN_LENGTH: 3,

  MAX_LENGTH: 25,

  PATTERN: /^[a-zA-Z\s]{3,25}$/,
} as const;

export const getEmployeeFirstnameErrorMessage = (): string => {
  return `Employee ID must be between ${EMPLOYEE_NAME_CONSTANTS.MIN_LENGTH} and ${EMPLOYEE_NAME_CONSTANTS.MAX_LENGTH} characters`;
};

export const EMPLOYEE_LAST_NAME_CONSTANTS = {
  MIN_LENGTH: 1,

  MAX_LENGTH: 25,

  PATTERN: /^[a-zA-Z\s]{1,25}$/,
} as const;

export const getEmployeeLastnameErrorMessage = (): string => {
  return `Employee ID must be between ${EMPLOYEE_LAST_NAME_CONSTANTS.MIN_LENGTH} and ${EMPLOYEE_LAST_NAME_CONSTANTS.MAX_LENGTH} characters`;
};

export const EMPLOYEE_DESIGNATION_CONSTANTS = {
  MIN_LENGTH: 3,

  MAX_LENGTH: 25,

  PATTERN: /^[a-zA-Z\s]{3,25}$/,
} as const;
