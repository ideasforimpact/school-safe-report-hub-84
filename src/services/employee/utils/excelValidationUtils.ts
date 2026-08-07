
import { RawEmployeeData } from '../types/importTypes';
import { checkBulkDuplicates } from '../employeeValidationService';
import {
  EMPLOYEE_DESIGNATION_CONSTANTS,
  EMPLOYEE_ID_CONSTANTS,
  EMPLOYEE_LAST_NAME_CONSTANTS,
  EMPLOYEE_NAME_CONSTANTS,
  EMPLOYEE_PERSONAL_INFO_CONSTANTS,
  BIOMETRIC_USER_ID_CONSTANTS,
  EXPERIENCE_CONSTANTS,
  isValidReligion,
  getReligionErrorMessage,
  isValidNationality,
  getNationalityErrorMessage,
  ALLOWED_EMPLOYEE_TYPES,
  isValidEmployeeTypeValue,
} from '@/constant/employeeConstant';

/**
 * Required fields that must be present in the Excel file
 */
const requiredFields: (keyof RawEmployeeData)[] = [
  'employeeId',
  'firstName',
  'lastName',
  // email, employeeType, department are optional
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
export const isValidDate = (value: unknown): boolean => {
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

  return EMPLOYEE_ID_CONSTANTS.PATTERN.test(trimmed);
};

export const EMPLOYEE_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const EMPLOYEE_PHONE_REGEX = /^[6-9]\d{9}$/;
export const RESIDENCE_ADDRESS_MAX_LENGTH = 250;
export const ALLOWED_GENDER = ['male', 'female', 'other'] as const;

export type PersonalDetailsFields = {
  middleName?: string;
  fatherName?: string;
  staffId?: string;
  experience?: string;
  qualification?: string;
  gender?: string;
  dob?: string;
  religion?: string;
  nationality?: string;
  bloodGroup?: string;
  residenceAddress?: string;
};

export type ProfessionalOtherDetailsFields = {
  aadharNo?: string;
  panNo?: string;
  esiNo?: string;
  pfNo?: string;
  exitDate?: string;
  biometricUserId?: string;
};

const isValidLettersAndSpaces = (value: string): boolean => /^[a-zA-Z\s]+$/.test(value);

const validateOptionalNameLikeField = (value: string, label: string): string => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.length < EMPLOYEE_PERSONAL_INFO_CONSTANTS.MIN_LENGTH) {
    return `${label} must be at least ${EMPLOYEE_PERSONAL_INFO_CONSTANTS.MIN_LENGTH} characters`;
  }
  if (trimmed.length > EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH) {
    return `${label} cannot exceed ${EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH} characters`;
  }
  if (!isValidLettersAndSpaces(trimmed)) {
    return `${label} can only contain letters and spaces`;
  }
  return '';
};

const isParseableDate = (value: string): boolean => {
  const d = new Date(value);
  return !isNaN(d.getTime());
};

const isDateNotInFuture = (value: string): boolean => {
  if (!isParseableDate(value)) return false;

  const date = new Date(value);
  const today = new Date();

  // Compare only the date part
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return date.getTime() <= today.getTime();
};

// Stricter than isDateNotInFuture: rejects today too, only a date
// strictly before today counts as "past". Used for resigning/termination
// date, which must already have happened.
const isStrictlyPastDate = (value: string): boolean => {
  if (!isParseableDate(value)) return false;

  const date = new Date(value);
  const today = new Date();

  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return date.getTime() < today.getTime();
};

const isAtLeast18YearsOld = (value: string): boolean => {
  if (!isParseableDate(value)) return false;

  const dob = new Date(value);
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();

  const monthDiff = today.getMonth() - dob.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age >= 18;
};

export const EMPLOYEE_EMAIL_MAX_LENGTH = 50;

export const isValidEmployeeEmail = (email: string): boolean => {
  const trimmed = email.trim();

  return (
    trimmed.length <= EMPLOYEE_EMAIL_MAX_LENGTH &&
    EMPLOYEE_EMAIL_REGEX.test(trimmed)
  );
};

export const isValidEmployeePhone = (phone: string): boolean =>
  EMPLOYEE_PHONE_REGEX.test(phone.trim());

export const getResidenceAddressError = (address?: string): string => {
  const trimmed = (address || '').trim();
  if (!trimmed) return '';
  if (trimmed.length > RESIDENCE_ADDRESS_MAX_LENGTH) {
    return `Address cannot exceed ${RESIDENCE_ADDRESS_MAX_LENGTH} characters`;
  }
  return '';
};

