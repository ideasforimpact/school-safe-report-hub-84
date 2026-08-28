
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Upload, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import EmployeeDetails from '@/components/employee-verification/EmployeeDetails';
import DocumentsList from '@/components/employee-verification/documents-list';
import Layout from '@/components/layout/Layout';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Employee, VerificationDocument } from '@/types/employeeVerification';
import { fetchEmployeeVerificationData, fetchEmployeeDocuments } from '@/services/employee/employeeVerificationService';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { capitalizeWords } from '@/lib/formatUtils';
import Loader from '@/components/common/Loader';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

const EmployeeDetailPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { fetchDocumentStatuses, fetchEmployees } = useEmployeeVerification();
  const { toast } = useToast();
  const { user, employeeData } = useAuth();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframeFilter, setTimeframeFilter] = useState<string | undefined>(undefined);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [isDocumentRefreshing, setIsDocumentRefreshing] = useState(false);

  const realtimeDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  // Ref guard: set synchronously before async starts to prevent concurrent initial loads
  const initialLoadStartedRef = React.useRef(false);
  // Tracks the last time refetchDocuments ran (any trigger). Automatic callers (realtime,
  // post-verification callbacks) are suppressed within a 3s cooldown window so that a
  // single verification that makes multiple DB writes only results in one network call.
  const lastRefetchTimeRef = React.useRef<number>(0);
  const REFETCH_COOLDOWN_MS = 3000;
  // Cooldown: after a realtime-triggered refetch, suppress further ones for 3s.
  // Verification edge functions make multiple sequential DB updates (status, personal info, audit log)
  // each of which fires the realtime — the cooldown coalesces them all into one fetch.
  const lastRealtimeRefetchRef = React.useRef<number>(0);
  const REALTIME_REFETCH_COOLDOWN_MS = 3000;

  const handleEmployeeDocsUpdate = useCallback(
    (payload: { new?: { employee_id?: string }; old?: { employee_id?: string } }) => {
      const docToCheck = payload.new || payload.old;
      if (!docToCheck || docToCheck.employee_id !== employeeId) return;
    },
    [employeeId]
  );
  
  const employeeTypeLabel = employee ? capitalizeWords(employee.employeeType) : '';

  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;
  useRealTimeSubHook({
    channelName: `documents-${employeeId}`,
    events: "*",
    table: "employee_documents",
    filter: employeeId ? `employee_id=eq.${employeeId}` : undefined,
    enabled: !!employeeId,
    onPayload: handleEmployeeDocsUpdate,
  });

  // Define all callback functions
  const handleAddDocument = useCallback(() => {
    if (employeeId) {
      navigate(`/employee-verification/${employeeId}/upload-document`);
    }
  }, [employeeId, navigate]);

  const loadEmployeeData = useCallback(async () => {
    if (!employeeId || !clientId) return;
    
    setIsLoading(true);
    try {
      const data = await fetchEmployeeVerificationData(employeeId, clientId);
      
      if (data.employee) {
        setEmployee(data.employee);
        setDocuments(data.documents);
        console.log('Employee data loaded successfully');
      } else {
        console.log('Employee not found');
        setEmployee(null);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast({
        title: "Error",
        description: "Failed to load employee data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, clientId, toast]);

  // New function to refetch documents only
  const refetchDocuments = useCallback(async () => {
    if (!employeeId) return;
    
    setIsDocumentRefreshing(true);
    try {
      console.log('Refetching documents for employee:', employeeId);
      const refreshedDocuments = await fetchEmployeeDocuments(employeeId, timeframeFilter, true);
      setDocuments(refreshedDocuments);
      console.log('Documents refetched successfully');
    } catch (error) {
      console.error('Error refetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to refresh document data.",
        variant: "destructive",
      });
    } finally {
      setIsDocumentRefreshing(false);
    }
  }, [employeeId, timeframeFilter, toast]);

  const refetchEmployeeSilently = useCallback(async () => {
    if (!employeeId || !clientId) return;
    try {
      const data = await fetchEmployeeVerificationData(employeeId, clientId);
      if (data.employee) {
        setEmployee(data.employee);
      }
    } catch (error) {
      console.error('Error refetching employee data:', error);
    }
  }, [employeeId, clientId]);

  const refetchDocumentsAndEmployee = useCallback(async () => {
    await Promise.all([refetchDocuments(), refetchEmployeeSilently()]);
  }, [refetchDocuments, refetchEmployeeSilently]);

  const handleRefreshDocuments = useCallback(async () => {
    if (employeeId && !isRefreshing) {
      console.log('Refresh button clicked for employee:', employeeId, 'with timeframe:', timeframeFilter || 'all');
      setIsRefreshing(true);
      try {
        const refreshedDocuments = await fetchEmployeeDocuments(employeeId, timeframeFilter, true);
        setDocuments(refreshedDocuments);
        console.log('Documents refreshed for employee:', employeeId);
        
        toast({
          title: "Data Refreshed",
          description: `Employee documents have been refreshed${timeframeFilter ? ` for ${timeframeFilter}` : ''}.`,
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
  }, [employeeId, isRefreshing, timeframeFilter, toast]);

  // Handle timeframe filter change
  const handleTimeframeChange = useCallback(async (value: string) => {
    setTimeframeFilter(value === 'all' ? undefined : value);
    console.log('Timeframe filter changed to:', value);
    
    // Immediately apply the filter if we have an employee ID
    if (employeeId) {
      setIsRefreshing(true);
      try {
        const timeframe = value === 'all' ? undefined : value;
        const filteredDocuments = await fetchEmployeeDocuments(employeeId, timeframe);
        setDocuments(filteredDocuments);
        console.log('Filter applied, documents fetched');
        
        toast({
          title: "Filter Applied",
          description: `Showing documents ${value === 'all' ? 'from all time' : `from ${value}`}.`,
        });
      } catch (error) {
        console.error('Error applying timeframe filter:', error);
        toast({
          title: "Error",
          description: "Failed to apply filter.",
          variant: "destructive",
        });
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [employeeId, toast]);

  // Fetch data when component mounts
  useEffect(() => {
    if (!employeeId || !clientId || initialLoadComplete) return;
    
    const loadData = async () => {
      try {
        console.log('Initial data loading for employee:', employeeId);
        await Promise.all([
          loadEmployeeData(),
          fetchDocumentStatuses(),
          fetchEmployees()
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
  }, [employeeId, clientId, initialLoadComplete, loadEmployeeData, fetchDocumentStatuses, fetchEmployees, toast]);



  // Early return for non-existent employee
  if (!isLoading && !employee && initialLoadComplete) {
    return (
      <Layout>
        <div className="p-8 text-left">
          <h2 className="text-2xl font-bold mb-4">Employee Not Found</h2>
          <p className="text-gray-600 mb-6">The employee you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/employee-verification')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        </div>
      </Layout>
    );
  }

  // Loading state
  if (isLoading || !employee) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <Loader text="Loading employee details..." />
        </div>
      </Layout>
    );
  }

  // Prepare truncated name for header display (limit 200 chars with tooltip)
  const fullName = capitalizeWords(employee.name);
  const headerDisplayName =
    fullName.length > 200 ? `${fullName.slice(0, 200)}…` : fullName;

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 sm:px-6 max-w-[107rem]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center mb-4 sm:mb-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/employee-verification')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
            <div>
              <h1
                className="text-2xl font-bold text-left max-w-3xl truncate"
                title={fullName}
              >
                {headerDisplayName}
              </h1>
              <p className="text-gray-500">{employeeTypeLabel ? `${employeeTypeLabel} • ` : ''}{employee.employeeId}</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefreshDocuments}
              disabled={isLoading || isRefreshing}
              aria-label="Refresh documents"
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            {!isReadOnlySwitchedContext && (
              <Button onClick={handleAddDocument} className="shadow-md">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6">
            <EmployeeDetails employee={employee} documents={documents} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-xl">Documents & Verification</h2>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefreshDocuments}
                disabled={isLoading || isRefreshing || isDocumentRefreshing}
                aria-label="Refresh documents"
              >
                <RefreshCcw className={`h-4 w-4 ${isLoading || isRefreshing || isDocumentRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {isDocumentRefreshing && (
              <div className="flex items-center justify-center p-4 mb-4 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
                <p className="text-gray-600">Refreshing documents...</p>
              </div>
            )}
            
            <DocumentsList 
              employeeId={employee.id}
              employeeName={employee.name}
              documents={documents}
              onAddDocument={isReadOnlySwitchedContext ? undefined : handleAddDocument}
              initialLoadComplete={initialLoadComplete}
              onDocumentAction={refetchDocumentsAndEmployee}
              isVerificationLoading={isVerificationLoading}
              setIsVerificationLoading={setIsVerificationLoading}
              isReadOnly={isReadOnlySwitchedContext}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDetailPage;
