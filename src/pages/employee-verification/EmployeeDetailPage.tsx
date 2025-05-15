import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Upload } from 'lucide-react';
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
    fetchDocumentStatuses,
    isLoading
  } = useEmployeeVerification();
  const { toast } = useToast();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Move all hook calls outside of conditional logic
  const employee = getEmployee(employeeId || '');

  // Define all callback functions before any conditional returns
  const handleAddDocument = useCallback(() => {
    if (employeeId) {
      navigate(`/employee-verification/${employeeId}/upload-document`);
    }
  }, [employeeId, navigate]);

  const handleRefreshDocuments = useCallback(async () => {
    if (employeeId && !isRefreshing) {
      setIsRefreshing(true);
      try {
        // Only fetch employee documents when refreshing
        await fetchEmployeeDocuments(employeeId);
        console.log('Documents refreshed for employee:', employeeId);
        
        toast({
          title: "Data Refreshed",
          description: "Employee documents have been refreshed.",
        });
      } catch (error) {
        console.error('Error refreshing documents:', error);
        toast({
          title: "Error",
          description: "Failed to refresh document data.",
          variant: "destructive",
        });
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [employeeId, fetchEmployeeDocuments, toast, isRefreshing]);

  // Fetch data when component mounts - only once
  useEffect(() => {
    if (!employeeId || initialLoadComplete) return;
    
    const loadData = async () => {
      try {
        // Fetch documents and statuses in parallel on initial load
        await Promise.all([
          fetchEmployeeDocuments(employeeId),
          fetchDocumentStatuses()
        ]);
        console.log('Initial data loading complete for employee:', employeeId);
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: "Data Loading Error",
          description: "Failed to load some employee data. Please try refreshing.",
          variant: "destructive"
        });
      }
    };
    
    loadData();
  }, [employeeId, fetchEmployeeDocuments, fetchDocumentStatuses, toast, initialLoadComplete]);

  // Early return for non-existent employee
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
              size="icon"
              onClick={handleRefreshDocuments}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
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
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefreshDocuments}
                disabled={isLoading || isRefreshing}
                className="ml-2"
                aria-label="Refresh documents"
              >
                <RefreshCcw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <DocumentsList 
              employeeId={employee.id}
              onAddDocument={handleAddDocument}
              initialLoadComplete={initialLoadComplete}
            />
          </div>
        </div>
      </div>
    </Layout>;
};

export default EmployeeDetailPage;
