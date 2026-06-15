import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserCheck, Search, Eye, ArrowLeft, RefreshCw } from 'lucide-react';
import VerificationStatusSummary from '@/components/employee-verification/VerificationStatusSummary';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import {
  backofficeEmployeeService,
  type EmployeeWithDocumentsSummary,
  type BackofficeClient
} from '@/services/employee/backofficeEmployeeService';
import { supabase } from '@/integrations/supabase/client'; 

// Helper function to truncate text and show tooltip on hover
const TruncatedText = ({ text, maxLength = 30 }: { text: string; maxLength?: number }) => {
  const truncated = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  const needsTruncation = text.length > maxLength;

  if (needsTruncation) {
    return (
      <span title={text} className="cursor-help">
        {truncated}
      </span>
    );
  }
  return <span>{text}</span>;
};

// Helper function to get status from documentsSummary
const getStatusFromSummary = (summary: EmployeeWithDocumentsSummary['documentsSummary']): 'Verified' | 'Pending' | 'In Progress' | 'Failed' => {
  if (summary.failed > 0) {
    return 'Failed';
  } else if ((summary.inProgress || 0) > 0) {
    return 'In Progress';
  } else if (summary.inProgress === undefined && summary.pending > 0) {
    return 'In Progress';
  } else if (summary.pending > 0) {
    return 'Pending';
  } else {
    return 'Verified';
  }
};

