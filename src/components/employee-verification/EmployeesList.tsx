
import React, { useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth';

const EmployeesList = () => {
  const { employees, getEmployeeDocuments, fetchEmployees, isLoading } = useEmployeeVerification();
  const { user, employeeData } = useAuth();
  const navigate = useNavigate();

  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;

  // Debug logging
  useEffect(() => {
    console.log('EmployeesList - Current user:', user);
    console.log('EmployeesList - Current employeeData:', employeeData);
    console.log('EmployeesList - ClientId:', clientId);
    console.log('EmployeesList - Employees:', employees);
    console.log('EmployeesList - IsLoading:', isLoading);
  }, [user, employeeData, clientId, employees, isLoading]);

  // Fetch employees when component mounts or clientId changes
  useEffect(() => {
    if (clientId) {
      console.log('EmployeesList: Fetching employees for clientId:', clientId);
      fetchEmployees();
    } else {
      console.warn('EmployeesList: No clientId available, cannot fetch employees');
    }
  }, [clientId, fetchEmployees]);

  // Use both sources of employee documents - direct from API and from context
  const renderDocumentsInfo = (employee) => {
    // First check if we have documents directly on the employee (from API)
    const documents = employee.documents || getEmployeeDocuments(employee.id) || [];
    
    // Group by verification status
    const verified = documents.filter(doc => doc.verificationStatus === 'verified');
    const failed = documents.filter(doc => doc.verificationStatus === 'failed');
    const pending = documents.filter(doc => doc.verificationStatus === 'pending');
    const total = documents.length;

    if (total === 0) {
      return <span className="text-gray-500 text-sm">No documents</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {verified.length > 0 && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Verified ({verified.length})
          </Badge>
        )}
        
        {failed.length > 0 && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Failed ({failed.length})
          </Badge>
        )}

        {pending.length > 0 && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending ({pending.length})
          </Badge>
        )}

        <span className="text-xs text-gray-500 ml-1">
          ({total} total)
        </span>
      </div>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  Loading employees...
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Show message if no client context
  if (!clientId) {
    return (
      <div className="w-full">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  No client context available. Please ensure you are logged in with a valid client account.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  No employees found for client ID: {clientId}. Add your first employee to get started.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => {
                // Determine if employee is inactive (for verification system)
                const isInactive = employee.status === false;
                
                return (
                  <TableRow key={employee.id} className={isInactive ? "bg-gray-100" : ""}>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell className="max-w-md">
                      {renderDocumentsInfo(employee)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/employee-verification/${employee.id}`)}
                          disabled={isInactive}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeesList;
