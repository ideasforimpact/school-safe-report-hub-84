import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Upload, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import EmployeeDetails from '@/components/employee-verification/EmployeeDetails';
import DocumentsList from '@/components/employee-verification/documents-list';
import Layout from '@/components/layout/Layout';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

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
  const [timeframeFilter, setTimeframeFilter] = useState<string | undefined>(undefined);
  const isInitialLoad = useRef(true);
  
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
      console.log('Refresh button clicked for employee:', employeeId, 'with timeframe:', timeframeFilter || 'all');
      setIsRefreshing(true);
      try {
        // Fetch employee documents using the selected timeframe filter
        const result = await fetchEmployeeDocuments(employeeId, timeframeFilter);
        console.log('Documents refreshed for employee:', employeeId, 'with timeframe:', timeframeFilter || 'all');
        console.log('Refresh result:', result);
        
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
  }, [employeeId, fetchEmployeeDocuments, toast, isRefreshing, timeframeFilter]);

  // Handle timeframe filter change
  const handleTimeframeChange = useCallback(async (value: string) => {
    setTimeframeFilter(value === 'all' ? undefined : value);
    console.log('Timeframe filter changed to:', value);
    
    // Immediately apply the filter if we have an employee ID
    if (employeeId) {
      setIsRefreshing(true);
      try {
        const timeframe = value === 'all' ? undefined : value;
        const result = await fetchEmployeeDocuments(employeeId, timeframe);
        console.log('Filter applied, documents fetched:', result);
        
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
  }, [employeeId, fetchEmployeeDocuments, toast]);

  // Fetch data when component mounts - only once
  useEffect(() => {
    if (!employeeId || !isInitialLoad.current) return;
    
    const loadData = async () => {
      try {
        console.log('Initial data loading for employee:', employeeId);
        
        // Fetch document statuses first
        await fetchDocumentStatuses();
        
        // Then fetch documents
        await fetchEmployeeDocuments(employeeId);
        
        console.log('Initial data loading complete for employee:', employeeId);
        setInitialLoadComplete(true);
        isInitialLoad.current = false;
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
  }, [employeeId, fetchEmployeeDocuments, fetchDocumentStatuses, toast]);

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
            <EmployeeDetails employee={employee} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
              <div className="flex items-center mb-4 sm:mb-0 flex-1">
                <h2 className="font-semibold text-xl whitespace-nowrap">Documents & Verification</h2>
                <Separator className="ml-4 flex-grow hidden sm:block" />
              </div>
              
              <div className="flex items-center space-x-2 self-end sm:self-auto w-full sm:w-auto">
                <Select 
                  value={timeframeFilter || 'all'} 
                  onValueChange={handleTimeframeChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefreshDocuments}
                  disabled={isLoading || isRefreshing}
                  aria-label="Refresh documents"
                >
                  <RefreshCcw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
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
