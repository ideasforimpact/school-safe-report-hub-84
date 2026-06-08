
import { useEffect, useState, useCallback, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import EmployeesList from '@/components/employee-verification/EmployeesList';
import FilterBar from '@/components/employee-verification/filters/FilterBar';
import { FileCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import Loader from "@/components/common/Loader";
import type { EmployeeListFilters } from '@/contexts/employee-verification/types';

const EmployeeVerificationPage = () => {
  const {
    fetchEmployees,
    employees,
    totalEmployeesCount,
    verifiedEmployeesCount,
    isLoading,
  } = useEmployeeVerification();

  const [searchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const realtimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all'); // stores department UUID or 'all'
  const [documentStatusFilter, setDocumentStatusFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');

  // Keep a stable ref of current filters for realtime handler
  const currentFiltersRef = useRef<EmployeeListFilters>({});

  const buildFilters = useCallback((
    search: string,
    deptId: string,
    docType: string,
    docStatus: string
  ): EmployeeListFilters => ({
    search: search || '',
    departmentId: deptId !== 'all' ? deptId : undefined,
    documentTypeId: docType !== 'all' ? docType : undefined,
    documentStatus: docStatus !== 'all' ? docStatus : undefined,
  }), []);

  const doFetch = useCallback((filters: EmployeeListFilters, page: number) => {
    currentFiltersRef.current = filters;
    fetchEmployees(filters, page);
  }, [fetchEmployees]);

  // Initial load and filter changes — reset to page 1
  // Search is debounced; other filters apply immediately
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const filters = buildFilters(searchTerm, departmentFilter, documentTypeFilter, documentStatusFilter);
      doFetch(filters, 1);
    }, searchTerm ? 350 : 0);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchTerm, departmentFilter, documentTypeFilter, documentStatusFilter, buildFilters, doFetch]);

  // Parse URL filter param on mount
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && ['verified', 'pending', 'failed'].includes(filterParam)) {
      setDocumentStatusFilter(filterParam);
    }
  }, [searchParams]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEmployees(currentFiltersRef.current);
    setIsRefreshing(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDocumentStatusFilter('all');
    setDocumentTypeFilter('all');
    setDepartmentFilter('all');
  };

  const lastPageRefetchRef = useRef<number>(0);
  const PAGE_REFETCH_COOLDOWN_MS = 3000;

  const handleEmployeesRealtime = useCallback(() => {
    if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current);
    realtimeTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastPageRefetchRef.current < PAGE_REFETCH_COOLDOWN_MS) return;
      lastPageRefetchRef.current = now;
      fetchEmployees(currentFiltersRef.current);
    }, 800);
  }, [fetchEmployees]);


  useRealTimeSubHook({
    channelName: 'employees-realtime',
    table: 'employees',
    events: '*',
    enabled: true,
    onPayload: handleEmployeesRealtime,
  });
  useRealTimeSubHook({
    channelName: 'employee-documents-realtime',
    table: 'employee_documents',
    events: '*',
    enabled: true,
    onPayload: handleEmployeesRealtime,
  });
  return (
    <Layout>
      <div className="w-full py-6">
        <div className="bg-gradient-to-r from-blue-50 to-transparent mb-8 rounded-xl border border-gray-200 p-6 mx-6">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>

                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Employee Verification
                  </h1>
                  <p className="text-sm text-gray-500">
                    Manage and verify employee documents
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                title="Refresh employees"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>

            <div className="flex gap-80">
              <div className='ms-16 '>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-3xl font-semibold text-gray-900">{totalEmployeesCount}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Verified Employees</p>
                <p className="text-3xl font-semibold text-green-600">{verifiedEmployeesCount}</p>
              </div>
            </div>

          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          <h2 className="text-lg font-medium mb-4 text-left">Employees</h2>

          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            documentStatusFilter={documentStatusFilter}
            onDocumentStatusChange={setDocumentStatusFilter}
            documentTypeFilter={documentTypeFilter}
            onDocumentTypeChange={setDocumentTypeFilter}
            onClearFilters={handleClearFilters}
            departmentFilter={departmentFilter}
            onDepartmentChange={setDepartmentFilter}
          />

          {!isLoading && (
            <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
              <span>
                Showing {employees.length} of {totalEmployeesCount} employees
              </span>
              {(searchTerm !== '' || departmentFilter !== 'all' || documentStatusFilter !== 'all' || documentTypeFilter !== 'all') && (
                <span className="text-primary">Filters applied</span>
              )}
            </div>
          )}
          {isLoading ? (
            <Loader text="Loading employees..." />
          ) : (
            <EmployeesList employees={employees} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeVerificationPage;
