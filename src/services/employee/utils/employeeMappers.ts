
import { Employee } from '@/contexts/employee/types';

// Map a database employee record to our Employee model
export const mapDbRecordToEmployee = (record: any): Employee => {
  return {
    id: record.id,
    userId: record.user_id,
    employeeId: record.employee_id,
    firstName: record.first_name,
    lastName: record.last_name,
    email: record.email,
    employeeType: record.employee_type,
    department: record.department,
    joiningDate: record.joining_date,
    status: record.status,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
};

// Map our Employee model to a database record format
export const mapEmployeeToDbRecord = (employee: Partial<Employee>): Record<string, any> => {
  const dbRecord: Record<string, any> = {};
  
  if (employee.userId !== undefined) dbRecord.user_id = employee.userId;
  if (employee.employeeId !== undefined) dbRecord.employee_id = employee.employeeId;
  if (employee.firstName !== undefined) dbRecord.first_name = employee.firstName;
  if (employee.lastName !== undefined) dbRecord.last_name = employee.lastName;
  if (employee.email !== undefined) dbRecord.email = employee.email;
  if (employee.employeeType !== undefined) dbRecord.employee_type = employee.employeeType;
  if (employee.department !== undefined) dbRecord.department = employee.department;
  if (employee.joiningDate !== undefined) dbRecord.joining_date = employee.joiningDate;
  if (employee.status !== undefined) dbRecord.status = employee.status;
  
  return dbRecord;
};
