
import { Employee } from '@/contexts/employee/types';

// Interface to represent the database record structure
interface DbEmployeeRecord {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_type: string;
  department: string;
  joining_date: string;
  status: string;
  client_id?: string; // Updated to be optional to match database schema
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// Map a database record to our Employee type
export const mapDbRecordToEmployee = (dbRecord: DbEmployeeRecord): Employee => {
  return {
    id: dbRecord.id,
    employeeId: dbRecord.employee_id,
    firstName: dbRecord.first_name,
    lastName: dbRecord.last_name,
    email: dbRecord.email,
    employeeType: dbRecord.employee_type as any,
    department: dbRecord.department as any,
    joiningDate: dbRecord.joining_date,
    status: dbRecord.status as any,
    clientId: dbRecord.client_id, // Properly map client_id to clientId
    userId: dbRecord.user_id,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
};

// Map our Employee type to a database record
export const mapEmployeeToDbRecord = (employee: Partial<Employee>): Partial<DbEmployeeRecord> => {
  const dbRecord: Partial<DbEmployeeRecord> = {};
  
  // Map all fields
  if (employee.id !== undefined) dbRecord.id = employee.id;
  if (employee.employeeId !== undefined) dbRecord.employee_id = employee.employeeId;
  if (employee.firstName !== undefined) dbRecord.first_name = employee.firstName;
  if (employee.lastName !== undefined) dbRecord.last_name = employee.lastName;
  if (employee.email !== undefined) dbRecord.email = employee.email;
  if (employee.employeeType !== undefined) dbRecord.employee_type = employee.employeeType;
  if (employee.department !== undefined) dbRecord.department = employee.department;
  if (employee.joiningDate !== undefined) dbRecord.joining_date = employee.joiningDate;
  if (employee.status !== undefined) dbRecord.status = employee.status;
  if (employee.userId !== undefined) dbRecord.user_id = employee.userId;
  
  // Important: Map clientId to client_id for database schema compatibility
  if (employee.clientId !== undefined) {
    console.log("Mapping clientId to client_id:", employee.clientId);
    dbRecord.client_id = employee.clientId;
  }
  
  // We don't need to include createdAt and updatedAt as they're handled by the database
  
  return dbRecord;
};
