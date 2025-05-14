
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/contexts/employee/types';
import { mapDbRecordToEmployee } from './utils/employeeMappers';

export const getAllEmployeesFromApi = async (): Promise<Employee[]> => {
  try {
    console.log("Calling getAllEmployeesFromApi...");
    // Fetch all employees from the database
    const { data, error } = await supabase
      .from('employees')
      .select('*');

    if (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
      throw error;
    }

    console.log(`Successfully fetched ${data.length} employees from API`);
    
    // Map the database records to our Employee model
    return data.map(record => mapDbRecordToEmployee(record));
  } catch (error) {
    console.error("Error in getAllEmployeesFromApi:", error);
    toast.error("Failed to fetch employees");
    throw error;
  }
};

export const getEmployeeByIdFromApi = async (id: string): Promise<Employee> => {
  try {
    // Fetch a single employee by ID
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching employee:", error);
      toast.error("Failed to fetch employee");
      throw error;
    }

    // Convert the response to our Employee type
    return mapDbRecordToEmployee(data);
  } catch (error) {
    console.error("Error in getEmployeeByIdFromApi:", error);
    toast.error("Failed to fetch employee");
    throw error;
  }
};

export const getEmployeeByUserIdFromApi = async (userId: string): Promise<Employee> => {
  try {
    // Fetch a single employee by user ID
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("Error fetching employee by user ID:", error);
      toast.error("Failed to fetch employee");
      throw error;
    }

    // Convert the response to our Employee type
    return mapDbRecordToEmployee(data);
  } catch (error) {
    console.error("Error in getEmployeeByUserIdFromApi:", error);
    toast.error("Failed to fetch employee");
    throw error;
  }
};
