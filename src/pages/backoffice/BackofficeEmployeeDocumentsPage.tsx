
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { backofficeEmployeeService } from '@/services/employee/backofficeEmployeeService';
import { Employee } from '@/types/employeeVerification';
import BackofficeEmployeeDetails from '@/components/backoffice/employee-verification/BackofficeEmployeeDetails';
import BackofficeDocumentsList from '@/components/backoffice/employee-verification/BackofficeDocumentsList';

const BackofficeEmployeeDocumentsPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId && clientId) {
      fetchEmployeeData();
    } else {
      toast({
        title: "Error",
        description: "Employee ID or Client ID is missing",
        variant: "destructive",
      });
      navigate('/backoffice/employee-verification');
    }
  }, [employeeId, clientId]);

  const fetchEmployeeData = async () => {
    if (!employeeId || !clientId) return;

    try {
      setLoading(true);
      const employeeData = await backofficeEmployeeService.fetchEmployeeWithDocuments(employeeId, clientId);
      
      if (!employeeData) {
        toast({
          title: "Employee Not Found",
          description: "The requested employee could not be found",
          variant: "destructive",
        });
        navigate('/backoffice/employee-verification');
        return;
      }

      setEmployee(employeeData);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employee details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/backoffice/employee-verification');
  };

  const handleRefresh = () => {
    fetchEmployeeData();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Employee Not Found</h3>
          <p className="text-gray-500 mb-4">The requested employee could not be found</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employee List
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold">{employee.name}</h1>
                <p className="text-gray-500">
                  {employee.position} • Employee ID: {employee.employeeId}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Back to Employee List
            </Button>
          </div>
        </div>

        {/* Employee Details Card */}
        <BackofficeEmployeeDetails employee={employee} />

        {/* Documents & Verification Section */}
        <BackofficeDocumentsList 
          employee={employee}
          onRefresh={fetchEmployeeData}
        />
      </div>
    </Layout>
  );
};

export default BackofficeEmployeeDocumentsPage;
