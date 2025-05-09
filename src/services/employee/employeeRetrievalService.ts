
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/contexts/employee/types';
import { mapDbRecordToEmployee } from './utils/employeeMappers';

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
