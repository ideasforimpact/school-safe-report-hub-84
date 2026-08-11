
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import EmployeesList from '@/components/employee-verification/EmployeesList';
import FilterBar from '@/components/employee-verification/filters/FilterBar';
import { FileCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import Loader from "@/components/common/Loader";

const EmployeeVerificationPage = () => {
  const {
    fetchEmployees,
    employees,
    totalEmployeesCount,
    verifiedEmployeesCount,
    unverifiedEmployeesCount,
    noDocumentsEmployeesCount,
  } = useEmployeeVerification();
  const [searchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const realtimeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  // Read the initial status straight from the URL so the very first fetch already uses
  // it — setting it later in an effect caused a race where an unfiltered "all employees"
  // fetch fired first and only settled to "pending" (etc.) on the next render.
  const [documentStatusFilter, setDocumentStatusFilter] = useState(() => {
    const filterParam = searchParams.get('filter');
    return filterParam === 'verified' || filterParam === 'pending' || filterParam === 'failed'
      ? filterParam
      : 'all';
  });
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const departments = useMemo(() => {
    const uniqueDepartments = new Set(
      employees
        .map((emp) => emp.department)
        .filter(Boolean)
    );

    return Array.from(uniqueDepartments);
  }, [employees]);

  // Filtering (search, department, document type, document status) is applied server-side
  // by fetchEmployees below. Re-filtering here was not just redundant but actively broken
  // for department: employee.department holds the department NAME while departmentFilter
  // holds its UUID, so the comparison never matched and picking a department emptied the
  // whole list even though the server had already returned the right employees.
  const filteredEmployees = employees;

  // Re-fetch from the server whenever a filter changes, resetting to page 1. Filtering
  // must happen server-side (not just on the currently loaded page) — otherwise matches
  // like "pending" get scattered across pages instead of appearing together.
  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      await fetchEmployees({
        search: searchTerm,
        departmentId: departmentFilter,
        documentTypeId: documentTypeFilter,
        documentStatus: documentStatusFilter,
      }, 1);
      setLoading(false);
    };

    loadEmployees();
  }, [fetchEmployees, searchTerm, departmentFilter, documentTypeFilter, documentStatusFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLoading(true);

  await Promise.all([
    fetchEmployees(),
    new Promise((resolve) => setTimeout(resolve, 500))
  ]);
    setLoading(false);
    setIsRefreshing(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDocumentStatusFilter('all');
    setDocumentTypeFilter('all');
    setDepartmentFilter('all');
  };
  // Global counts across all pages — not just the currently loaded page of `employees`.
  const employeeAnalyticsStats = {
    totalEmployees: totalEmployeesCount,
    verifiedEmployees: verifiedEmployeesCount,
    unverifiedEmployees: unverifiedEmployeesCount,
    noDocumentsEmployees: noDocumentsEmployeesCount,
  };


  const handleEmployeesRealtime = useCallback(() => {
    if (realtimeTimeoutRef.current) {
      clearTimeout(realtimeTimeoutRef.current);
    }

    realtimeTimeoutRef.current = setTimeout(() => {
      fetchEmployees();
    }, 300);
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

            <div className="flex justify-between px-16">
              <div className="text-left">
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {employeeAnalyticsStats.totalEmployees}
                </p>
              </div>

              <div className="text-left">
                <p className="text-sm text-gray-500">Verified Employees</p>
                <p className="text-3xl font-semibold text-green-600">
                  {employeeAnalyticsStats.verifiedEmployees}
                </p>
              </div>

              <div className="text-left">
                <p className="text-sm text-gray-500">Unverified Employees</p>
                <p className="text-3xl font-semibold text-amber-600">
                  {employeeAnalyticsStats.unverifiedEmployees}
                </p>
              </div>

              <div className="text-left">
                <p className="text-sm text-gray-500">No Documents Submitted</p>
                <p className="text-3xl font-semibold text-red-600">
                  {employeeAnalyticsStats.noDocumentsEmployees}
                </p>
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
            departments={departments}
            resultCount={filteredEmployees.length}
            totalCount={employees.length}
          />
          
          {loading ? (
            <Loader text="Loading employees..." />
          ) : (
            <EmployeesList employees={filteredEmployees} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeVerificationPage;
