
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/contexts/employee/types';

// Updated mapping function that no longer needs to handle application_fields
const mapDbRecordToEmployee = (record: any): Employee => {
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
    applicationFields: {}, // Default empty object as we no longer store this in DB
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
};

// API service for retrieving employees using Supabase
export const getAllEmployeesFromApi = async (): Promise<Employee[]> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*');

    if (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
      throw error;
    }

    // Convert the database records to our Employee type format
    const employees = data.map(mapDbRecordToEmployee);
    return employees || [];
  } catch (error) {
    console.error("Error in getAllEmployeesFromApi:", error);
    toast.error("Failed to fetch employees");
    throw error;
  }
};

export const getEmployeeByIdFromApi = async (id: string): Promise<Employee | null> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching employee:", error);
      toast.error("Failed to fetch employee details");
      throw error;
    }

    if (!data) return null;

    return mapDbRecordToEmployee(data);
  } catch (error) {
    console.error("Error in getEmployeeByIdFromApi:", error);
    toast.error("Failed to fetch employee details");
    throw error;
  }
};
