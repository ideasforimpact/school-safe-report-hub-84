
import { Employee } from '@/contexts/employee/types';

// Interface to represent the database record structure
interface DbEmployeeRecord {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_type: string | { id: string; type_name: string }; // Can be UUID or joined object
  department: string | { id: string; department_name: string }; // Can be UUID or joined object
  joining_date: string;
  status: boolean; // Changed to boolean to match database
  client_id?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// Map a database record to our Employee type
export const mapDbRecordToEmployee = (dbRecord: DbEmployeeRecord): Employee => {
  // Handle employee_type - can be UUID string or joined object
  let employeeTypeValue: string = 'permanent';
  if (typeof dbRecord.employee_type === 'string') {
    // If it's a UUID, we can't resolve it here, but we'll handle it in retrieval service
    employeeTypeValue = dbRecord.employee_type;
  } else if (dbRecord.employee_type && typeof dbRecord.employee_type === 'object') {
    // If it's a joined object, use the type_name
    employeeTypeValue = dbRecord.employee_type.type_name;
  }

  // Handle department - can be UUID string or joined object
  let departmentValue: string = 'admin';
  if (typeof dbRecord.department === 'string') {
    // If it's a UUID, we can't resolve it here, but we'll handle it in retrieval service
    departmentValue = dbRecord.department;
  } else if (dbRecord.department && typeof dbRecord.department === 'object') {
    // If it's a joined object, use the department_name
    departmentValue = dbRecord.department.department_name;
  }

  return {
    id: dbRecord.id,
    employeeId: dbRecord.employee_id,
    firstName: dbRecord.first_name,
    lastName: dbRecord.last_name,
    email: dbRecord.email,
    employeeType: employeeTypeValue as any,
    department: departmentValue as any,
    joiningDate: dbRecord.joining_date,
    status: dbRecord.status ? 'active' : 'inactive', // Convert boolean to string status
    clientId: dbRecord.client_id,
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
  // employee_type is now a UUID, so we pass it as-is if it's a UUID, otherwise we'll need to map it
  // The mapping from text to UUID should happen in the service layer or edge function
  if (employee.employeeType !== undefined) {
    // If it's already a UUID, use it directly
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(employee.employeeType)) {
      dbRecord.employee_type = employee.employeeType;
    } else {
      // If it's text, we'll need to map it - but this should ideally be done before calling this function
      // For now, we'll pass it through and let the edge function handle the mapping
      dbRecord.employee_type = employee.employeeType;
    }
  }
  // department is now a UUID, so we pass it as-is if it's a UUID, otherwise we'll need to map it
  // The mapping from text to UUID should happen in the service layer or edge function
  if (employee.department !== undefined) {
    // If it's already a UUID, use it directly
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(employee.department)) {
      dbRecord.department = employee.department;
    } else {
      // If it's text, we'll need to map it - but this should ideally be done before calling this function
      // For now, we'll pass it through and let the edge function handle the mapping
      dbRecord.department = employee.department;
    }
  }
  if (employee.joiningDate !== undefined) dbRecord.joining_date = employee.joiningDate;
  
  // Convert status string to boolean for database
  if (employee.status !== undefined) {
    dbRecord.status = employee.status === 'active'; // Convert string status to boolean
  }
  
  if (employee.userId !== undefined) dbRecord.user_id = employee.userId;
  
  // Important: Map clientId to client_id for database schema compatibility
  if (employee.clientId !== undefined) {
    console.log("Mapping clientId to client_id:", employee.clientId);
    dbRecord.client_id = employee.clientId;
  }
  
  // We don't need to include createdAt and updatedAt as they're handled by the database
  
  return dbRecord;
};
