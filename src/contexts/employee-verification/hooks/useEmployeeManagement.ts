import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Employee, VerificationDocument } from '../types';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getIsBackofficeUser } from '@/store/authSelectors';
import { useSafeClient } from '@/hooks/useSafeClient';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeListFilters {
  search?: string;
  departmentId?: string;
  documentTypeId?: string;
  documentStatus?: string;
}

const PAGE_SIZE = 10;

const mapEdgeEmployeeToEmployee = (record: any): Employee => {
  const department = record.department;
  const departmentName = typeof department === 'object' && department !== null
    ? department.department_name || ''
    : department || '';

  const employeeType = record.employee_type;
  const typeName = typeof employeeType === 'object' && employeeType !== null
    ? employeeType.type_name || ''
    : employeeType || '';

  const documents: VerificationDocument[] = (record.documentSummaries || []).map((doc: any) => ({
    id: doc.id,
    employeeId: record.id,
    documentTypeId: doc.documentTypeId || '',
    documentTypeName: doc.documentTypeName || 'Unknown',
    documentNumber: '',
    documentImage: '',
    verificationStatus: (doc.verificationStatus as 'verified' | 'failed' | 'pending') || 'pending',
    verificationMethod: 'manual' as const,
    personalInfo: doc.personalInfo || undefined,
    employee_docs_log: [],
    params: {},
    cronActivate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return {
    id: record.id,
    employeeId: record.employee_id || '',
    name: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
    firstName: record.first_name || '',
    lastName: record.last_name || '',
    email: record.email || '',
    phone: record.phone || '',
    designation: record.designation || '',
    dateOfBirth: '',
    address: '',
    joiningDate: record.joining_date || new Date().toISOString(),
    department: departmentName,
    position: typeName,
    employeeType: typeName,
    status: record.status === true,
    createdAt: record.created_at || new Date().toISOString(),
    updatedAt: record.updated_at || new Date().toISOString(),
    isSuperAdmin: record.is_super_admin,
    isCpdInvolved: record.is_cpd_involved === true,
    documents,
    clientId: record.client_id,
    profileDocuments: Array.isArray(record.documents) ? record.documents : [],
  } as Employee;
};

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalEmployeesCount, setTotalEmployeesCount] = useState(0);
  const [verifiedEmployeesCount, setVerifiedEmployeesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { state } = useEmployeeStore();
  const { client } = useSafeClient();
  
  // Get authentication state from Redux
  const isBackofficeUser = getIsBackofficeUser(state);

  const lastFiltersRef = useRef<EmployeeListFilters>({});
  const lastPageRef = useRef(1);
  const statsLoadedRef = useRef(false);
  // Latest getClientId — updated every render so fetchEmployees (stable ref) always reads current value
  const getClientIdRef = useRef<() => string | null>(() => null);
  // Incremented on each call; lets us discard stale responses when a newer call wins
  const requestIdRef = useRef(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Keep ref in sync without making it a fetchEmployees dependency
  const getClientId = useCallback(() => {
    if (isBackofficeUser && client?.id) return client.id;
    return state.activeClientId || state.clientId || null;
  }, [isBackofficeUser, client?.id, state.activeClientId, state.clientId]);
  getClientIdRef.current = getClientId;

  // fetchEmployees has NO external dependencies → stable reference forever.
  // This prevents the filter-change useEffect in the page from re-firing whenever
  // Redux/auth state changes (which would previously create a duplicate list call).
  const fetchEmployees = useCallback(async (
    filters?: EmployeeListFilters,
    page?: number
  ): Promise<Employee[]> => {
    const clientId = getClientIdRef.current();

    if (!clientId) {
      setEmployees([]);
      return [];
    }

    const effectiveFilters = filters !== undefined ? filters : lastFiltersRef.current;
    const effectivePage = page !== undefined ? page : lastPageRef.current;

    if (filters !== undefined) lastFiltersRef.current = filters;
    if (page !== undefined) lastPageRef.current = page;

    // Stamp this call; if a newer call arrives before we finish, we discard our result
    const myRequestId = ++requestIdRef.current;

    setIsLoading(true);
    try {
      const includeStats = !statsLoadedRef.current;

      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: {
          operation: 'list',
          clientId,
          page: effectivePage,
          pageSize: PAGE_SIZE,
          includeStats,
          filters: {
            search: effectiveFilters.search || '',
            departmentId: effectiveFilters.departmentId || 'all',
            documentTypeId: effectiveFilters.documentTypeId || 'all',
            documentStatus: effectiveFilters.documentStatus || 'all',
          },
        },
      });

      // A newer call already completed — discard this stale response
      if (myRequestId !== requestIdRef.current) return [];

      if (error) throw new Error(error.message || 'Failed to fetch employees');

      const mapped: Employee[] = (data.employees || []).map(mapEdgeEmployeeToEmployee);

      setEmployees(mapped);
      setCurrentPage(effectivePage);
      setTotalCount(data.total || 0);

      if (data.stats) {
        setTotalEmployeesCount(data.stats.totalEmployees || 0);
        setVerifiedEmployeesCount(data.stats.verifiedEmployees || 0);
        statsLoadedRef.current = true;
      }

      return mapped;
    } catch (error) {
      if (myRequestId !== requestIdRef.current) return [];
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
      setEmployees([]);
      return [];
    } finally {
      if (myRequestId === requestIdRef.current) setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — reads latest values via refs

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
  }, []);

  const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    throw new Error('Add employee functionality not implemented');
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    // Implementation for deleting employees would go here
    console.log('Delete employee not implemented yet:', id);
    throw new Error('Delete employee functionality not implemented');
  }, []);

  const getEmployee = useCallback((id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  return {
    employees,
    isLoading,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    currentPage,
    setCurrentPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
    totalEmployeesCount,
    verifiedEmployeesCount,
  };
};
