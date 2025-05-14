
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import EmployeeDetails from '@/components/employee-verification/EmployeeDetails';
import DocumentsList from '@/components/employee-verification/documents-list';
import Layout from '@/components/layout/Layout';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const EmployeeDetailPage = () => {
  const {
    employeeId
  } = useParams<{
    employeeId: string;
  }>();
  const navigate = useNavigate();
  const {
    getEmployee,
    fetchEmployeeDocuments,
    isLoading
  } = useEmployeeVerification();
  const { toast } = useToast();
  const employee = getEmployee(employeeId || '');

  // Fetch data when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (employeeId) {
        try {
          await fetchEmployeeDocuments(employeeId);
          console.log('Initial data loading complete for employee:', employeeId);
        } catch (error) {
          console.error('Error loading initial data:', error);
          
          // Extract error message for better user feedback
          let errorMessage = "Failed to load some employee data. Please try refreshing.";
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = String(error.message);
          }
          
          toast({
            title: "Data Loading Error",
            description: errorMessage,
            variant: "destructive"
          });
        }
      }
    };
    
    loadData();
  }, [employeeId, fetchEmployeeDocuments, toast]);

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

  const handleAddDocument = () => {
    navigate(`/employee-verification/${employeeId}/upload-document`);
  };

  const handleRefreshDocuments = async () => {
    if (employeeId) {
      try {
        await fetchEmployeeDocuments(employeeId);
        
        toast({
          title: "Data Refreshed",
          description: "Documents have been refreshed.",
        });
      } catch (error) {
        console.error('Error refreshing data:', error);
        
        // Extract error message for better user feedback
        let errorMessage = "Failed to refresh data.";
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage = String(error.message);
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  return <Layout>
      <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center mb-4 sm:mb-0">
            <Button variant="ghost" size="sm" onClick={() => navigate('/employee-verification')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-left">{employee.name}</h1>
              <p className="text-gray-500">{employee.position} • {employee.employeeId}</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshDocuments}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button onClick={handleAddDocument} className="shadow-md">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6">
            <EmployeeDetails employee={employee} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <h2 className="font-semibold text-xl whitespace-nowrap">Documents & Verification</h2>
                <Separator className="flex-grow ml-4" />
              </div>
            </div>
            
            <DocumentsList employeeId={employee.id} onAddDocument={handleAddDocument} />
          </div>
        </div>
      </div>
    </Layout>;
};

export default EmployeeDetailPage;
