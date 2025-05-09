
import { Employee, EmployeeType, DepartmentType, EmploymentStatus } from '@/contexts/employee/types';

// Helper function to map database records to our Employee type format
export const mapDbRecordToEmployee = (record: any): Employee => {
  return {
    id: record.id,
    userId: record.user_id,
    employeeId: record.employee_id,
    firstName: record.first_name,
    lastName: record.last_name,
    email: record.email,
    employeeType: record.employee_type as EmployeeType,
    department: record.department as DepartmentType,
    joiningDate: record.joining_date,
    status: record.status as EmploymentStatus,
    applicationFields: {}, // Default empty object as we no longer store this in DB
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
};

// Convert Employee object to database schema format
export const mapEmployeeToDbRecord = (employeeData: Partial<Employee>): Record<string, any> => {
  const dbEmployee: Record<string, any> = {};
  
  if (employeeData.userId !== undefined) dbEmployee.user_id = employeeData.userId;
  if (employeeData.employeeId !== undefined) dbEmployee.employee_id = employeeData.employeeId;
  if (employeeData.firstName !== undefined) dbEmployee.first_name = employeeData.firstName;
  if (employeeData.lastName !== undefined) dbEmployee.last_name = employeeData.lastName;
  if (employeeData.email !== undefined) dbEmployee.email = employeeData.email;
  if (employeeData.employeeType !== undefined) dbEmployee.employee_type = employeeData.employeeType;
  if (employeeData.department !== undefined) dbEmployee.department = employeeData.department;
  if (employeeData.joiningDate !== undefined) dbEmployee.joining_date = employeeData.joiningDate;
  if (employeeData.status !== undefined) dbEmployee.status = employeeData.status;
  
  return dbEmployee;
};
