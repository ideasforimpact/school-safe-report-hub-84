
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/contexts/employee/types';
import { mapDbRecordToEmployee } from './utils/employeeMappers';

export const getAllEmployeesFromApi = async (): Promise<Employee[]> => {
  try {
    console.log("Calling getAllEmployeesFromApi...");
    // Fetch all employees from the database with their documents
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        documents:employee_documents(
          id,
          document_type_id,
          document_url,
          document_number,
          verification_status,
          document_status_id,
          employee_docs_log
        )
      `);

    if (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
      throw error;
    }

    console.log(`Successfully fetched ${data.length} employees from API`);
    
    // Map the database records to our Employee model
    return data.map(record => {
      const employee = mapDbRecordToEmployee(record);
      
      // Add the documents to the employee object
      if (record.documents) {
        employee.documents = record.documents;
      }
      
      return employee;
    });
  } catch (error) {
    console.error("Error in getAllEmployeesFromApi:", error);
    toast.error("Failed to fetch employees");
    throw error;
  }
};

export const getEmployeeByIdFromApi = async (id: string): Promise<Employee> => {
  try {
    // Fetch a single employee by ID with documents
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        documents:employee_documents(
          id,
          document_type_id,
          document_url,
          document_number,
          verification_status,
          document_status_id,
          employee_docs_log
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching employee:", error);
      toast.error("Failed to fetch employee");
      throw error;
    }

    // Convert the response to our Employee type
    const employee = mapDbRecordToEmployee(data);
    
    // Add the documents to the employee object
    if (data.documents) {
      employee.documents = data.documents;
    }
    
    return employee;
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