export const getPersonalDetailsFieldErrors = (
  personalDetails: PersonalDetailsFields = {}
): Record<string, string> => {
  const experience = (personalDetails.experience || '').trim();
  const qualification = (personalDetails.qualification || '').trim();
  const bloodGroup = (personalDetails.bloodGroup || '').trim();
  const gender = (personalDetails.gender || '').trim().toLowerCase();
  const dob = (personalDetails.dob || '').trim();

  let experienceError = '';
  if (experience) {
    if (
      experience.length < EXPERIENCE_CONSTANTS.MIN_LENGTH ||
      experience.length > EXPERIENCE_CONSTANTS.MAX_LENGTH
    ) {
      experienceError = `Experience must be between ${EXPERIENCE_CONSTANTS.MIN_LENGTH} and ${EXPERIENCE_CONSTANTS.MAX_LENGTH} characters`;
    } else if (!/^\d+$/.test(experience)) {
      experienceError = 'Experience must contain numbers only';
    }
  }

  let qualificationError = '';
  if (qualification) {
    if (
      qualification.length < EMPLOYEE_PERSONAL_INFO_CONSTANTS.MIN_LENGTH ||
      qualification.length > EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH
    ) {
      qualificationError = `Qualification must be between ${EMPLOYEE_PERSONAL_INFO_CONSTANTS.MIN_LENGTH} and ${EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH} characters`;
    } else if (!/^[a-zA-Z\s.-]+$/.test(qualification)) {
      qualificationError = 'Qualification can only contain letters, spaces, dots, and hyphens';
    }
  }

  let dobError = '';

  if (dob) {
    if (!isParseableDate(dob)) {
      dobError = 'Please enter a valid date of birth';
    } else if (!isAtLeast18YearsOld(dob)) {
      dobError = 'Employee must be at least 18 years old';
    }
  }

  let genderError = '';
  if (gender && !ALLOWED_GENDER.includes(gender as (typeof ALLOWED_GENDER)[number])) {
    genderError = `Gender must be one of: ${ALLOWED_GENDER.join(', ')}`;
  }

  return {
    middleName: validateOptionalNameLikeField(personalDetails.middleName || '', 'Middle name'),
    fatherName: validateOptionalNameLikeField(personalDetails.fatherName || '', "Father's name"),
    experience: experienceError,
    qualification: qualificationError,
    religion:
      personalDetails.religion && !isValidReligion(personalDetails.religion)
        ? getReligionErrorMessage()
        : '',
    nationality:
      personalDetails.nationality && !isValidNationality(personalDetails.nationality)
        ? getNationalityErrorMessage()
        : '',
    bloodGroup:
      bloodGroup && !/^(A|A1|A2|B|AB|A1B|A2B|O|OH)(\+|-|POSITIVE|NEGATIVE)$/i.test(bloodGroup)
        ? 'Blood group must be in format A+,A-,B+,B-,AB+,AB-,O+,O-,OH+,OH-,A1B,A2B'
        : '',
    dob: dobError,
    gender: genderError,
    residenceAddress: getResidenceAddressError(personalDetails.residenceAddress),
  };
};

export const getProfessionalOtherDetailsFieldErrors = (
  details: ProfessionalOtherDetailsFields = {}
): Record<string, string> => {
  const aadharNo = (details.aadharNo || '').replace(/\D/g, '');
  const panNo = (details.panNo || '').trim().toUpperCase();
  const esiNo = (details.esiNo || '').replace(/\D/g, '');
  const pfNo = (details.pfNo || '').replace(/\D/g, '');
  const biometricUserId = (details.biometricUserId || '').trim();
  const exitDate = (details.exitDate || '').trim();

  let exitDateError = '';
  if (exitDate) {
    if (!isParseableDate(exitDate)) {
      exitDateError = 'Please enter a valid resigning/termination date';
    } else if (!isStrictlyPastDate(exitDate)) {
      exitDateError = 'Resigning date must be a past date';
    }
  }

  return {
    aadharNo: aadharNo && !/^\d{12}$/.test(aadharNo) ? 'Aadhaar number must be exactly 12 digits' : '',
    panNo: panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNo) ? 'PAN must be in format ABCDE1234F' : '',
    esiNo: esiNo && !/^\d{10}$/.test(esiNo) ? 'ESI number must be exactly 10 digits' : '',
    pfNo: pfNo && !/^\d{12}$/.test(pfNo) ? 'PF number must be exactly 12 digits' : '',
    biometricUserId:
      biometricUserId &&
      (biometricUserId.length < BIOMETRIC_USER_ID_CONSTANTS.MIN_LENGTH ||
        biometricUserId.length > BIOMETRIC_USER_ID_CONSTANTS.MAX_LENGTH)
        ? `Biometric User ID must be between ${BIOMETRIC_USER_ID_CONSTANTS.MIN_LENGTH} and ${BIOMETRIC_USER_ID_CONSTANTS.MAX_LENGTH} characters`
        : '',
    exitDate: exitDateError,
  };
};

