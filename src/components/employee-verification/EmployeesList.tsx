
import React, { useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types/employeeVerification';
import { usePagination } from '@/hooks/usePagination';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { formatDepartment } from '@/lib/formatUtils';

interface EmployeesListProps {
  employees: Employee[];
}

const EmployeesList: React.FC<EmployeesListProps> = ({
  employees
}) => {
  const { isLoading, fetchEmployees } = useEmployeeVerification();
  const navigate = useNavigate();

  // Ensure employees are fetched when component mounts if not already loaded
  useEffect(() => {
    if (employees.length === 0 && !isLoading) {
      fetchEmployees();
    }
  }, [employees.length, isLoading, fetchEmployees]);

  // Get document status for an employee
  const getDocumentStatus = (employee: Employee) => {
    const documents = employee.documents || [];
    if (documents.length === 0) return 'no-documents';
    
    const verified = documents.filter(doc => doc.verificationStatus === 'verified' || doc.verificationStatus === 'completed');
    const failed = documents.filter(doc => doc.verificationStatus === 'failed');
    const pending = documents.filter(doc => doc.verificationStatus === 'pending');
    
    if (verified.length > 0) return 'verified';
    if (failed.length > 0) return 'failed';
    if (pending.length > 0) return 'pending';
    return 'mixed';
  };

  // Employees are already filtered by parent component

  // Set up pagination
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedEmployees,
    goToNextPage,
    goToPreviousPage
  } = usePagination(employees, 10);

  // Render documents information for each employee
  const renderDocumentsInfo = (employee: Employee) => {
    const documents = employee.documents || [];
    
    // Group by verification status
    const verified = documents.filter(doc => doc.verificationStatus === 'verified' || doc.verificationStatus === 'completed');
    const failed = documents.filter(doc => doc.verificationStatus === 'failed');
    const pending = documents.filter(doc => doc.verificationStatus === 'pending');
    const total = documents.length;

    if (total === 0) {
      return <span className="text-gray-500 text-sm">-</span>;
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

      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Loading employees...</p>
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
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  No employees match your current filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((employee) => {
                // Determine if employee is inactive (for verification system)
                const isInactive = employee.status === false;
                
                return (
                  <TableRow key={employee.id} className={isInactive ? "bg-gray-100" : ""}>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{formatDepartment(employee.department)}</TableCell>
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
      
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={goToPreviousPage}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNumber)}
                    isActive={currentPage === pageNumber}
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={goToNextPage}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default EmployeesList;
