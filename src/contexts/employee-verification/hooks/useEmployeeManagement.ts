
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Employee, VerificationDocument } from '@/types/employeeVerification';
import { initialEmployees } from '../initialData';
import { supabase } from '@/integrations/supabase/client';

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);

  // Fetch employees from the database
  const fetchEmployees = useCallback(async () => {
    try {
      // Attempt to fetch employees from the database
      const { data, error } = await supabase
        .from('employees')
        .select('*');

      if (error) {
        console.error('Error fetching employees:', error);
        return initialEmployees;
      }

      // Map the database employees to our Employee type
      if (data && data.length > 0) {
        const employeesList: Employee[] = data.map((emp): Employee => ({
          id: emp.id,
          employeeId: emp.employee_id || '',
          name: `${emp.first_name} ${emp.last_name}`,
          firstName: emp.first_name,
          lastName: emp.last_name,
          email: emp.email || '',
          // Use default values for fields that don't exist in the database
          phone: '',
          dateOfBirth: '',
          address: '',
          joiningDate: emp.joining_date || new Date().toISOString(),
          department: emp.department || '',
          position: emp.employee_type || '', // Use employee_type as position since it doesn't exist
          employeeType: (emp.employee_type as Employee['employeeType']) || 'permanent',
          status: emp.status === true, // Convert to boolean
          createdAt: emp.created_at || new Date().toISOString(),
          updatedAt: emp.updated_at || new Date().toISOString(),
          documents: [] // Initialize empty documents array
        }));
        
        // Now fetch documents for each employee
        const employeesWithDocs = await Promise.all(
          employeesList.map(async (employee) => {
            try {
              const { data: docs, error: docsError } = await supabase
                .from('employee_documents')
                .select('*')
                .eq('employee_id', employee.id);
                
              if (!docsError && docs) {
                // Add the documents to the employee object
                const mappedDocs: VerificationDocument[] = docs.map(doc => ({
                  id: doc.id,
                  employeeId: doc.employee_id,
                  documentTypeId: doc.document_type_id,
                  documentNumber: doc.document_number || '',
                  documentImage: doc.document_url ? 
                    `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${doc.document_url}` : '',
                  verificationStatus: doc.verification_status as 'pending' | 'verified' | 'failed' || 'pending',
                  documentStatusId: doc.document_status_id,
                  // Properly cast employee_docs_log to match the expected type
                  employee_docs_log: Array.isArray(doc.employee_docs_log) ? 
                    doc.employee_docs_log.map((log: any) => ({
                      timestamp: log.timestamp || '',
                      action: log.action || '',
                      response: log.response || {},
                      notes: log.notes || ''
                    })) : [],
                  createdAt: doc.created_at || new Date().toISOString(),
                  updatedAt: doc.updated_at || new Date().toISOString()
                }));
                
                employee.documents = mappedDocs;
              }
            } catch (docError) {
              console.error(`Error fetching documents for employee ${employee.id}:`, docError);
            }
            return employee;
          })
        );
        
        setEmployees(employeesWithDocs);
        return employeesWithDocs;
      }
      
      return initialEmployees;
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      return initialEmployees;
    }
  }, []);

  // Call fetchEmployees initially
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const newEmployee: Employee = {
        ...employeeData,
        id: uuidv4(),
        status: true, // Default to true (active)
        createdAt: now,
        updatedAt: now
      };
      setEmployees([...employees, newEmployee]);
      return newEmployee;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee> => {
    try {
      const employeeToUpdate = employees.find(emp => emp.id === id);
      
      if (!employeeToUpdate) {
        throw new Error(`Employee with id ${id} not found`);
      }
      
      const updatedEmployee = { 
        ...employeeToUpdate, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      
      setEmployees(employees.map(emp => 
        emp.id === id ? updatedEmployee : emp
      ));
      
      return updatedEmployee;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    try {
      const employeeExists = employees.some(emp => emp.id === id);
      
      if (!employeeExists) {
        return false;
      }
      
      setEmployees(employees.filter(emp => emp.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  };

  const getEmployee = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    fetchEmployees
  };
};