const BackofficeEmployeeVerificationPage = () => {
  const [employees, setEmployees] = useState<EmployeeWithDocumentsSummary[]>([]);
  const [clients, setClients] = useState<BackofficeClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all'); // Default to 'all'
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // Status filter: 'all', 'Pending', 'In Progress', 'Verified'
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined); // Date range filter for Created At
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Create a map of clientId to clientName for quick lookup
  const clientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach(client => {
      map.set(client.id, client.name);
    });
    return map;
  }, [clients]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('🚀 BackofficeEmployeeVerificationPage: Starting active client fetch');
      
      const clientsData = await backofficeEmployeeService.fetchAllClients();
      console.log('📊 Received active clients data:', clientsData);
      
      setClients(clientsData);
    } catch (error) {
      console.error('❌ Error fetching active clients:', error);
      toast({
        title: "Error",
        description: `Failed to fetch active clients: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesByClient = useCallback(async (clientId: string) => {
    try {
      setLoadingEmployees(true);
      const employeesData = await backofficeEmployeeService.fetchEmployeesByClient(clientId);
      // Map client names using current clients state
      const employeesWithClientNames = employeesData.map(emp => {
        const client = clients.find(c => c.id === emp.clientId);
        return {
          ...emp,
          clientName: client?.name || ''
        };
      });
      setEmployees(employeesWithClientNames);
    } catch (error) {
      console.error('Error fetching employees with manual documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees with manual documents",
        variant: "destructive",
      });
    } finally {
      setLoadingEmployees(false);
    }
  }, [clients, toast]);

  const fetchAllEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const employeesData = await backofficeEmployeeService.fetchAllEmployees();
      // Map client names using current clients state
      const employeesWithClientNames = employeesData.map(emp => {
        const client = clients.find(c => c.id === emp.clientId);
        return {
          ...emp,
          clientName: client?.name || ''
        };
      });
      setEmployees(employeesWithClientNames);
    } catch (error) {
      console.error('Error fetching all employees with manual documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees with manual documents",
        variant: "destructive",
      });
    } finally {
      setLoadingEmployees(false);
    }
  }, [clients, toast]);

  const refreshEmployees = useCallback(async () => {
    if (clients.length === 0) return;

    if (selectedClientId === 'all') {
      await fetchAllEmployees();
    } else {
      await fetchEmployeesByClient(selectedClientId);
    }
  }, [clients.length, selectedClientId, fetchAllEmployees, fetchEmployeesByClient]);
  // Fetch all clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch employees when client selection changes (only after clients are loaded)
  useEffect(() => {
    if (clients.length === 0) return;

    void refreshEmployees();
  }, [clients, selectedClientId, refreshEmployees]);

  useEffect(() => {
    if (clients.length === 0) return;

    const channel = supabase
      .channel('backoffice-employee-documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_documents'
        },
        async (payload) => {
          console.log('📡 Backoffice: employee_documents change detected:', payload);

          await refreshEmployees();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from backoffice-employee-documents channel');
      supabase.removeChannel(channel);
    };
  }, [clients.length, refreshEmployees]);

  // Filter employees based on search term and status
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.clientName || clientNameMap.get(employee.clientId) || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(employee => {
        const status = getStatusFromSummary(employee.documentsSummary);
        return status === selectedStatus;
      });
    }

    // Apply date range filter
    if (dateRange?.from && dateRange?.to && dateRange.from && dateRange.to) {
      filtered = filtered.filter(employee => {
        if (!employee.createdAt) return false;
        const createdDate = new Date(employee.createdAt);
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0); // Start of day
        const toDate = new Date(dateRange.to!);
        toDate.setHours(23, 59, 59, 999); // End of day
        return createdDate >= fromDate && createdDate <= toDate;
      });
    } else if (dateRange?.from && dateRange.from) {
      // Only from date selected
      filtered = filtered.filter(employee => {
        if (!employee.createdAt) return false;
        const createdDate = new Date(employee.createdAt);
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0);
        return createdDate >= fromDate;
      });
    }

    return filtered;
  }, [employees, searchTerm, selectedStatus, dateRange, clientNameMap]);

  const handleViewDocuments = (employeeId: string, clientId: string) => {
    navigate(`/backoffice/verification/employee/${employeeId}?clientId=${clientId}`);
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

  const handleRefresh = () => {
    setSearchTerm('');
    setSelectedClientId('all');
    setSelectedStatus('all');
    setDateRange(undefined);

    // Reload employees based on default filter "all"
    fetchAllEmployees();

    toast({
      title: 'Refreshed',
      description: 'Data updated successfully!'
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserCheck className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Employee Verification Management</h1>
              <p className="text-gray-500 mt-1">Manage document verification for employees across active clients</p>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle> Document Verification Overview</CardTitle>
                  <CardDescription>
                    View and manage document verification status for employees
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
              {/* Search box and filters on same row */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Client:</span>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Verified">Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Date Range:</span>
                  <DatePickerWithRange
                    date={dateRange}
                    onChange={setDateRange}
                    className="w-[280px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEmployees ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-500">Loading employees...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm 
                    ? `No employees with documents match the search term "${searchTerm}"`
                    : selectedClientId === 'all'
                    ? 'No employees with uploaded documents found'
                    : 'This client has no employees with uploaded documents yet'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => {
                    const clientName = employee.clientName || clientNameMap.get(employee.clientId) || 'Unknown';
                    const status = getStatusFromSummary(employee.documentsSummary);
                    const summaryForDisplay =
                      employee.documentsSummary.inProgress === undefined &&
                      employee.documentsSummary.pending > 0
                        ? {
                            ...employee.documentsSummary,
                            inProgress: employee.documentsSummary.pending,
                            pending: 0
                          }
                        : employee.documentsSummary;
                    return (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          <TruncatedText text={employee.name} maxLength={30} />
                        </TableCell>
                        <TableCell>
                          <TruncatedText text={clientName} maxLength={30} />
                        </TableCell>
                        <TableCell>
                          <VerificationStatusSummary summary={summaryForDisplay} />
                        </TableCell>
                        <TableCell>
                          {employee.createdAt 
                            ? new Date(employee.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            : '-'}
                        </TableCell>
                        <TableCell className="align-middle">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocuments(employee.id, employee.clientId)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4 flex-shrink-0" />
                            <span>View Documents</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BackofficeEmployeeVerificationPage;
