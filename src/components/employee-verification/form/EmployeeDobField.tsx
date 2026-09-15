
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Employee Date of Birth validation constants — a shared age range so DOB
 * is checked consistently everywhere it's collected (Add/Edit User,
 * Employee Verification document upload).
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

interface EmployeeDobFieldProps {
  value: string;
  min: string;
  max: string;
  error?: string;
  onChange: (value: string) => void;
  onIncompleteChange?: (incomplete: boolean) => void;
  required?: boolean;
  label?: string;
}

/**
 * Shared DOB field — purely presentational. The caller computes `min`,
 * `max`, and `error` (via {@link getEmployeeDobMinDate}, {@link
 * getEmployeeDobMaxDate}, {@link getEmployeeDobValidationError}) and
 * passes them in as props, so every DOB field in the app stays in sync.
 */
const EmployeeDobField = ({
  value,
  min,
  max,
  error,
  onChange,
  onIncompleteChange,
  required = false,
  label = 'DOB',
}: EmployeeDobFieldProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        type="date"
        value={value || ''}
        onChange={(e) => {
          onIncompleteChange?.(e.target.validity.badInput);
          onChange(e.target.value);
        }}
        onBlur={(e) => {
          // Re-check DOB validity on blur to catch incomplete dates when onChange doesn't fire.
          onIncompleteChange?.(e.target.validity.badInput);
        }}
        min={min}
        max={max}
        aria-invalid={!!error}
        className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default EmployeeDobField;
