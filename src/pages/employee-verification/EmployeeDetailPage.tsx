
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  getEmployeeVerificationDetails, 
  getEmployeeDocumentsByTimeframe,
  EmployeeVerificationDetails 
} from '@/services/employee/employeeVerificationService';
import { Employee, VerificationDocument } from '@/types/employeeVerification';

const EmployeeDetailPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { fetchDocumentStatuses } = useEmployeeVerification();
  const { toast } = useToast();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframeFilter, setTimeframeFilter] = useState<string | undefined>(undefined);

  // Fetch employee and document details
  const fetchEmployeeDetails = useCallback(async () => {
    if (!employeeId) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching employee details for ID:', employeeId);
      const details: EmployeeVerificationDetails = await getEmployeeVerificationDetails(employeeId);
      
      if (details.employee) {
        setEmployee(details.employee);
        setDocuments(details.documents);
        console.log('Employee details loaded successfully');
      } else {
        console.log('No employee found');
        setEmployee(null);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast({
        title: "Error",
        description: "Failed to load employee details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, toast]);

  // Fetch documents with timeframe filter
  const fetchDocumentsWithTimeframe = useCallback(async (timeframe?: string) => {
    if (!employeeId) return;
    
    setIsRefreshing(true);
    try {
      console.log('Fetching documents with timeframe:', timeframe || 'all');
      const filteredDocuments = await getEmployeeDocumentsByTimeframe(employeeId, timeframe);
      setDocuments(filteredDocuments);
      
      toast({
        title: "Data Refreshed",
        description: `Employee documents have been refreshed${timeframe ? ` for ${timeframe}` : ''}.`,
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to refresh document data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [employeeId, toast]);

  // Handle add document
  const handleAddDocument = useCallback(() => {
    if (employeeId) {
      navigate(`/employee-verification/${employeeId}/upload-document`);
    }
  }, [employeeId, navigate]);

  // Handle refresh documents
  const handleRefreshDocuments = useCallback(async () => {
    await fetchDocumentsWithTimeframe(timeframeFilter);
  }, [fetchDocumentsWithTimeframe, timeframeFilter]);

  // Handle timeframe filter change
  const handleTimeframeChange = useCallback(async (value: string) => {
    const newTimeframe = value === 'all' ? undefined : value;
    setTimeframeFilter(newTimeframe);
    await fetchDocumentsWithTimeframe(newTimeframe);
    
    toast({
      title: "Filter Applied",
      description: `Showing documents ${value === 'all' ? 'from all time' : `from ${value}`}.`,
    });
  }, [fetchDocumentsWithTimeframe, toast]);

  // Initial load
  useEffect(() => {
    fetchEmployeeDetails();
    fetchDocumentStatuses();
  }, [fetchEmployeeDetails, fetchDocumentStatuses]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading employee details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Employee not found
  if (!employee) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Employee Not Found</h2>
            <p className="text-gray-600 mb-6">The employee you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/employee-verification')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Button>
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
              initialLoadComplete={true}
              documents={documents}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDetailPage;