export const hasFieldErrors = (errors: Record<string, string>): boolean =>
  Object.values(errors).some(Boolean);

export const mapImportRowToPersonalDetails = (
  row: Record<string, unknown>
): PersonalDetailsFields => ({
  middleName: row.middleName as string | undefined,
  fatherName: row.fatherName as string | undefined,
  staffId: row.staffId as string | undefined,
  experience: row.experience as string | undefined,
  qualification: row.qualification as string | undefined,
  gender: row.gender ? String(row.gender).trim().toLowerCase() : undefined,
  dob: row.dob as string | undefined,
  religion: row.religion as string | undefined,
  nationality: row.nationality as string | undefined,
  bloodGroup: row.bloodGroup as string | undefined,
  residenceAddress: row.residenceAddress as string | undefined,
});

export const mapImportRowToProfessionalDetails = (
  row: Record<string, unknown>
): ProfessionalOtherDetailsFields => ({
  aadharNo: row.aadharNo as string | undefined,
  panNo: row.panNo as string | undefined,
  esiNo: row.esiNo as string | undefined,
  pfNo: row.pfNo as string | undefined,
  exitDate: row.resigningOrTerminationDate as string | undefined,
  biometricUserId: row.biometricUserId as string | undefined,
});

export const getImportRowPersonalAndProfessionalErrors = (
  row: Record<string, unknown>
): Record<string, string> => ({
  ...getPersonalDetailsFieldErrors(mapImportRowToPersonalDetails(row)),
  ...getProfessionalOtherDetailsFieldErrors(mapImportRowToProfessionalDetails(row)),
});

export const getEmployeeIdFieldErrors = (employeeId?: string): string[] => {
  const id = (employeeId || '').trim();
  const messages: string[] = [];
  if (!id) {
    messages.push('Employee ID is required');
    return messages;
  }
  if (id.length < EMPLOYEE_ID_CONSTANTS.MIN_LENGTH) {
    messages.push(`Employee ID must be at least ${EMPLOYEE_ID_CONSTANTS.MIN_LENGTH} characters`);
  }
  if (id.length > EMPLOYEE_ID_CONSTANTS.MAX_LENGTH) {
    messages.push(`Employee ID cannot exceed ${EMPLOYEE_ID_CONSTANTS.MAX_LENGTH} characters`);
  }
  if (
    id.length >= EMPLOYEE_ID_CONSTANTS.MIN_LENGTH &&
    id.length <= EMPLOYEE_ID_CONSTANTS.MAX_LENGTH &&
    !isValidEmployeeId(id)
  ) {
    messages.push('Employee ID format is invalid');
  }
  return messages;
};

