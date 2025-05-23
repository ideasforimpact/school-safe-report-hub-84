
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import AddDocumentForm from '@/components/employee-verification/AddDocumentForm';
import Layout from '@/components/layout/Layout';

const UploadDocumentPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { getEmployee, fetchDocumentTypes } = useEmployeeVerification();
  const employee = getEmployee(employeeId || '');

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

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

  const handleSuccess = () => {
    navigate(`/employee-verification/${employeeId}`);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/employee-verification/${employeeId}`)} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Upload Document</h1>
            <p className="text-gray-500">For {employee.name} • {employee.employeeId}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow">
          <div className="p-6">
            <AddDocumentForm employeeId={employeeId || ''} onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UploadDocumentPage;
