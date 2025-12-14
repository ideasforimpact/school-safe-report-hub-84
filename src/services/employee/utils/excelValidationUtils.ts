
import { RawEmployeeData } from '../types/importTypes';
import { checkBulkEmployeeIdDuplicates } from '../employeeValidationService';

/**
 * Required fields that must be present in the Excel file
 */
const requiredFields: (keyof RawEmployeeData)[] = [
  'employeeId',
  'firstName',
  'lastName',
  'email',
  'employeeType',
  'department',
  'joiningDate',
  'status'
];
export const NAME_MAX_LENGTH = 25;
export const PHONE_LENGTH = 10;

// Name validation
export const isValidName = (name: string): boolean => {
  if (!name) return false;
  return String(name).trim().length <= NAME_MAX_LENGTH;
};

// Phone: 10 digits, no letters, no spaces, no special chars
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  const trimmed = String(phone).trim();
  return /^\d{10}$/.test(trimmed);
};

// Joining date must be a valid date
export const isValidDate = (value: any): boolean => {
  if (!value) return false;

  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const d = new Date(trimmed);
    return !isNaN(d.getTime());
  }

  return false;
};
/**
 * Validates the data extracted from Excel
 * @param data The raw data extracted from Excel
 * @param clientId The client ID to check for duplicate employee IDs (optional)
 * @returns Array of validation errors (empty if valid)
 */
export const validateExcelData = async (data: any[], clientId?: string): Promise<string[]> => {
  const errors: string[] = [];
  
  if (!Array.isArray(data) || data.length === 0) {
    errors.push("No data found in the Excel file");
    return errors;
  }
  
  // Check for required headers/columns
  const requiredColumns = [
    'employeeId', 
    'firstName', 
    'lastName', 
    'email', 
    'employeeType',
    'department',
    'joiningDate',
    'status'
  ];
  const allowedModuleNames = [
    'Incidents',
    'Dashboard',
    'Assessments',
    'Employee Verification',
    'Transport Safety',
    'EduSafe Resources',
    'Grievances',
    'Users',
    'Settings',
    'Compliance Documents'
  ];

  // Helper for case-insensitive check
  const isAllowedModuleName = (name: string): boolean => {
    if (!name) return false;
    const n = String(name).trim().toLowerCase();
    return allowedModuleNames.some(am => am.toLowerCase() === n);
  };
  const firstRow = data[0];
  const missingColumns = requiredColumns.filter(
    column => !Object.keys(firstRow).includes(column)
  );
  
  if (missingColumns.length > 0) {
    missingColumns.forEach(column => {
      errors.push(`Missing required column: ${column}`);
    });
  }
  
  // Check for duplicate employee IDs within the file
  const employeeIds = data.map(row => row.employeeId).filter(id => id);
  const duplicateIds = employeeIds.filter((id, index) => employeeIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    const uniqueDuplicates = [...new Set(duplicateIds)];
    uniqueDuplicates.forEach(id => {
      errors.push(`Duplicate employee ID found in file: ${id}`);
    });
  }

  // Check for existing employee IDs in the database if clientId is provided
  if (clientId && employeeIds.length > 0) {
    try {
      const { duplicates, errors: dbErrors } = await checkBulkEmployeeIdDuplicates(employeeIds, clientId);
      
      // Add database errors
      if (dbErrors.length > 0) {
        errors.push(...dbErrors);
      }
      
      // Add duplicate employee ID errors
      if (duplicates.length > 0) {
        duplicates.forEach(id => {
          errors.push(`Employee ID '${id}' already exists for this client`);
        });
      }
    } catch (error) {
      console.error('Error checking bulk employee ID duplicates:', error);
      errors.push('Error validating employee IDs against existing records');
    }
  }

  // Validate each row
  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because Excel is 1-based and we're skipping header row
    
    // Check for required fields in each row
    requiredColumns.forEach(column => {
      const value = row[column];
      if (value === undefined || value === null || 
          (typeof value === 'string' && value.trim() === '') ||
          value === 0) {
        errors.push(`Row ${rowNum}: Missing required value for ${column}`);
      }
    });
    
    // Validate email format if present
    if (row.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(row.email))) {
        errors.push(`Row ${rowNum}: Invalid email format - ${row.email}`);
      }
    }

    if (row.firstName && !isValidName(row.firstName)) {
      errors.push(`Row ${rowNum}: First Name should be less than ${NAME_MAX_LENGTH} characters`);
    }

    if (row.lastName && !isValidName(row.lastName)) {
      errors.push(`Row ${rowNum}: Last Name should be less than ${NAME_MAX_LENGTH} characters`);
    } 
    if (row.phone && !isValidPhone(row.phone)) {
      errors.push(
        `Row ${rowNum}: Phone must be exactly ${PHONE_LENGTH} digits with no letters or special characters`
      );
    }

    if (row.joiningDate && !isValidDate(row.joiningDate)) {
      errors.push(
        `Row ${rowNum}: Joining Date must be a valid date (e.g., YYYY-MM-DD)`
      );
    }

    const moduleCandidates: string[] = [];

    // If parser provided moduleAccessPayload as array of strings/objects
    if (Array.isArray(row.moduleAccessPayload)) {
      // If array-of-strings
      if (row.moduleAccessPayload.length > 0 && typeof row.moduleAccessPayload[0] === 'string') {
        row.moduleAccessPayload.forEach((m: string) => moduleCandidates.push(String(m)));
      } else {
        // array-of-objects: prefer .name or .module_id or .key
        row.moduleAccessPayload.forEach((m: any) => {
          if (m?.name) moduleCandidates.push(String(m.name));
          else if (m?.module_id) moduleCandidates.push(String(m.module_id));
          else if (m?.key) moduleCandidates.push(String(m.key));
        });
      }
    }

    // Alternative single-cell module column (comma separated)
    const moduleCell =
      row.Module ?? row.module ?? row['Module(s)'] ?? row['Assigned Module'] ?? row['assigned_module'] ?? '';
    if (moduleCell && typeof moduleCell === 'string' && moduleCell.trim()) {
      const parts = moduleCell.split(/[,;|\/]/).map((p: string) => p.trim()).filter(Boolean);
      moduleCandidates.push(...parts);
    }

    // Deduplicate and validate
    const uniqueModules = [...new Set(moduleCandidates.map(m => String(m).trim()).filter(Boolean))];

    if (uniqueModules.length > 0) {
      const invalidModules = uniqueModules.filter(m => !isAllowedModuleName(m));
      if (invalidModules.length > 0) {
        errors.push(`Row ${rowNum}: Invalid module(s) specified: ${invalidModules.join(', ')}. Allowed modules: ${allowedModuleNames.join(', ')}`);
      }
    }

  });
  
  return errors;
};

/**
 * Format field name for display in error messages
 */
const formatFieldName = (field: string): string => {
  const formatted = field
    // Insert spaces before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Capitalize first letter
    .replace(/^./, (str) => str.toUpperCase());
  
  return formatted.trim();
};

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
