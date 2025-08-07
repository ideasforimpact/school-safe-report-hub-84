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