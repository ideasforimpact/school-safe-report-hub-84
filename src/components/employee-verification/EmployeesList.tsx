
import React, { useCallback, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock, Settings, FileX, AlertTriangle, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types/employeeVerification';
import TablePaginationBar from '@/components/common/TablePaginationBar';
import { formatDepartment, capitalizeWords } from '@/lib/formatUtils';
import { aggregatePersonalInfo } from './utils/personalInfoUtils';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EmployeesListProps {
  employees: Employee[];
}

const EmployeesList: React.FC<EmployeesListProps> = ({ employees }) => {
  const { isLoading, fetchEmployees, currentPage, totalPages, totalCount, pageSize } = useEmployeeVerification();
  const navigate = useNavigate();
  const realtimeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastListRefetchRef = useRef<number>(0);
  const LIST_REFETCH_COOLDOWN_MS = 3000;

  const handlePageChange = (page: number) => {
    if (page !== currentPage) fetchEmployees(undefined, page);
  };

  // Debounced realtime handler with 3s cooldown — prevents rapid successive list refetches
  // when a verification edge function makes multiple sequential document updates
  const handleDocumentsRealtime = useCallback(() => {
    if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
    realtimeDebounceRef.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastListRefetchRef.current < LIST_REFETCH_COOLDOWN_MS) return;
      lastListRefetchRef.current = now;
      fetchEmployees();
    }, 800);
  }, [fetchEmployees]);

  useRealTimeSubHook({
    channelName: 'employee-list-documents-realtime',
    table: 'employee_documents',
    events: '*',
    enabled: true,
    onPayload: handleDocumentsRealtime,
  });

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

    // Drivers must have a verified Driving License before the overall status
    // can show "Verified" — having some other document (e.g. Aadhar) verified
    // isn't enough on its own for this department.
    const isDriver = (employee.department || '').toLowerCase() === 'driver';
    const hasVerifiedLicense = documents.some(
      doc => doc.documentTypeName === 'driving_license' &&
        (doc.verificationStatus === 'verified' || doc.verificationStatus === 'completed')
    );

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
      } else if (pending.length > 0 || (isDriver && !hasVerifiedLicense)) {
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

  const getDocumentBadge = (status: Employee['documents'][number]['verificationStatus']) => {
    if (status === 'verified' || status === 'completed') {
      return <Badge className="bg-green-100 text-green-700 border-green-200">Verified</Badge>;
    }
    if (status === 'failed' || status === 'rejected') {
      return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
  };

  const formatDocumentName = (name?: string) => {
    if (!name) return 'Document';
    return name.split('_').filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
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
              <TableHead className="w-[70px] text-center">Docs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total SOPs</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                  No employees match your current filters.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => {
                const isInactive = employee.status === false;
                
                // Prepare truncated name for display with full value on hover
                const fullName = capitalizeWords(employee.name);
                const displayName =
                  fullName.length > 200 ? `${fullName.slice(0, 200)}…` : fullName;

                // Check if employee has different dates of birth
                const documents = employee.documents || [];
                const aggregatedPersonalInfo = aggregatePersonalInfo(documents);
                const hasDifferentDobs = aggregatedPersonalInfo.dob.differentValues.length > 0;

                const isDriverEmployee = (employee.department || '').toLowerCase() === 'driver';

                return (
                  <TableRow key={employee.id} className={isInactive ? "bg-gray-100" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{employee.employeeId}</span>
                        {isDriverEmployee && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-blue-300 bg-blue-50 text-xs font-semibold text-blue-700 cursor-default">
                                  D
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="relative bg-slate-800 text-white border-slate-800 px-3 py-1.5 text-sm after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-2 after:w-2 after:rotate-45 after:bg-slate-800"
                              >
                                Driver
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
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
                    <TableCell className="text-center">
                      <HoverCard openDelay={120} closeDelay={150}>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-700"
                            aria-label={`View documents for ${employee.name}`}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-[280px] p-3" align="start" side="right">
                          <div className="text-xs font-semibold tracking-wide text-gray-500 pb-2 border-b">
                            DOCUMENTS
                          </div>
                          <div className="pt-2 space-y-2 max-h-56 overflow-auto">
                            {documents.length === 0 ? (
                              <div className="text-sm text-gray-500">No uploaded documents</div>
                            ) : (
                              documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                    <span className="text-sm text-gray-800 truncate">
                                      {formatDocumentName(doc.documentTypeName)}
                                    </span>
                                  </div>
                                  {getDocumentBadge(doc.verificationStatus)}
                                </div>
                              ))
                            )}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </TableCell>
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
                              {stats.totalSOPs}/{stats.totalSOPsSignedOff}
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

      <TablePaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        itemLabel="employees"
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default EmployeesList;
