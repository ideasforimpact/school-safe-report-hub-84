
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import EmployeesList from '@/components/employee-verification/EmployeesList';
import FilterBar from '@/components/employee-verification/filters/FilterBar';
import { FileCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';

const EmployeeVerificationPage = () => {
  const { fetchEmployees, employees } = useEmployeeVerification();
  const [searchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const realtimeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [documentStatusFilter, setDocumentStatusFilter] = useState('all');

  // Filter employees based on all criteria
  // Helper function to get overall status based on priority logic
  const getOverallStatus = (employee) => {
    const documents = employee.documents || [];
    if (documents.length === 0) return 'no-documents';
    
    const verified = documents.filter(doc => doc.verificationStatus === 'verified' || doc.verificationStatus === 'completed');
    const failed = documents.filter(doc => doc.verificationStatus === 'failed');
    const pending = documents.filter(doc => doc.verificationStatus === 'pending' || doc.verificationStatus === 'in-progress');
    
    // Priority-based status logic: Failed > Pending > Verified
    // If ANY document failed → Overall status is "Failed"
    // If no failures but ANY pending → Overall status is "Pending"  
    // If ALL documents verified → Overall status is "Verified"
    if (failed.length > 0) {
      return 'failed';
    } else if (pending.length > 0) {
      return 'pending';
    } else {
      return 'verified';
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          employee.name.toLowerCase().includes(searchLower) ||
          employee.email.toLowerCase().includes(searchLower) ||
          employee.employeeId.toLowerCase().includes(searchLower) ||
          (employee.address && employee.address.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Document status filter based on overall status
      if (documentStatusFilter !== 'all') {
        const overallStatus = getOverallStatus(employee);
        
        // Filter based on overall status, not individual document status
        if (documentStatusFilter !== overallStatus) {
          return false;
        }
      }

      return true;
    });
  }, [employees, searchTerm, documentStatusFilter]);

  // Parse URL parameters and set initial filters
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      console.log('🔍 Employee Verification - URL filter parameter found:', filterParam);
      
      // Map filter parameter to document status filter
      let initialStatus = '';
      switch (filterParam) {
        case 'verified':
          initialStatus = 'verified';
          break;
        case 'pending':
          initialStatus = 'pending';
          break;
        case 'failed':
          initialStatus = 'failed';
          break;
        default:
          initialStatus = '';
      }
      
      if (initialStatus) {
        console.log('🎯 Setting initial document status filter to:', initialStatus);
        setDocumentStatusFilter(initialStatus);
      }
    }
  }, [searchParams]);

  // Fetch employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);
  
  const handleRefresh = async () => {
  setIsRefreshing(true);

  await Promise.all([
    fetchEmployees(),
    new Promise((resolve) => setTimeout(resolve, 500))
  ]);

  setIsRefreshing(false);
};

  const handleClearFilters = () => {
    setSearchTerm('');
    setDocumentStatusFilter('all');
  };
  const employeeAnalyticsStats = useMemo(() => {
    const totalEmployees = employees.length;

    const verifiedEmployees = employees.filter(
      (employee) => getOverallStatus(employee) === 'verified'
    ).length;

    return {
      totalEmployees,
      verifiedEmployees,
    };
  }, [employees]);


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

            <div className="flex gap-80">
              <div className='ms-16 '>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {employeeAnalyticsStats.totalEmployees}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Verified Employees</p>
                <p className="text-3xl font-semibold text-green-600">
                  {employeeAnalyticsStats.verifiedEmployees}
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
            onClearFilters={handleClearFilters}
            resultCount={filteredEmployees.length}
            totalCount={employees.length}
          />
          
          <EmployeesList
            employees={filteredEmployees}
          />
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeVerificationPage;
