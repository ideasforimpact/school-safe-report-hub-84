/**
 * Visitor-related constants
 * Centralized configuration for visitor management
 */

/**
 * Visitor list pagination constants
 */
export const VISITOR_LIST_CONSTANTS = {
  /** Maximum number of visitors to display in the list */
  MAX_DISPLAY_COUNT: 20,
  /** Maximum character count for visitor name display (truncated with ...) */
  MAX_NAME_DISPLAY_LENGTH: 20,
} as const;

/**
 * Get the maximum display count for visitor list
 * @returns Maximum number of visitors to display
 */
export const getVisitorMaxDisplayCount = (): number => {
  return VISITOR_LIST_CONSTANTS.MAX_DISPLAY_COUNT;
};

/**
 * Truncate visitor name to maximum display length
 * @param name - The visitor name to truncate
 * @returns Truncated name with "..." if longer than max length
 */
export const truncateVisitorName = (name: string): string => {
  if (!name) return '';
  if (name.length <= VISITOR_LIST_CONSTANTS.MAX_NAME_DISPLAY_LENGTH) {
    return name;
  }
  return name.substring(0, VISITOR_LIST_CONSTANTS.MAX_NAME_DISPLAY_LENGTH) + '...';
};

