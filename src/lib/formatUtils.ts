/**
 * Formats department names to ensure consistent capitalization
 * @param department The department string to format
 * @returns Formatted department string with proper capitalization
 */
export function formatDepartment(department: string): string {
  if (!department) return '';
  
  // Capitalize first letter and make rest lowercase
  return department.charAt(0).toUpperCase() + department.slice(1).toLowerCase();
}

/**
 * Capitalizes the first letter of each word in a string, lowercasing the rest.
 * Used to normalize free-text values (names, labels) regardless of the casing
 * they were entered/stored in.
 * @param value The string to format
 * @returns The string with each word capitalized
 */
export function capitalizeWords(value?: string | null): string {
  if (!value) return '';

  return value
    .split(' ')
    .map(word =>
      word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word
    )
    .join(' ');
}