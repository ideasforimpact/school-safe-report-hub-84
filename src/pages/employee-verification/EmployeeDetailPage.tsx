
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import AadharDetailsDialog from '@/components/employee-verification/documents-list/AadharDetailsDialog';

const EmployeeDetailPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchDocumentStatuses, fetchEmployees } = useEmployeeVerification();
  const { toast } = useToast();
  const { user, employeeData } = useAuth();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframeFilter, setTimeframeFilter] = useState<string | undefined>(undefined);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [isDocumentRefreshing, setIsDocumentRefreshing] = useState(false);
  
  // DigiLocker return handling states
  const [isProcessingDigiLocker, setIsProcessingDigiLocker] = useState(false);
  const [aadharDialogOpen, setAadharDialogOpen] = useState(false);
  const [aadharVerificationData, setAadharVerificationData] = useState<any>(null);
  
  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;

  // DigiLocker return handling function
  const handleDigiLockerReturn = useCallback(async () => {
    const urlParams = new URLSearchParams(location.search);
    const gateway = urlParams.get('gateway');
    const type = urlParams.get('type');
    const digiLockerClientId = urlParams.get('client_id');
    const status = urlParams.get('status');

    // Check if this is a DigiLocker return
    if (gateway === 'production' && type === 'digilocker' && digiLockerClientId && status === 'success') {
      console.log('DigiLocker return detected:', { gateway, type, digiLockerClientId, status });
      
      // Find the document ID from localStorage or try to identify the Aadhaar document
      const storedDocumentId = localStorage.getItem('digilocker_document_id');
      let documentId = storedDocumentId;
      
      // If no stored document ID, try to find the Aadhaar document for this employee
      if (!documentId && documents.length > 0) {
        const aadharDoc = documents.find(doc => 
          doc.documentTypeName?.toLowerCase().includes('aadhar') || 
          doc.documentTypeName?.toLowerCase().includes('aadhaar')
        );
        if (aadharDoc) {
          documentId = aadharDoc.id;
        }
      }

      if (documentId) {
        setIsProcessingDigiLocker(true);
        
        try {
          sonnerToast.success("DigiLocker verification completed", {
            description: "Processing your Aadhaar verification..."
          });

          // Call the Edge Function to download Aadhaar data
          const { data, error } = await supabase.functions.invoke('digilocker-verification', {
            body: {
              action: 'downloadAadhaar',
              digiLockerClientId,
              documentId
            }
          });

          if (error) {
            throw new Error(error.message || "Failed to process DigiLocker verification");
          }

          if (data.success) {
            sonnerToast.success("DigiLocker data retrieved", {
              description: "Please review the Aadhaar details and approve or reject the verification."
            });

            // Store the verification data for the dialog
            setAadharVerificationData({
              timestamp: new Date().toISOString(),
              action: 'digilocker_verification',
              response: data.data ? { data: data.data, success: data.success } : data,
              documentId: documentId // Include documentId for actions
            });

            // Refresh documents to show updated status (with DigiLocker data)
            await refetchDocuments();
            
            // Show the Aadhaar details dialog for user to approve/reject
            setAadharDialogOpen(true);
          } else {
            throw new Error(data.error || "Verification failed");
          }

        } catch (err: any) {
          console.error("DigiLocker return handling error:", err);
          sonnerToast.error("Verification Error", {
            description: err.message || "Failed to complete verification"
          });
        } finally {
          setIsProcessingDigiLocker(false);
        }

        // Clean up localStorage and URL parameters
        localStorage.removeItem('digilocker_client_id');
        localStorage.removeItem('digilocker_document_id');
        
        // Navigate back to the same page without URL parameters
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location, documents, navigate, employeeId]);

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
      console.log('Loading employee data for:', employeeId);
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
      const refreshedDocuments = await fetchEmployeeDocuments(employeeId, timeframeFilter);
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

  const handleRefreshDocuments = useCallback(async () => {
    if (employeeId && !isRefreshing) {
      console.log('Refresh button clicked for employee:', employeeId, 'with timeframe:', timeframeFilter || 'all');
      setIsRefreshing(true);
      try {
        const refreshedDocuments = await fetchEmployeeDocuments(employeeId, timeframeFilter);
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
  }, [employeeId, clientId, initialLoadComplete, loadEmployeeData, fetchDocumentStatuses, toast]);

  // Handle DigiLocker return after documents are loaded
  useEffect(() => {
    if (initialLoadComplete && documents.length > 0) {
      handleDigiLockerReturn();
    }
  }, [initialLoadComplete, documents, handleDigiLockerReturn]);

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
        <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading employee details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center mb-4 sm:mb-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/employee-verification')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
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
              aria-label="Refresh documents"
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
              onAddDocument={handleAddDocument}
              initialLoadComplete={initialLoadComplete}
              onDocumentAction={refetchDocuments}
              isVerificationLoading={isVerificationLoading}
              setIsVerificationLoading={setIsVerificationLoading}
            />
          </div>
        </div>
      </div>

      {/* DigiLocker Processing Overlay */}
      {isProcessingDigiLocker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              <h3 className="text-lg font-semibold">Processing DigiLocker Verification</h3>
            </div>
            <p className="text-gray-600 text-center">
              Please wait while we process your Aadhaar verification from DigiLocker...
            </p>
          </div>
        </div>
      )}

      {/* Aadhaar Details Dialog */}
      <AadharDetailsDialog
        open={aadharDialogOpen}
        onOpenChange={setAadharDialogOpen}
        aadharDetails={aadharVerificationData}
        documentId={aadharVerificationData?.documentId}
        onVerificationUpdate={refetchDocuments}
      />
    </Layout>
  );
};

export default EmployeeDetailPage;
