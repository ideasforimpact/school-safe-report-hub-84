
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
import { formatDepartment } from '@/lib/formatUtils';
import { aggregatePersonalInfo } from './utils/personalInfoUtils';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface EmployeesListProps {
  employees: Employee[];
}

const EmployeesList: React.FC<EmployeesListProps> = ({ employees }) => {
  const { isLoading, fetchEmployees, currentPage, totalPages, totalEmployeesCount, pageSize } = useEmployeeVerification();
  const navigate = useNavigate();
  const realtimeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastListRefetchRef = useRef<number>(0);
  const LIST_REFETCH_COOLDOWN_MS = 3000;

  const handlePageChange = (page: number) => {
    fetchEmployees(undefined, page);
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

  const renderDocumentsInfo = (employee: Employee) => {
    const documents = employee.documents || [];
    const failed = documents.filter(d => d.verificationStatus === 'failed');
    const pending = documents.filter(d => d.verificationStatus === 'pending' || d.verificationStatus === 'in-progress');
    const verified = documents.filter(d => d.verificationStatus === 'verified' || d.verificationStatus === 'completed');
    const total = documents.length;

    if (total === 0) {
      return (
        <Badge className="gap-1 px-2 py-1 font-medium text-xs bg-gray-100 text-gray-800 border-gray-200">
          <FileX className="h-3.5 w-3.5 text-gray-600" />
          No Documents
        </Badge>
      );
    }

    if (failed.length > 0) {
      return (
        <Badge className="gap-1 px-2 py-1 font-medium text-xs bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3.5 w-3.5 text-red-600" />
          Failed
        </Badge>
      );
    }
    if (pending.length > 0) {
      return (
        <Badge className="gap-1 px-2 py-1 font-medium text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          Pending
        </Badge>
      );
    }
    return (
      <Badge className="gap-1 px-2 py-1 font-medium text-xs bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
        Verified
      </Badge>
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
        onPageChange={handlePageChange}
        totalCount={totalEmployeesCount}
        pageSize={pageSize}
        itemLabel="employees"
      />
    </div>
  );
};

export default EmployeesList;
