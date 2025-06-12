
import { useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '../types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { useLocation } from 'react-router-dom';

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, employeeData } = useAuth();
  const location = useLocation();
  
  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;

  // Stable route detection using useMemo
  const isEmployeeVerificationRoute = useMemo(() => {
    return location.pathname.includes('/employee-verification') || 
           location.pathname.includes('/backoffice/employee-verification');
  }, [location.pathname]);

  // Cache for fetch operations with stable reference
  const fetchCache = useRef<{ timestamp: number; data: Employee[] }>({ timestamp: 0, data: [] });
  const CACHE_DURATION = 30000; // 30 seconds

  // Ref to track ongoing fetch operations to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);
  const isIndividualFetchingRef = useRef(new Set<string>());

  const fetchEmployees = useCallback(async () => {
    // Only fetch if we're on employee verification route and have clientId
    if (!isEmployeeVerificationRoute || !clientId) {
      console.log('Skipping employee fetch - not on employee verification route or no client ID');
      setEmployees([]);
      return [];
    }

    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('Already fetching employees, skipping...');
      return fetchCache.current.data;
    }

    // Check cache first
    const now = Date.now();
    if (fetchCache.current.timestamp && (now - fetchCache.current.timestamp) < CACHE_DURATION) {
      console.log('Using cached employee data');
      setEmployees(fetchCache.current.data);
      return fetchCache.current.data;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    
    try {
      console.log('Fetching employees with documents for client:', clientId);
      
      // First fetch employees for the client
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
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        toast.error('Failed to fetch employees');
        return [];
      }

      if (!employeesData || employeesData.length === 0) {
        console.log('No employees found for client:', clientId);
        const emptyResult: Employee[] = [];
        setEmployees(emptyResult);
        fetchCache.current = { timestamp: now, data: emptyResult };
        return emptyResult;
      }

      // Get all employee IDs to fetch documents
      const employeeIds = employeesData.map(emp => emp.id);

      // Fetch documents for all employees
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
          params,
          employee_docs_log,
          last_otp_generated,
          created_at,
          updated_at,
          document_type:employee_document_type(name, description),
          document_status:document_status(name, description)
        `)
        .in('employee_id', employeeIds);

      if (documentsError) {
        console.error('Error fetching employee documents:', documentsError);
        // Continue without documents rather than failing completely
      }

      // Map employees and attach their documents
      const mappedEmployees: Employee[] = employeesData.map(emp => {
        // Find documents for this employee
        const employeeDocuments = (documentsData || [])
          .filter(doc => doc.employee_id === emp.id)
          .map(doc => {
            let documentUrl = doc.document_url;
            
            // If document_url is a storage path, convert to full URL
            if (documentUrl && !documentUrl.startsWith('data:') && !documentUrl.startsWith('https://')) {
              documentUrl = `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${documentUrl}`;
            }
            
            // Safely handle employee_docs_log with proper type checking
            let employeeDocsLog: Array<{
              timestamp: string;
              action: string;
              response: any;
              notes?: string;
            }> = [];

            if (doc.employee_docs_log && Array.isArray(doc.employee_docs_log)) {
              employeeDocsLog = doc.employee_docs_log.filter(log => 
                log && typeof log === 'object' && 'timestamp' in log && 'action' in log
              ) as Array<{
                timestamp: string;
                action: string;
                response: any;
                notes?: string;
              }>;
            }
            
            return {
              id: doc.id,
              employeeId: doc.employee_id,
              documentTypeId: doc.document_type_id || '',
              documentTypeName: doc.document_type?.name || 'Unknown',
              documentNumber: doc.document_number || '',
              documentImage: documentUrl,
              verificationStatus: (doc.verification_status as 'verified' | 'failed' | 'pending') || 'pending',
              documentStatusId: doc.document_status_id,
              documentStatusName: doc.document_status?.name,
              verificationDate: null,
              verificationNotes: '',
              verificationMethod: 'manual' as const,
              employee_docs_log: employeeDocsLog,
              params: typeof doc.params === 'object' && doc.params !== null ? doc.params as { [key: string]: any; DOB?: string; } : {},
              createdAt: doc.created_at,
              updatedAt: doc.updated_at
            };
          });

        return {
          id: emp.id,
          employeeId: emp.employee_id || '',
          name: `${emp.first_name} ${emp.last_name}`,
          firstName: emp.first_name,
          lastName: emp.last_name,
          email: emp.email,
          phone: '',
          dateOfBirth: '',
          address: '',
          joiningDate: emp.joining_date || new Date().toISOString(),
          department: emp.department || '',
          position: emp.employee_type || '',
          employeeType: (emp.employee_type as Employee['employeeType']) || 'permanent',
          status: emp.status === true,
          createdAt: emp.created_at || new Date().toISOString(),
          updatedAt: emp.updated_at || new Date().toISOString(),
          clientId: emp.client_id,
          isSuperAdmin: emp.is_super_admin,
          documents: employeeDocuments
        };
      });

      console.log(`Fetched ${mappedEmployees.length} employees with their documents`);
      setEmployees(mappedEmployees);
      fetchCache.current = { timestamp: now, data: mappedEmployees };
      return mappedEmployees;
    } catch (error) {
      console.error('Error in fetchEmployees:', error);
      toast.error('Failed to fetch employees');
      return [];
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [clientId, isEmployeeVerificationRoute]);

  // Fetch individual employee by ID - new function for fallback
  const fetchEmployeeById = useCallback(async (employeeId: string): Promise<Employee | null> => {
    if (!clientId) {
      console.log('No client ID available for individual employee fetch');
      return null;
    }

    // Prevent multiple simultaneous fetches for the same employee
    if (isIndividualFetchingRef.current.has(employeeId)) {
      console.log('Already fetching employee:', employeeId);
      return null;
    }

    isIndividualFetchingRef.current.add(employeeId);

    try {
      console.log('Fetching individual employee:', employeeId);
      
      const { data: employeeData, error: employeeError } = await supabase
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
        .eq('id', employeeId)
        .eq('client_id', clientId)
        .single();

      if (employeeError || !employeeData) {
        console.error('Error fetching individual employee:', employeeError);
        return null;
      }

      // Fetch documents for this specific employee
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
          params,
          employee_docs_log,
          last_otp_generated,
          created_at,
          updated_at,
          document_type:employee_document_type(name, description),
          document_status:document_status(name, description)
        `)
        .eq('employee_id', employeeId);

      if (documentsError) {
        console.error('Error fetching employee documents:', documentsError);
      }

      // Map documents with proper type handling
      const employeeDocuments = (documentsData || []).map(doc => {
        let documentUrl = doc.document_url;
        
        if (documentUrl && !documentUrl.startsWith('data:') && !documentUrl.startsWith('https://')) {
          documentUrl = `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${documentUrl}`;
        }
        
        // Safely handle employee_docs_log
        let employeeDocsLog: Array<{
          timestamp: string;
          action: string;
          response: any;
          notes?: string;
        }> = [];

        if (doc.employee_docs_log && Array.isArray(doc.employee_docs_log)) {
          employeeDocsLog = doc.employee_docs_log.filter(log => 
            log && typeof log === 'object' && 'timestamp' in log && 'action' in log
          ) as Array<{
            timestamp: string;
            action: string;
            response: any;
            notes?: string;
          }>;
        }
        
        return {
          id: doc.id,
          employeeId: doc.employee_id,
          documentTypeId: doc.document_type_id || '',
          documentTypeName: doc.document_type?.name || 'Unknown',
          documentNumber: doc.document_number || '',
          documentImage: documentUrl,
          verificationStatus: (doc.verification_status as 'verified' | 'failed' | 'pending') || 'pending',
          documentStatusId: doc.document_status_id,
          documentStatusName: doc.document_status?.name,
          verificationDate: null,
          verificationNotes: '',
          verificationMethod: 'manual' as const,
          employee_docs_log: employeeDocsLog,
          params: typeof doc.params === 'object' && doc.params !== null ? doc.params : {},
          createdAt: doc.created_at,
          updatedAt: doc.updated_at
        };
      });

      const employee: Employee = {
        id: employeeData.id,
        employeeId: employeeData.employee_id || '',
        name: `${employeeData.first_name} ${employeeData.last_name}`,
        firstName: employeeData.first_name,
        lastName: employeeData.last_name,
        email: employeeData.email,
        phone: '',
        dateOfBirth: '',
        address: '',
        joiningDate: employeeData.joining_date || new Date().toISOString(),
        department: employeeData.department || '',
        position: employeeData.employee_type || '',
        employeeType: (employeeData.employee_type as Employee['employeeType']) || 'permanent',
        status: employeeData.status === true,
        createdAt: employeeData.created_at || new Date().toISOString(),
        updatedAt: employeeData.updated_at || new Date().toISOString(),
        clientId: employeeData.client_id,
        isSuperAdmin: employeeData.is_super_admin,
        documents: employeeDocuments
      };

      // Add this employee to the employees list if not already there
      setEmployees(prev => {
        const exists = prev.find(emp => emp.id === employee.id);
        if (!exists) {
          return [...prev, employee];
        }
        return prev;
      });

      return employee;
    } catch (error) {
      console.error('Error fetching individual employee:', error);
      return null;
    } finally {
      isIndividualFetchingRef.current.delete(employeeId);
    }
  }, [clientId]);

  const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!clientId) {
      toast.error('No client context available');
      throw new Error('No client context available');
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          employee_id: employeeData.employeeId,
          first_name: employeeData.name.split(' ')[0],
          last_name: employeeData.name.split(' ').slice(1).join(' '),
          email: employeeData.email,
          department: employeeData.department,
          employee_type: employeeData.employeeType,
          joining_date: employeeData.joiningDate,
          status: employeeData.status,
          client_id: clientId
        }])
        .select()
        .single();

      if (error) throw error;

      const newEmployee: Employee = {
        id: data.id,
        employeeId: data.employee_id,
        name: `${data.first_name} ${data.last_name}`,
        department: data.department,
        employeeType: data.employee_type as 'permanent' | 'contract' | 'temporary' | 'part_time' | 'consultant' | 'intern',
        joiningDate: data.joining_date,
        status: data.status,
        clientId: data.client_id,
        email: data.email,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setEmployees(prev => [newEmployee, ...prev]);
      toast.success('Employee added successfully');
      return newEmployee;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
      throw error;
    }
  }, [clientId]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    try {
      const dbUpdates: any = {};
      
      if (updates.name) {
        const nameParts = updates.name.split(' ');
        dbUpdates.first_name = nameParts[0];
        dbUpdates.last_name = nameParts.slice(1).join(' ');
      }
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.department) dbUpdates.department = updates.department;
      if (updates.employeeType) dbUpdates.employee_type = updates.employeeType;
      if (updates.joiningDate) dbUpdates.joining_date = updates.joiningDate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { data, error } = await supabase
        .from('employees')
        .update(dbUpdates)
        .eq('id', id)
        .eq('client_id', clientId)
        .select()
        .single();

      if (error) throw error;

      const updatedEmployee: Employee = {
        id: data.id,
        employeeId: data.employee_id,
        name: `${data.first_name} ${data.last_name}`,
        department: data.department,
        employeeType: data.employee_type as 'permanent' | 'contract' | 'temporary' | 'part_time' | 'consultant' | 'intern',
        joiningDate: data.joining_date,
        status: data.status,
        clientId: data.client_id,
        email: data.email,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setEmployees(prev => prev.map(emp => emp.id === id ? updatedEmployee : emp));
      toast.success('Employee updated successfully');
      return updatedEmployee;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
      throw error;
    }
  }, [clientId]);

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) throw error;

      setEmployees(prev => prev.filter(emp => emp.id !== id));
      toast.success('Employee deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
      return false;
    }
  }, [clientId]);

  const getEmployee = useCallback((id: string) => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  return {
    employees,
    isLoading,
    fetchEmployees,
    fetchEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee
  };
};
