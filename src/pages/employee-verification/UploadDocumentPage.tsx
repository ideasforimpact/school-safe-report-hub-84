
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import AddDocumentForm from '@/components/employee-verification/AddDocumentForm';
import Layout from '@/components/layout/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/employeeVerification';

const UploadDocumentPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { getEmployee } = useEmployeeVerification();
  const { state } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();

  const [localEmployee, setLocalEmployee] = useState<Employee | null>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);
  const loadStartedRef = useRef(false);

  const clientId =
    state.activeClientId ||
    state.clientId ||
    (authEmployeeData as any)?.clientId ||
    (user as any)?.clientId;

  useEffect(() => {
    if (!employeeId || loadStartedRef.current) return;

    // Check context first — no network call needed
    const contextEmployee = getEmployee(employeeId);
    if (contextEmployee) {
      setLocalEmployee(contextEmployee);
      setIsLoadingEmployee(false);
      return;
    }

    if (!clientId) {
      setIsLoadingEmployee(false);
      return;
    }

    // Fetch ONLY this specific employee via get_employee — never the full list
    loadStartedRef.current = true;
    supabase.functions
      .invoke('employee-management', {
        body: { operation: 'get_employee', employeeId, clientId },
      })
      .then(({ data, error }) => {
        if (!error && data?.employee) {
          const rec = data.employee;
          const dept = rec.department;
          const empType = rec.employee_type;
          setLocalEmployee({
            id: rec.id,
            employeeId: rec.employee_id || '',
            name: `${rec.first_name || ''} ${rec.last_name || ''}`.trim(),
            firstName: rec.first_name || '',
            lastName: rec.last_name || '',
            email: rec.email || '',
            phone: rec.phone || '',
            designation: rec.designation || '',
            dateOfBirth: '',
            address: '',
            joiningDate: rec.joining_date || new Date().toISOString(),
            department: typeof dept === 'object' && dept ? dept.department_name || '' : dept || '',
            position: typeof empType === 'object' && empType ? empType.type_name || '' : empType || '',
            employeeType: (typeof empType === 'object' && empType ? empType.type_name : empType) as any || 'permanent',
            status: rec.status === true,
            createdAt: rec.created_at || new Date().toISOString(),
            updatedAt: rec.updated_at || new Date().toISOString(),
            clientId: rec.client_id,
            isSuperAdmin: rec.is_super_admin,
            documents: [],
          });
        }
      })
      .finally(() => setIsLoadingEmployee(false));
  }, [employeeId, clientId, getEmployee]);

  const employee = localEmployee || getEmployee(employeeId || '');

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
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
    </Layout>;
  }

  if (isReadOnlySwitchedContext) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
          <Alert className="mb-6">
            <AlertTitle>Read-only access</AlertTitle>
            <AlertDescription>
              You can view employee documents in this client, but uploading is disabled for read-only access.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate(`/employee-verification/${employeeId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employee Details
          </Button>
        </div>
      </Layout>
    );
  }

  const handleSuccess = () => {
    navigate(`/employee-verification/${employeeId}/upload-document`);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
        <div className="flex items-center mb-8 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/employee-verification/${employeeId}`)} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
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
