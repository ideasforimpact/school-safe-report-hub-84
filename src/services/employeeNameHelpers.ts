import { EmployeeDepartmentOption } from '@/hooks/useEmployeeDepartments';
import { EmployeeTypeOption } from '@/hooks/useEmployeeTypes';
import { capitalizeWords } from '@/lib/formatUtils';

/**
 * Get department name from department ID
 */
export const employeeDepartmentName = (
  departmentId?: string | null,
  departments: EmployeeDepartmentOption[] = []
): string => {
  if (!departmentId || !departments.length) return '';

  return capitalizeWords(
    departments.find(dep => dep.id === departmentId)?.department_name ||
    'Not Specified'
  );
};

/**
 * Get employee type name from employee type ID
 */
export const employeeTypeName = (
  employeeTypeId?: string | null,
  employeeTypes: EmployeeTypeOption[] = []
): string => {
  if (!employeeTypeId || !employeeTypes.length) return '';

  return capitalizeWords(
    employeeTypes.find(type => type.id === employeeTypeId)?.type_name ||
    ''
  );
};

/**
 * Get an employee's display name: their Aadhaar-verified name if set
 * (the source of truth once verification has run), falling back to
 * first + last name.
 */
export const employeeDisplayName = (employee: {
  first_name: string | null;
  last_name: string | null;
  aadhar_verified_name?: string | null;
}): string =>
  employee.aadhar_verified_name ||
  `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim();
