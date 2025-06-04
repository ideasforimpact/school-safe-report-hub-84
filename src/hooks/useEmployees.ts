
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  employee_id: string;
  employee_type: string;
  status: boolean;
  client_id: string;
  is_super_admin: boolean;
  user_id: string;
  joining_date: string;
  created_at: string;
  updated_at: string;
  documents?: Array<{
    id: string;
    document_type_id: string;
    document_status_id: string;
    document_url: string;
    document_number: string;
    verification_status: string;
    document_type?: {
      name: string;
      description: string;
    };
    document_status?: {
      name: string;
      description: string;
    };
  }>;
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        
        // First fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select(`
            id,
            employee_id,
            first_name,
            last_name,
            email,
            employee_type,
            department,
            status,
            client_id,
            is_super_admin,
            user_id,
            joining_date,
            created_at,
            updated_at
          `)
          .eq('status', true)
          .order('created_at', { ascending: false });

        if (employeesError) throw employeesError;

        if (!employeesData || employeesData.length === 0) {
          setEmployees([]);
          return;
        }

        // Fetch documents for all employees
        const employeeIds = employeesData.map(emp => emp.id);
        const { data: documentsData, error: documentsError } = await supabase
          .from('employee_documents')
          .select(`
            id,
            employee_id,
            document_type_id,
            document_status_id,
            document_url,
            document_number,
            verification_status,
            document_type:employee_document_type(name, description),
            document_status:document_status(name, description)
          `)
          .in('employee_id', employeeIds);

        if (documentsError) {
          console.error('Error fetching documents:', documentsError);
          // Continue without documents if there's an error
        }

        // Group documents by employee_id
        const documentsByEmployee = (documentsData || []).reduce((acc, doc) => {
          if (!acc[doc.employee_id]) {
            acc[doc.employee_id] = [];
          }
          acc[doc.employee_id].push(doc);
          return acc;
        }, {} as Record<string, any[]>);

        // Combine employees with their documents
        const employeesWithDocuments = employeesData.map(employee => ({
          ...employee,
          documents: documentsByEmployee[employee.id] || []
        }));
        
        setEmployees(employeesWithDocuments);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return { employees, loading, error };
};
