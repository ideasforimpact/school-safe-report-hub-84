/**
 * Employee-related constants
 * Centralized configuration for employee validation rules
 */

/**
 * Single switch controlling whether Employee ID may contain special
 * characters (anything other than letters/digits). Flip this one flag to
 * change the rule everywhere Employee ID is validated — Add User, Edit
 * User, and Import Employee all derive their pattern from it, so there is
 * nothing else to update to turn the rule on/off.
 */
export const EMPLOYEE_ID_ALLOW_SPECIAL_CHARACTERS = true;

/**
 * Employee ID validation constants
 */
export const EMPLOYEE_ID_CONSTANTS = {
  /** Minimum length for employee ID */
  MIN_LENGTH: 3,

  /** Maximum length for employee ID */
  MAX_LENGTH: 25,

  /** Validation regex pattern - derived from EMPLOYEE_ID_ALLOW_SPECIAL_CHARACTERS */
  PATTERN: EMPLOYEE_ID_ALLOW_SPECIAL_CHARACTERS
    ? /^.{3,25}$/
    : /^[a-zA-Z0-9]{3,25}$/,
} as const;

/**
 * Get error message for invalid employee ID
 * @returns Error message string
 */
export const getEmployeeIdErrorMessage = (): string => {
  const lengthPart = `Employee ID must be ${EMPLOYEE_ID_CONSTANTS.MIN_LENGTH}–${EMPLOYEE_ID_CONSTANTS.MAX_LENGTH} characters`;
  return EMPLOYEE_ID_ALLOW_SPECIAL_CHARACTERS
    ? lengthPart
    : `${lengthPart} and contain only letters and numbers`;
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

/**
 * Employee Date of Birth validation constants — a shared age range so DOB
 * is checked consistently across Add User, Edit User, and Import
 * Employee. Rejects out-of-range years (e.g. 0001, 0100) and future
 * dates, in addition to the existing minimum-age rule.
 */
export const EMPLOYEE_DOB_CONSTANTS = {
  /** Minimum age (in years) allowed for an employee */
  MIN_AGE: 18,

  /** Maximum age (in years) allowed for an employee */
  MAX_AGE: 100,
} as const;

export const getEmployeeDobErrorMessage = (): string =>
  `Employee must be between ${EMPLOYEE_DOB_CONSTANTS.MIN_AGE} and ${EMPLOYEE_DOB_CONSTANTS.MAX_AGE} years old`;

/**
 * Age (in whole years) as of `today` for someone born on `dob`.
 */
export const getAgeFromDob = (dob: Date, today: Date = new Date()): number => {
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
};

/** Earliest date a date-of-birth field may accept, as `yyyy-MM-dd` (today minus MAX_AGE years). */
export const getEmployeeDobMinDate = (): string =>
  new Date(new Date().setFullYear(new Date().getFullYear() - EMPLOYEE_DOB_CONSTANTS.MAX_AGE))
    .toISOString()
    .split('T')[0];

/** Latest date a date-of-birth field may accept, as `yyyy-MM-dd` (today — no future dates). */
export const getEmployeeDobMaxDate = (): string => new Date().toISOString().split('T')[0];

/**
 * Single source of truth for date-of-birth validation, so every DOB field
 * (Add User, Edit User, Employee Verification document upload, ...) enforces
 * the same rules and wording automatically. Accepts a `yyyy-MM-dd` string
 * (the native <input type="date"> value) and a Date. Returns '' when valid,
 * otherwise a user-facing error message.
 */
export const getEmployeeDobValidationError = (dob: string | Date | undefined | null): string => {
  if (!dob) return '';

  let inputDate: Date;
  if (dob instanceof Date) {
    inputDate = dob;
  } else {
    const parts = dob.split('-');
    if (parts.length !== 3) return 'Please enter a valid date of birth.';

    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return 'Please enter a valid date of birth.';

    inputDate = new Date(year, month - 1, day);
    if (
      inputDate.getFullYear() !== year ||
      inputDate.getMonth() !== month - 1 ||
      inputDate.getDate() !== day
    ) {
      return 'Please enter a valid date of birth.';
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate > today) {
    return 'Please enter a valid date of birth. Future dates are not allowed.';
  }

  const age = getAgeFromDob(inputDate, today);
  if (age < EMPLOYEE_DOB_CONSTANTS.MIN_AGE || age > EMPLOYEE_DOB_CONSTANTS.MAX_AGE) {
    return `Date of birth must reflect an age between ${EMPLOYEE_DOB_CONSTANTS.MIN_AGE} and ${EMPLOYEE_DOB_CONSTANTS.MAX_AGE} years.`;
  }

  return '';
};

/** Convenience boolean wrapper around {@link getEmployeeDobValidationError}. */
export const isValidEmployeeDob = (dob: string | Date | undefined | null): boolean =>
  !getEmployeeDobValidationError(dob);

export const EMPLOYEE_DESIGNATION_CONSTANTS = {
  MIN_LENGTH: 3,

  MAX_LENGTH: 25,

  PATTERN: /^[a-zA-Z\s]{3,25}$/,
} as const;

export const EMPLOYEE_PERSONAL_INFO_CONSTANTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 25,
} as const;

// export const STAFF_ID_CONSTANTS = {
//   MIN_LENGTH: 3,
//   MAX_LENGTH: 20,
// } as const;

export const BIOMETRIC_USER_ID_CONSTANTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
} as const;

