
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import AddDocumentForm from '@/components/employee-verification/AddDocumentForm';
import Layout from '@/components/layout/Layout';

const UploadDocumentPage = () => {
  const {
    employeeId
  } = useParams<{
    employeeId: string;
  }>();
  const navigate = useNavigate();
  const { getEmployee, fetchEmployees } = useEmployeeVerification();
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);
  
  const employee = getEmployee(employeeId || '');

  // Fetch employees if not already loaded or if employee not found
  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!employee && employeeId) {
        setIsLoadingEmployee(true);
        try {
          await fetchEmployees();
        } catch (error) {
          console.error('Error fetching employees:', error);
        } finally {
          setIsLoadingEmployee(false);
        }
      } else {
        setIsLoadingEmployee(false);
      }
    };

    loadEmployeeData();
  }, [employeeId, employee, fetchEmployees]);

  // Show loading state while fetching employee data
  if (isLoadingEmployee) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading employee data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return <Layout>
      <div className="p-8 text-left">
        <h2 className="text-2xl font-bold mb-4">Employee Not Found</h2>
        <p className="text-gray-600 mb-6">The employee you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/employee-verification')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
      </div>
    </Layout>;
  }

  const handleSuccess = () => {
    navigate(`/employee-verification/${employeeId}`);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
        <div className="flex items-center mb-8 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/employee-verification/${employeeId}`)} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-left">Upload Document</h1>
            <p className="text-gray-500">For {employee.name} • {employee.employeeId}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6">
            <AddDocumentForm employeeId={employeeId || ''} onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UploadDocumentPage;
