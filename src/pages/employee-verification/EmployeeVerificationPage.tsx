
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import EmployeesList from '@/components/employee-verification/EmployeesList';
import { FileCheck, BarChart2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';

const EmployeeVerificationPage = () => {
  const { fetchEmployees, employees } = useEmployeeVerification();
  
  // Fetch employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);
  
  const handleRefresh = () => {
    fetchEmployees();
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-4">
            <FileCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-left">Employee Verification</h1>
              <p className="text-gray-500 text-sm text-left">Manage and verify employee documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="flex items-center gap-2">
              <Link to="/employee-verification/dashboard">
                <BarChart2 className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </Button>
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

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-medium mb-4 text-left">Employees</h2>
          <EmployeesList />
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeVerificationPage;
