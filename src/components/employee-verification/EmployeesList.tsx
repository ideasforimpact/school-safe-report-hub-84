
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Loader2, CheckCircle, XCircle, Clock, Settings, FileX, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types/employeeVerification';
import { usePagination } from '@/hooks/usePagination';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { formatDepartment } from '@/lib/formatUtils';
import { aggregatePersonalInfo } from './utils/personalInfoUtils';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';

interface EmployeesListProps {
  employees: Employee[];
}

const EmployeesList: React.FC<EmployeesListProps> = ({
  employees
}) => {
  const { isLoading, fetchEmployees } = useEmployeeVerification();
  const navigate = useNavigate();

  // Debug: Log employee data with SOP statistics
  useEffect(() => {
    if (employees.length > 0) {
      console.log('[EmployeesList] Received', employees.length, 'employees');
      employees.forEach((emp, index) => {
        const sopStats = emp.sopStatistics;
        console.log(`[EmployeesList] Employee ${index + 1}: ${emp.name} (${emp.id})`, {
          hasSopStatistics: !!sopStats,
          sopStatistics: sopStats || 'MISSING',
          totalSOPs: sopStats?.totalSOPs ?? 'N/A',
          totalSOPsSignedOff: sopStats?.totalSOPsSignedOff ?? 'N/A',
          totalSOPsToBeDone: sopStats?.totalSOPsToBeDone ?? 'N/A'
        });
      });
    }
  }, [employees]);

  // Ensure employees are fetched when component mounts if not already loaded
  useEffect(() => {
    if (employees.length === 0 && !isLoading) {
      fetchEmployees();
    }
  }, [employees.length, isLoading, fetchEmployees]);

  const handleEmployeesRealtime = useCallback(
    async () => {
      await fetchEmployees();
    },
    [fetchEmployees]
  );
  useRealTimeSubHook({
    channelName: "employees-realtime",
    events: "*",
    table: "employee_documents",
    enabled: true,
    onPayload: handleEmployeesRealtime,
  });

  // Real-time updates for SOP statistics - refresh employees to get updated stats
  useRealTimeSubHook({
    channelName: "employee-sop-stats-assigned",
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_assigned',
    enabled: true,
    onPayload: () => {
      // Refresh employees to get updated SOP stats
      fetchEmployees();
    },
  });

  useRealTimeSubHook({
    channelName: "employee-sop-stats-signoff",
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_signoff_request',
    enabled: true,
    onPayload: () => {
      // Refresh employees to get updated SOP stats
      fetchEmployees();
    },
  });

  useRealTimeSubHook({
    channelName: "employee-sop-stats-group-employees",
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'group_employees',
    enabled: true,
    onPayload: () => {
      // Refresh employees to get updated SOP stats
      fetchEmployees();
    },
  });
  // Get document status for an employee
  const getDocumentStatus = (employee: Employee) => {
    const documents = employee.documents || [];
    if (documents.length === 0) return 'no-documents';
    
    const verified = documents.filter(doc => doc.verificationStatus === 'verified' || doc.verificationStatus === 'completed');
    const failed = documents.filter(doc => doc.verificationStatus === 'failed');
    const pending = documents.filter(doc => doc.verificationStatus === 'pending' || doc.verificationStatus === 'in-progress');
    
    // Priority: failed > pending > verified
    if (failed.length > 0) return 'failed';
    if (pending.length > 0) return 'pending';
    if (verified.length > 0) return 'verified';
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
    const pending = documents.filter(doc => doc.verificationStatus === 'pending' || doc.verificationStatus === 'in-progress');
    const total = documents.length;

    if (total === 0) {
      return (
        <div className="flex items-center">
          <Badge className="gap-1 px-2 py-1 font-medium text-xs bg-gray-100 text-gray-800 border-gray-200">
            <FileX className="h-3.5 w-3.5 text-gray-600" />
            No Documents
          </Badge>
        </div>
      );
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
              <TableHead>Total SOPs</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  No employees match your current filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((employee) => {
                // Determine if employee is inactive (for verification system)
                const isInactive = employee.status === false;
                
                // Prepare truncated name for display with full value on hover
                const fullName = employee.name || '';
                const displayName =
                  fullName.length > 200 ? `${fullName.slice(0, 200)}…` : fullName;

                // Check if employee has different dates of birth
                const documents = employee.documents || [];
                const aggregatedPersonalInfo = aggregatePersonalInfo(documents);
                const hasDifferentDobs = aggregatedPersonalInfo.dob.differentValues.length > 0;

                return (
                  <TableRow key={employee.id} className={isInactive ? "bg-gray-100" : ""}>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell
                      title={fullName}
                      className="max-w-xs truncate"
                    >
                      <div className="flex items-center gap-2">
                        <span>{displayName}</span>
                        {hasDifferentDobs && (
                          <div title="Different dates of birth found across documents">
                            <AlertTriangle 
                              className="h-4 w-4 text-red-600 flex-shrink-0" 
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDepartment(employee.department)}</TableCell>
                    <TableCell className="max-w-md">
                      {renderDocumentsInfo(employee)}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const stats = employee.sopStatistics || {
                          totalSOPs: 0,
                          totalSOPsSignedOff: 0,
                        };

                        if (stats.totalSOPs === 0) {
                          return <span className="text-sm text-gray-500">-</span>;
                        }

                        return (
                          <Badge className="gap-1 px-2 py-1 font-medium text-xs bg-blue-100 text-blue-800 border-blue-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                            <span className="font-semibold">
                              {stats.totalSOPsSignedOff}/{stats.totalSOPs}
                            </span>
                          </Badge>
                        );
                      })()}
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
            <PaginationContent className="flex items-center gap-3">
              <PaginationItem>
                <PaginationPrevious
                  onClick={goToPreviousPage}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-3 py-1 text-sm font-medium text-gray-700">
                  {currentPage} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={goToNextPage}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
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
