
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import EmployeeDetails from '@/components/employee-verification/EmployeeDetails';
import DocumentsList from '@/components/employee-verification/documents-list';
import Layout from '@/components/layout/Layout';

const EmployeeDetailPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { getEmployee, fetchEmployeeDocuments } = useEmployeeVerification();
  const employee = getEmployee(employeeId || '');

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDocuments(employeeId);
    }
  }, [employeeId, fetchEmployeeDocuments]);

  if (!employee) {
    return (
      <Layout>
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Employee Not Found</h2>
          <p className="text-gray-600 mb-6">The employee you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/employee-verification')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/employee-verification')} 
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{employee.name}</h1>
              <p className="text-gray-500">{employee.position} • {employee.employeeId}</p>
            </div>
          </div>
          
          <Button onClick={() => navigate(`/employee-verification/${employeeId}/upload-document`)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        <div className="bg-white rounded-lg border shadow mb-6">
          <EmployeeDetails employee={employee} />
        </div>
        
        <div className="bg-white rounded-lg border shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Documents</h2>
            <DocumentsList 
              employeeId={employee.id}
              onAddDocument={() => navigate(`/employee-verification/${employeeId}/upload-document`)}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDetailPage;
