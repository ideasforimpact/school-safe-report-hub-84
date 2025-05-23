
import React from 'react';
import Layout from '@/components/layout/Layout';
import EmployeesList from '@/components/employee-verification/EmployeesList';
import { FileCheck } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification';

const EmployeeVerificationPage = () => {
  const { fetchEmployees } = useEmployeeVerification();
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <FileCheck className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Employee Verification</h1>
          </div>
          <p className="text-gray-600">Manage and verify employee documents</p>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-lg font-medium mb-4">Employees</h2>
          <EmployeesList />
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeVerificationPage;
