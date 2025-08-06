
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserCheck, Search, Eye, ArrowLeft } from 'lucide-react';
import VerificationStatusSummary from '@/components/employee-verification/VerificationStatusSummary';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { backofficeEmployeeService, type EmployeeWithDocumentsSummary, type BackofficeClient } from '@/services/employee/backofficeEmployeeService';

const BackofficeEmployeeVerificationPage = () => {
  const [employees, setEmployees] = useState<EmployeeWithDocumentsSummary[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithDocumentsSummary[]>([]);
  const [clients, setClients] = useState<BackofficeClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch all clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch employees when client is selected
  useEffect(() => {
    if (selectedClientId) {
      fetchEmployeesByClient(selectedClientId);
    }
  }, [selectedClientId]);

  // Filter employees based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, employees]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const clientsData = await backofficeEmployeeService.fetchAllClients();
      setClients(clientsData);
      
      // Auto-select first client if available
      if (clientsData.length > 0) {
        setSelectedClientId(clientsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesByClient = async (clientId: string) => {
    try {
      setLoadingEmployees(true);
      const employeesData = await backofficeEmployeeService.fetchEmployeesByClient(clientId);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleViewDocuments = (employeeId: string) => {
    navigate(`/backoffice/employee-verification/employee/${employeeId}?clientId=${selectedClientId}`);
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

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/backoffice')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <UserCheck className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Employee Verification Management</h1>
              <p className="text-gray-500 mt-1">Manage employee document verification across clients</p>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Employee Verification Overview</CardTitle>
                <CardDescription>
                  View and manage employee document verification status
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Client:</span>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedClientId ? (
              <div className="text-center py-12">
                <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Client</h3>
                <p className="text-gray-500">Please select a client to view their employees and verification status</p>
              </div>
            ) : loadingEmployees ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-500">Loading employees...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No Employees Found' : 'No Employees Available'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? `No employees match the search term "${searchTerm}"`
                    : 'This client has no employees registered yet'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Documents Status</TableHead>
                    <TableHead>Total Documents</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employeeId}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.position || '-'}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <VerificationStatusSummary summary={employee.documentsSummary} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {employee.documentsSummary.verified}/{employee.documentsSummary.total} verified
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocuments(employee.id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Documents
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
