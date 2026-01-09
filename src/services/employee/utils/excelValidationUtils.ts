
import { RawEmployeeData } from '../types/importTypes';
import { checkBulkEmployeeIdDuplicates,checkBulkEmployeeEmailDuplicates } from '../employeeValidationService';
import { EMPLOYEE_DESIGNATION_CONSTANTS, EMPLOYEE_ID_CONSTANTS, EMPLOYEE_LAST_NAME_CONSTANTS, EMPLOYEE_NAME_CONSTANTS } from '@/constant/employeeConstant';

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
  'designation', 
  'joiningDate',
  'status'
];
export const NAME_MAX_LENGTH = 25;
export const PHONE_LENGTH = 10;

// Name validation
export const isValidFirstName = (name: string): boolean => {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;

  return (
    trimmed.length >= EMPLOYEE_NAME_CONSTANTS.MIN_LENGTH &&
    trimmed.length <= EMPLOYEE_NAME_CONSTANTS.MAX_LENGTH &&
    EMPLOYEE_NAME_CONSTANTS.PATTERN.test(trimmed)
  );
};
export const isValidLastName = (name: string): boolean => {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;

  return (
    trimmed.length >= EMPLOYEE_LAST_NAME_CONSTANTS.MIN_LENGTH &&
    trimmed.length <= EMPLOYEE_LAST_NAME_CONSTANTS.MAX_LENGTH &&
    EMPLOYEE_LAST_NAME_CONSTANTS.PATTERN.test(trimmed)
  );
};

export const isValidDesignation = (designation: string): boolean => {
  if (!designation) return false;

  const trimmed = designation.trim();
  if (!trimmed) return false;

  return (
    trimmed.length >= EMPLOYEE_DESIGNATION_CONSTANTS.MIN_LENGTH &&
    trimmed.length <= EMPLOYEE_DESIGNATION_CONSTANTS.MAX_LENGTH &&
    EMPLOYEE_DESIGNATION_CONSTANTS.PATTERN.test(trimmed)
  );
};

export const nameNotContainingNumbers = (name: string): boolean => {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  return !/\d/.test(trimmed);
};

// Phone: 10 digits, no letters, no spaces, no special chars
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  const trimmed = String(phone).trim();
  return /^[6-9]\d{9}$/.test(trimmed);
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
// Joining date must be a valid *future* date (strictly after today)
// export const isFutureDate = (value: any): boolean => {
//   if (!isValidDate(value)) return false;

//   let date: Date;

//   if (value instanceof Date) {
//     date = value;
//   } else if (typeof value === 'string') {
//     date = new Date(value.trim());
//   } else {
//     return false;
//   }

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   date.setHours(0, 0, 0, 0);

//   return date >= today;
// };

/**
 * Validates the data extracted from Excel
 * @param data The raw data extracted from Excel
 * @param clientId The client ID to check for duplicate employee IDs (optional)
 * @returns Array of validation errors (empty if valid)
 */
export const isValidEmployeeId = (employeeId: string): boolean => {
  if (!employeeId) return false;
  const trimmed = employeeId.trim();
  if (!trimmed) return false;

  const min = EMPLOYEE_ID_CONSTANTS.MIN_LENGTH; 
  const max = EMPLOYEE_ID_CONSTANTS.MAX_LENGTH; 
  const employeeIdRegex = new RegExp(`^[A-Za-z0-9]{${min},${max}}$`);

  return employeeIdRegex.test(trimmed);
};

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
  const ALLOWED_EMPLOYEE_TYPES = [
    'permanent',
    'contract',
    'consultant',
    'part time',
  ];
  const ALLOWED_DEPARTMENT = [
    'admin',
    'teaching',
    'security',
    'maintenance',
    'transport',
    'management',
  ];
