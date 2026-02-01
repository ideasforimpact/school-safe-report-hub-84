import { EmployeeDepartmentOption } from '@/hooks/useEmployeeDepartments';
import { EmployeeTypeOption } from '@/hooks/useEmployeeTypes';

/**
 * Get department name from department ID
 */
export const employeeDepartmentName = (
  departmentId?: string | null,
  departments: EmployeeDepartmentOption[] = []
): string => {
  if (!departmentId || !departments.length) return 'Not Specified';

  return (
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
  if (!employeeTypeId || !employeeTypes.length) return 'Employee';

  return (
    employeeTypes.find(type => type.id === employeeTypeId)?.type_name ||
    'Employee'
  );
};
