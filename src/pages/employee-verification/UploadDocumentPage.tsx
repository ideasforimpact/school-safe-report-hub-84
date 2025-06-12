
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
  const { getEmployee, fetchDocumentTypes, fetchEmployeeById, isLoading } = useEmployeeVerification();
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);
  
  // Use refs to track fetch attempts and prevent multiple fetches
  const employeeFetchAttemptedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const employee = getEmployee(employeeId || '');

  // Fetch employee data if not found and not already attempted
  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!employeeId || employee || employeeFetchAttemptedRef.current || isFetchingRef.current) {
        return;
      }
      
      console.log('Employee not found in context, attempting to fetch employee data...');
      isFetchingRef.current = true;
      setIsLoadingEmployee(true);
      employeeFetchAttemptedRef.current = true;
      
      try {
        await fetchEmployeeById(employeeId);
      } catch (error) {
        console.error('Error fetching employee data:', error);
      } finally {
        setIsLoadingEmployee(false);
        isFetchingRef.current = false;
      }
    };

    loadEmployeeData();
  }, [employeeId, employee]); // Removed fetchEmployeeById from dependencies to prevent infinite loop

  // Fetch document types once when the page loads
  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  // Show loading state while fetching employee data
  if (isLoading || isLoadingEmployee) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading employee data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Only show "Employee Not Found" after we've attempted to fetch the data
  if (!employee && employeeFetchAttemptedRef.current && !isLoadingEmployee) {
    return (
      <Layout>
        <div className="p-8 text-left">
          <h2 className="text-2xl font-bold mb-4">Employee Not Found</h2>
          <p className="text-gray-600 mb-6">The employee you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/employee-verification')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
        </div>
      </Layout>
    );
  }

  // Show loading if we still don't have employee data and haven't attempted fetch yet
  if (!employee && !employeeFetchAttemptedRef.current) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
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
            <p className="text-gray-500">For {employee?.name} • {employee?.employeeId}</p>
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