const ALLOWED_STATUS = ['active'];

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
  const isValidEmployeeType = (employeeType: string): boolean => {
  if (!employeeType) return false;
    return ALLOWED_EMPLOYEE_TYPES.includes(employeeType.trim().toLowerCase());
  };
   const isValidDepartment = (department: string): boolean => {
  if (!department) return false;
    return ALLOWED_DEPARTMENT.includes(department.trim().toLowerCase());
  };
  const isValidStatus = (status: string): boolean => {
    if (!status) return false;
    return ALLOWED_STATUS.includes(status.trim().toLowerCase());
  };
  // Check for duplicate employee IDs within the file
  const employeeIds: string[] = [];
  const emailsRaw: string[] = [];
   data.forEach(row => {
    if (row.employeeId !== undefined && row.employeeId !== null && String(row.employeeId).trim() !== '') {
      employeeIds.push(String(row.employeeId).trim());
    }
    if (row.email !== undefined && row.email !== null && String(row.email).trim() !== '') {
      emailsRaw.push(String(row.email).trim().toLowerCase()); 
    }
  });
  const duplicateIds = employeeIds.filter((id, index) => employeeIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    const uniqueDuplicates = [...new Set(duplicateIds)];
    uniqueDuplicates.forEach(id => {
      errors.push(`Duplicate employee ID found in file: ${id}`);
    });
  }
   const duplicateEmails = emailsRaw.filter((email, index) => emailsRaw.indexOf(email) !== index);
  if (duplicateEmails.length > 0) {
    const uniqueEmailDups = [...new Set(duplicateEmails)];
    uniqueEmailDups.forEach(email => {
      errors.push(`Duplicate email found in file: ${email}`);
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

  if (clientId && emailsRaw.length > 0) {
    try {
      // remove empties and dedupe before calling DB
      const uniqueEmails = [...new Set(emailsRaw.filter(e => e && e.trim()))];
      if (uniqueEmails.length > 0) {
        const { duplicates: emailDuplicates, errors: emailDbErrors } = await checkBulkEmployeeEmailDuplicates(uniqueEmails, clientId);
        if (emailDbErrors && emailDbErrors.length > 0) {
          errors.push(...emailDbErrors);
        }
        if (emailDuplicates && emailDuplicates.length > 0) {
          emailDuplicates.forEach(email => {
            errors.push(`Email '${email}' already exists for this client`);
          });
        }
      }
    } catch (err) {
      errors.push('Error validating emails against existing records');
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
    if (row.firstName && !nameNotContainingNumbers(row.firstName)) {
      errors.push(`Row ${rowNum}: First Name should only contain characters`);
    }
   if (row.firstName) {
      const firstName = String(row.firstName).trim();

      if (!firstName) {
        errors.push(`Row ${rowNum}: First Name cannot be empty`);
      }
      else if (firstName.length < EMPLOYEE_NAME_CONSTANTS.MIN_LENGTH) {
        errors.push(
          `Row ${rowNum}: First Name must be at least ${EMPLOYEE_NAME_CONSTANTS.MIN_LENGTH} characters`
        );
      }
      else if (firstName.length > EMPLOYEE_NAME_CONSTANTS.MAX_LENGTH) {
        errors.push(
          `Row ${rowNum}: First Name cannot exceed ${EMPLOYEE_NAME_CONSTANTS.MAX_LENGTH} characters`
        );
      }
      else if (!EMPLOYEE_NAME_CONSTANTS.PATTERN.test(firstName)) {
        errors.push(
          `Row ${rowNum}: First Name can only contain letters and spaces`
        );
      }
    }

    if (row.lastName && !nameNotContainingNumbers(row.lastName)) {
      errors.push(`Row ${rowNum}: Last Name should should only contain characters`);
    } 
    if (row.lastName) {
      const lastName = String(row.lastName).trim();

      if (!lastName) {
        errors.push(`Row ${rowNum}: Last Name cannot be empty`);
      }
      else if (lastName.length < EMPLOYEE_LAST_NAME_CONSTANTS.MIN_LENGTH) {
        errors.push(
          `Row ${rowNum}: Last Name must be at least ${EMPLOYEE_LAST_NAME_CONSTANTS.MIN_LENGTH} character`
        );
      }
      else if (lastName.length > EMPLOYEE_LAST_NAME_CONSTANTS.MAX_LENGTH) {
        errors.push(
          `Row ${rowNum}: Last Name cannot exceed ${EMPLOYEE_LAST_NAME_CONSTANTS.MAX_LENGTH} characters`
        );
      }
      else if (!EMPLOYEE_LAST_NAME_CONSTANTS.PATTERN.test(lastName)) {
        errors.push(
          `Row ${rowNum}: Last Name can only contain letters and spaces`
        );
      }
    }

    if (row.phone) {
      const phone = String(row.phone).trim();

      if (!/^\d+$/.test(phone)) {
        errors.push(`Row ${rowNum}: Phone number must contain only digits`);
      } else if (phone.length !== PHONE_LENGTH) {
        errors.push(`Row ${rowNum}: Phone number must be exactly ${PHONE_LENGTH} digits`);
      } else if (!/^[6-9]/.test(phone)) {
        errors.push(`Row ${rowNum}: Phone number must be valid`);
      }
    }
    if (row.designation) {
      const designation = String(row.designation).trim();

      if (!designation) {
        errors.push(`Row ${rowNum}: Designation cannot be empty`);
      } 
      else if (designation.length < EMPLOYEE_DESIGNATION_CONSTANTS.MIN_LENGTH) {
        errors.push(
          `Row ${rowNum}: Designation must be at least ${EMPLOYEE_DESIGNATION_CONSTANTS.MIN_LENGTH} characters`
        );
      } 
      else if (designation.length > EMPLOYEE_DESIGNATION_CONSTANTS.MAX_LENGTH) {
        errors.push(
          `Row ${rowNum}: Designation cannot exceed ${EMPLOYEE_DESIGNATION_CONSTANTS.MAX_LENGTH} characters`
        );
      } 
      else if (!EMPLOYEE_DESIGNATION_CONSTANTS.PATTERN.test(designation)) {
        errors.push(
          `Row ${rowNum}: Designation can only contain letters and spaces (no numbers or special characters)`
        );
      }
    }

    if (row.joiningDate) {
      if (!isValidDate(row.joiningDate)) {
        errors.push(
          `Row ${rowNum}: Joining Date must be a valid date (e.g., YYYY-MM-DD)`
        );
      }
    }
    if (row.employeeId) {
      const id = String(row.employeeId).trim();

      if (id.length < EMPLOYEE_ID_CONSTANTS.MIN_LENGTH) {
        errors.push(
          `Row ${rowNum}: Employee ID must be at least ${EMPLOYEE_ID_CONSTANTS.MIN_LENGTH} characters`
        );
      } else if (id.length > EMPLOYEE_ID_CONSTANTS.MAX_LENGTH) {
        errors.push(
          `Row ${rowNum}: Employee ID must not exceed ${EMPLOYEE_ID_CONSTANTS.MAX_LENGTH} characters`
        );
      } else if (!isValidEmployeeId(id)) {
        errors.push(
          `Row ${rowNum}: Employee ID can contain only letters and numbers`
        );
      }
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

    if (row.employeeType) {
      const emptyp = String(row.employeeType).trim();
  
      if (!isValidEmployeeType(emptyp)) {
        errors.push(
          `Row ${rowNum}: Invalid employee type '${emptyp}'. Allowed values are: ${ALLOWED_EMPLOYEE_TYPES.join(', ')}`
        );
      }
    }
    if (row.department) {
      const dept = String(row.department).trim();
  
      if (!isValidDepartment(dept)) {
        errors.push(
          `Row ${rowNum}: Invalid department '${dept}'. Allowed values are: ${ALLOWED_DEPARTMENT.join(', ')}`
        );
      }
    }
    if (row.status) {
      const status = String(row.status).trim();

      if (!isValidStatus(status)) {
        errors.push(
          `Row ${rowNum}: Invalid status '${status}'. Allowed value is: active`
        );
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