export const validateExcelData = async (data: Record<string, unknown>[], clientId?: string): Promise<{ errors: string[]; warnings: string[]; validCount: number }> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!Array.isArray(data) || data.length === 0) {
    errors.push("No data found in the Excel file");
    return { errors, warnings, validCount: 0 };
  }

  // Check for required headers/columns
  const requiredColumns = [
    'employeeId',
    'firstName',
    'lastName',
    // email, employeeType, department are optional
    // 'joiningDate',
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
    'Committee',
    'Sop',
    'Student well being',
    'Child Audit',
    'Compliance Documents'
  ];
  const ALLOWED_DEPARTMENT = [
    'admin',
    'teaching',
    'security',
    'maintenance',
    'driver',
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
  const isValidEmployeeType = isValidEmployeeTypeValue;
  const isValidDepartment = (department: string): boolean => {
    if (!department) return false;
    return ALLOWED_DEPARTMENT.includes(department.trim().toLowerCase());
  };
  const isValidStatus = (status: string): boolean => {
    if (!status) return false;
    return ALLOWED_STATUS.includes(status.trim().toLowerCase());
  };
  // Check for duplicate employee IDs within the file
  const employeeIdEntries: { id: string; index: number }[] = [];
  const emailEntries: { email: string; index: number }[] = [];
  data.forEach((row, index) => {
    if (row.employeeId !== undefined && row.employeeId !== null && String(row.employeeId).trim() !== '') {
      employeeIdEntries.push({ id: String(row.employeeId).trim(), index });
    }
    if (row.email !== undefined && row.email !== null && String(row.email).trim() !== '') {
      emailEntries.push({ email: String(row.email).trim().toLowerCase(), index });
    }
  });
  const employeeIds = employeeIdEntries.map(entry => entry.id);
  const emailsRaw = emailEntries.map(entry => entry.email);

  const skippedRowIndices = new Set<number>();
  const duplicateReasonsByRow = new Map<number, string[]>();
  const addDuplicateReason = (index: number, reason: string) => {
    skippedRowIndices.add(index);
    const existing = duplicateReasonsByRow.get(index);
    if (existing) {
      existing.push(reason);
    } else {
      duplicateReasonsByRow.set(index, [reason]);
    }
  };

  const idFirstSeenAt = new Map<string, number>();
  employeeIdEntries.forEach(({ id, index }) => {
    if (idFirstSeenAt.has(id)) {
      addDuplicateReason(index, `Employee ID '${id}' is duplicated in the file`);
    } else {
      idFirstSeenAt.set(id, index);
    }
  });

  const emailFirstSeenAt = new Map<string, number>();
  emailEntries.forEach(({ email, index }) => {
    if (emailFirstSeenAt.has(email)) {
      addDuplicateReason(index, `Email '${email}' is duplicated in the file`);
    } else {
      emailFirstSeenAt.set(email, index);
    }
  });

  // Check for existing employee IDs / emails in the database if clientId is provided
  if (clientId && (employeeIds.length > 0 || emailsRaw.length > 0)) {
    try {
      const { duplicateEmployeeIds, duplicateEmails, errors: dbErrors } = await checkBulkDuplicates(employeeIds, emailsRaw, clientId);

      if (dbErrors.length > 0) {
        errors.push(...dbErrors);
      }

      employeeIdEntries.forEach(({ id, index }) => {
        if (duplicateEmployeeIds.includes(id)) {
          addDuplicateReason(index, `Employee ID '${id}' already exists`);
        }
      });
      emailEntries.forEach(({ email, index }) => {
        if (duplicateEmails.includes(email)) {
          addDuplicateReason(index, `Email '${email}' already exists`);
        }
      });
    } catch (error) {
      console.error('Error checking bulk duplicates:', error);
      errors.push('Error validating employee IDs and emails against existing records');
    }
  }

  [...duplicateReasonsByRow.entries()]
    .sort(([indexA], [indexB]) => indexA - indexB)
    .forEach(([index, reasons]) => {
      const rowNum = index + 2; // +2 because Excel is 1-based and we're skipping header row
      warnings.push(`Row ${rowNum}: ${reasons.join(', ')} — will be skipped`);
    });
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
    // Validate email format and length if present
    if (row.email) {
      const email = String(row.email).trim();

      if (email.length > EMPLOYEE_EMAIL_MAX_LENGTH) {
        errors.push(
          `Row ${rowNum}: Email cannot exceed ${EMPLOYEE_EMAIL_MAX_LENGTH} characters`
        );
      } else if (!isValidEmployeeEmail(email)) {
        errors.push(`Row ${rowNum}: Invalid email format - ${email}`);
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
      } else if (new Date(row.joiningDate).getFullYear() < 1940) {
        errors.push(
          `Row ${rowNum}: Joining Date year must be 1940 or later`
        );
      } else if (!isDateNotInFuture(row.joiningDate)) {
        errors.push(
          `Row ${rowNum}: Joining Date cannot be in the future`
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
          `Row ${rowNum}: Employee ID format is invalid`
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
        row.moduleAccessPayload.forEach((m: { name?: string; module_id?: string; key?: string }) => {
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
      const parts = moduleCell.split(/[,;|/]/).map((p: string) => p.trim()).filter(Boolean);
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

    const personalAndProfessionalErrors = getImportRowPersonalAndProfessionalErrors(row);
    Object.entries(personalAndProfessionalErrors).forEach(([, message]) => {
      if (message) {
        errors.push(`Row ${rowNum}: ${message}`);
      }
    });
  });

  const validCount = errors.length === 0 ? data.length - skippedRowIndices.size : 0;
  return { errors, warnings, validCount };
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