export const EXPERIENCE_CONSTANTS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 2,
} as const;

/**
 * Closed list of allowed religion values. Shared by Add User, Edit User,
 * and the Import Employee Excel/CSV validator so the three surfaces can't
 * drift into accepting different sets of values.
 */
export const ALLOWED_RELIGIONS = [
  'Hindu',
  'Muslim',
  'Christian',
] as const;

/**
 * Case-insensitive, diacritic-insensitive normalization so a value typed
 * without special keyboard characters (e.g. "Bahai" or "Baha'i" instead of
 * "Baháʼí") still matches — most keyboards/Excel autocorrect can't
 * reliably produce the exact Unicode apostrophe/accent.
 */
const normalizeReligionValue = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents, e.g. á -> a
    .replace(/[‘’ʼ`]/g, "'") // curly/typographic apostrophes -> '
    .trim()
    .toLowerCase();

const NORMALIZED_ALLOWED_RELIGIONS = ALLOWED_RELIGIONS.map(normalizeReligionValue);

/**
 * Religion is optional — an empty value is valid. When present, it must
 * match one of ALLOWED_RELIGIONS (case/diacritic-insensitive).
 */
export const isValidReligion = (value: string): boolean => {
  const trimmed = (value || '').trim();
  if (!trimmed) return true;
  return NORMALIZED_ALLOWED_RELIGIONS.includes(normalizeReligionValue(trimmed));
};

export const getReligionErrorMessage = (): string =>
  `Religion must be one of: ${ALLOWED_RELIGIONS.join(', ')}`;

/**
 * Closed list of allowed nationality values. Shared by Add User, Edit
 * User, and the Import Employee Excel/CSV validator so a free-typed
 * garbage string (e.g. "onernerogne") can't slip through just because it
 * happens to be letters-only.
 */
export const ALLOWED_NATIONALITIES = ['Indian'] as const;

const NORMALIZED_ALLOWED_NATIONALITIES = ALLOWED_NATIONALITIES.map(n => n.trim().toLowerCase());

/**
 * Nationality is optional — an empty value is valid. When present, it
 * must match one of ALLOWED_NATIONALITIES (case-insensitive).
 */
export const isValidNationality = (value: string): boolean => {
  const trimmed = (value || '').trim();
  if (!trimmed) return true;
  return NORMALIZED_ALLOWED_NATIONALITIES.includes(trimmed.toLowerCase());
};

export const getNationalityErrorMessage = (): string =>
  `Nationality must be one of: ${ALLOWED_NATIONALITIES.join(', ')}`;

/**
 * Canonical Employee Type values (matches the app-wide `EmployeeType`
 * stored form, e.g. `part_time`). Shared by Add/Edit User (dropdown, so
 * always canonical already), the Import Verify step, and the Import
 * insert-building step, so all three agree on exactly the same set —
 * this is the single place to add/remove an allowed employee type.
 */
export const ALLOWED_EMPLOYEE_TYPES = ['permanent', 'contract', 'part time', 'consultant'] as const;

/**
 * Employee Type is free-typed in the import sheet, so "part time",
 * "part_time", "part-time", and "parttime" must all be treated as the
 * same value — stripping spaces/underscores/hyphens before comparing
 * handles every common spelling a person would actually type.
 */
const normalizeEmployeeTypeValue = (value: string): string =>
  (value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

const NORMALIZED_EMPLOYEE_TYPES = ALLOWED_EMPLOYEE_TYPES.map((canonical) => ({
  canonical,
  normalized: normalizeEmployeeTypeValue(canonical),
}));

export const isValidEmployeeTypeValue = (value: string): boolean => {
  const trimmed = (value || '').trim();
  if (!trimmed) return false;
  const normalized = normalizeEmployeeTypeValue(trimmed);
  return NORMALIZED_EMPLOYEE_TYPES.some((t) => t.normalized === normalized);
};

/**
 * Resolve a free-typed employee type to its canonical stored form (e.g.
 * "parttime" / "part time" / "PART_TIME" all resolve to "part_time").
 * Returns null if the value doesn't match any allowed type — callers
 * should treat that the same as "invalid".
 */
export const canonicalizeEmployeeType = (value: string): string | null => {
  const normalized = normalizeEmployeeTypeValue(value);
  const match = NORMALIZED_EMPLOYEE_TYPES.find((t) => t.normalized === normalized);
  return match ? match.canonical : null;
};

export const getEmployeeTypeErrorMessage = (): string =>
  `Invalid employee type. Allowed values are: ${ALLOWED_EMPLOYEE_TYPES.join(', ')}`;

/**
 * Human-readable display label for a stored employee type value, e.g.
 * "part_time" -> "Part Time". Use this anywhere the raw stored value
 * would otherwise be shown to a user (the dropdown already shows the
 * friendly label by construction; this is for read-only displays like
 * the Docs panel, badges, or table cells).
 */
export const getEmployeeTypeLabel = (value?: string | null): string => {
  if (!value) return '';
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
