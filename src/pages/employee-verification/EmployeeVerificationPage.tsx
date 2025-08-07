
import React, { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import EmployeesList from '@/components/employee-verification/EmployeesList';
import FilterBar from '@/components/employee-verification/filters/FilterBar';
import { FileCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';

const EmployeeVerificationPage = () => {
  const { fetchEmployees, employees } = useEmployeeVerification();
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [documentStatusFilter, setDocumentStatusFilter] = useState('all');

  // Filter employees based on all criteria
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

      // Document status filter
      if (documentStatusFilter !== 'all') {
        const documents = employee.documents || [];
        
        if (documentStatusFilter === 'no-documents') {
          if (documents.length > 0) return false;
        } else if (documentStatusFilter === 'verified') {
          if (documents.length === 0) return false;
          const verified = documents.filter(doc => doc.verificationStatus === 'verified' || doc.verificationStatus === 'completed');
          if (verified.length === 0) return false;
        } else if (documentStatusFilter === 'pending') {
          if (documents.length === 0) return false;
          const pending = documents.filter(doc => doc.verificationStatus === 'pending');
          if (pending.length === 0) return false;
        } else if (documentStatusFilter === 'failed') {
          if (documents.length === 0) return false;
          const failed = documents.filter(doc => doc.verificationStatus === 'failed');
          if (failed.length === 0) return false;
        }
      }

      return true;
    });
  }, [employees, searchTerm, documentStatusFilter]);

  // Fetch employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);
  
  const handleRefresh = () => {
    fetchEmployees();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDocumentStatusFilter('all');
  };

  return (
    <Layout>
      <div className="w-full py-6">
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100 mx-6">
          <div className="flex items-center space-x-4">
            <FileCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-left">Employee Verification</h1>
              <p className="text-gray-500 text-sm text-left">Manage and verify employee documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              title="Refresh employees"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
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
