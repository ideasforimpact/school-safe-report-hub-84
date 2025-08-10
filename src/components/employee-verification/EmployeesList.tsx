
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
import { Eye, Loader2, CheckCircle, XCircle, Clock, Settings } from 'lucide-react';
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

  // Render documents information for each employee using priority-based status
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

    // Priority-based status logic (same as VerificationStatusSummary)
    // Priority: Failed > Pending > Verified
    // If ANY document failed → Show "Failed"
    // If no failures but ANY pending → Show "Pending"  
    // If ALL documents verified → Show "Verified"
    const getOverallStatus = () => {
      if (failed.length > 0) {
        return {
          status: 'Failed',
          icon: XCircle,
          iconColor: 'text-red-600',
          badgeClass: 'bg-red-100 text-red-800 border-red-200'
        };
      } else if (pending.length > 0) {
        return {
          status: 'Pending',
          icon: Clock,
          iconColor: 'text-amber-600',
          badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      } else {
        return {
          status: 'Verified',
          icon: CheckCircle,
          iconColor: 'text-emerald-600',
          badgeClass: 'bg-green-100 text-green-800 border-green-200'
        };
      }
    };

    const { status, icon: StatusIcon, iconColor, badgeClass } = getOverallStatus();

    // Debug log to check what's being rendered in list
    console.log('EmployeesList - Rendering status:', status, 'with icon:', StatusIcon.name);

    return (
      <div className="flex items-center">
        <Badge className={`gap-1 px-2 py-1 font-medium text-xs ${badgeClass}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          {status}
        </Badge>
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
                          <Settings className="h-4 w-4" />
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
