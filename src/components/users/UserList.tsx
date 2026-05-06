import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, ModulePermissions } from '@/contexts/auth/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, UserX, UserCheck, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ModuleAccessItem } from '@/types/moduleAccess';
import { EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { EmployeeUser } from '@/pages/UserManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { incidentReferenceService, IncidentReferenceCheck } from '@/services/incident/incidentReferenceService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth/useAuth';
import { formatDate } from "@/lib/Dateformat";
import CpdDetailsDialog from '@/components/users/CpdDetailsDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface UserListProps {
  users: EmployeeUser[];
  onEditClick: (user: EmployeeUser) => void;
  onDeleteUser: (id: string) => void;
  onDeactivateUser: (id: string) => void;
  onReactivateUser: (id: string) => void;
  hasAdminAccess?: boolean;
  onRefresh?: () => void;
  canEditUsers?: boolean;
}

const UserList = ({ 
  users, 
  onEditClick, 
  onDeleteUser, 
  onDeactivateUser, 
  onReactivateUser, 
  hasAdminAccess = false,
  onRefresh,
  canEditUsers = true,
}: UserListProps) => {
  type EmployeeDocumentInfo = {
    id: string;
    name: string;
    status: 'pending' | 'verified' | 'failed';
  };

  const { employeeData } = useAuth();
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState<string | null>(null);
  const [showActivateDialog, setShowActivateDialog] = useState<string | null>(null);
  const [employeeReferences, setEmployeeReferences] = useState<Record<string, IncidentReferenceCheck>>({});
  const [cpdDialogUser, setCpdDialogUser] = useState<EmployeeUser | null>(null);
  const [documentsByEmployee, setDocumentsByEmployee] = useState<Record<string, EmployeeDocumentInfo[]>>({});
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pre-load reference info so we can disable delete button for linked employees
  useEffect(() => {
    const clientId = employeeData?.clientId;
    if (!clientId || users.length === 0) {
      setEmployeeReferences({});
      return;
    }

    let isCancelled = false;

    const fetchReferences = async () => {
      try {
        const results = await Promise.all(
          users.map(async (user) => {
            const refInfo = await incidentReferenceService.checkEmployeeReferences(user.id, clientId);
            return { id: user.id, refInfo };
          })
        );

        if (isCancelled) return;

        const map: Record<string, IncidentReferenceCheck> = {};
        results.forEach(({ id, refInfo }) => {
          map[id] = refInfo;
        });
        setEmployeeReferences(map);
      } catch (error) {
        console.error('Error preloading employee reference info:', error);
      }
    };

    fetchReferences();

    return () => {
      isCancelled = true;
    };
  }, [users, employeeData]);

  // Fetch employee uploaded documents for the info popover near Department.
  useEffect(() => {
    let isCancelled = false;

    const loadEmployeeDocuments = async () => {
      if (!users.length) {
        setDocumentsByEmployee({});
        return;
      }

      try {
        setIsDocumentsLoading(true);
        const employeeIds = users.map((u) => u.id).filter(Boolean);

        const { data, error } = await supabase
          .from('employee_documents')
          .select('id, employee_id, verification_status, params, document_type:document_type_id(name)')
          .in('employee_id', employeeIds as any)
          .eq('is_delete', 0);

        if (error) throw error;
        if (isCancelled) return;

        const toLabel = (value: string) =>
          value
            .split('_')
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

        const normalizeStatus = (status: string | null | undefined): EmployeeDocumentInfo['status'] => {
          if (!status) return 'pending';
          const normalized = status.toLowerCase();
          if (normalized === 'verified' || normalized === 'completed') return 'verified';
          if (normalized === 'failed' || normalized === 'rejected') return 'failed';
          return 'pending';
        };

        const grouped: Record<string, EmployeeDocumentInfo[]> = {};
        users.forEach((u) => {
          grouped[u.id] = [];
        });

        (data || []).forEach((doc: any) => {
          const employeeId = doc.employee_id as string;
          const selected = doc?.params?.selected;
          const typeName = doc?.document_type?.name;
          const displayName = toLabel(typeName || selected || 'document');

          if (!grouped[employeeId]) grouped[employeeId] = [];
          grouped[employeeId].push({
            id: doc.id,
            name: displayName,
            status: normalizeStatus(doc.verification_status),
          });
        });

        setDocumentsByEmployee(grouped);
      } catch (error) {
        console.error('Error loading employee documents in user list:', error);
      } finally {
        if (!isCancelled) setIsDocumentsLoading(false);
      }
    };

    loadEmployeeDocuments();

    return () => {
      isCancelled = true;
    };
  }, [users]);

  console.log("UserList component - Users:", users);
  console.log("UserList component - hasAdminAccess:", hasAdminAccess);

  // Pagination logic
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
    const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // newest first
    });
  }, [users]);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedUsers.slice(startIndex, endIndex);
  }, [sortedUsers, currentPage, itemsPerPage]);
  // Reset to first page when items per page changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Reset to first page when users array changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [users.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
  };

  const getStatusBadge = (status: 'pending' | 'verified' | 'failed') => {
    if (status === 'verified') {
      return <Badge className="bg-green-100 text-green-700 border-green-200">Verified</Badge>;
    }
    if (status === 'failed') {
      return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
  };



  // Handle deactivate user with database update
  const handleDeactivateUser = async (userId: string, employeeId: string, clientId: string) => {
    try {
      setIsTableLoading(true);
      
      // Update the employee status in the database
      const { data, error } = await supabase
        .from('employees')
        .update({ 
          status: false, // Set active = 0 (false)
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('client_id', clientId);

      if (error) {
        console.error('Error deactivating employee:', error);
        toast.error('Failed to deactivate employee');
        return;
      }

      console.log('Employee deactivated successfully:', data);
      
      // Call the parent's deactivate function
      await onDeactivateUser(userId);
      
      // Refresh the list with loading state
      if (onRefresh) {
        await onRefresh();
      }
      
    } catch (error) {
      console.error('Error deactivating employee:', error);
      toast.error('Failed to deactivate employee');
    } finally {
      setIsTableLoading(false);
      setShowDeactivateDialog(null);
    }
  };

  // Handle activate user with database update
  const handleActivateUser = async (userId: string, employeeId: string, clientId: string) => {
    try {
      setIsTableLoading(true);
      
      // Update the employee status in the database
      const { data, error } = await supabase
        .from('employees')
        .update({ 
          status: true, // Set active = 1 (true)
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('client_id', clientId);

      if (error) {
        console.error('Error activating employee:', error);
        toast.error('Failed to activate employee');
        return;
      }

      console.log('Employee activated successfully:', data);
      
      // Call the parent's reactivate function
      await onReactivateUser(userId);
      
      // Refresh the list with loading state
      if (onRefresh) {
        await onRefresh();
      }
      
    } catch (error) {
      console.error('Error activating employee:', error);
      toast.error('Failed to activate employee');
    } finally {
      setIsTableLoading(false);
      setShowActivateDialog(null);
    }
  };
  
  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isTableLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-md">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Processing...</span>
          </div>
        </div>
      )}
      
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Department</TableHead>
          <TableHead className="w-[70px] text-center">Docs</TableHead>
          <TableHead>Joining Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[150px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedUsers.map((user) => (
          <TableRow key={user.id} className={!user.isActive ? "bg-muted/20" : ""}>
            <TableCell>
              <div className="flex items-center gap-2">
                <span>{user.employeeId || '-'}</span>
                {user.employeeType === 'contract' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-amber-300 bg-amber-50 text-xs font-semibold text-amber-700 cursor-default">
                          C
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="relative bg-slate-800 text-white border-slate-800 px-3 py-1.5 text-sm after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-2 after:w-2 after:rotate-45 after:bg-slate-800"
                      >
                        Contract Employee
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{user.firstName} {user.lastName}</span>
                {(() => {
                  const tags =
                    Array.isArray((user as any).tags) && (user as any).tags.length > 0
                      ? (user as any).tags
                      : ((user as any).designation || '')
                          .split(',')
                          .map((tag: string) => tag.trim())
                          .filter(Boolean)
                          .slice(0, 2);

                  if (tags.length === 0) return null;

                  return (
                    <span className="mt-1 text-sm font-semibold text-slate-400">
                      {tags.join('  •  ')}
                    </span>
                  );
                })()}
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.department ? user.department.charAt(0).toUpperCase() + user.department.slice(1) : '-'}</TableCell>
            <TableCell className="text-center">
              <HoverCard openDelay={120} closeDelay={150}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 disabled:text-gray-300"
                    aria-label={`View documents for ${user.firstName} ${user.lastName}`}
                    disabled={isDocumentsLoading}
                  >
                    <AlertCircle className="h-4 w-4" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-[260px] p-3" align="start">
                  <div className="text-xs font-semibold tracking-wide text-gray-500 pb-2 border-b">
                    DOCUMENTS
                  </div>
                  <div className="pt-2 space-y-2 max-h-56 overflow-auto">
                    {isDocumentsLoading ? (
                      <div className="text-sm text-gray-500">Loading...</div>
                    ) : (documentsByEmployee[user.id] || []).length === 0 ? (
                      <div className="text-sm text-gray-500">No uploaded documents</div>
                    ) : (
                      (documentsByEmployee[user.id] || []).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-800 truncate">{doc.name}</span>
                          </div>
                          {getStatusBadge(doc.status)}
                        </div>
                      ))
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            </TableCell>
            {/* <TableCell>{user.employeeType ? user.employeeType.charAt(0).toUpperCase() + user.employeeType.slice(1) : '-'}</TableCell> */}
            <TableCell>
              {user.joiningDate ? formatDate(user.joiningDate) : '-'}
            </TableCell>            
            <TableCell>
              {user.isActive ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                  Inactive
                </Badge>
              )}
            </TableCell>
            <TableCell>
              {!user.isSuperAdmin && hasAdminAccess ? (
                <div className="flex space-x-1">
                  {canEditUsers && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEditClick(user)}
                        disabled={isTableLoading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {user.isActive ? (
                      // Deactivate Button
                      <AlertDialog open={showDeactivateDialog === user.id} onOpenChange={(open) => setShowDeactivateDialog(open ? user.id : null)}>
                      <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            disabled={isTableLoading}
                          >
                          <UserX className="h-4 w-4 text-amber-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                          <AlertDialogDescription>
                              Are you sure you want to deactivate {user.firstName} {user.lastName}? They will no longer be able to log in to the system.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isTableLoading}>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-amber-600 hover:bg-amber-700"
                              onClick={() => handleDeactivateUser(user.id, user.employeeId || '', user.clientId || '')}
                              disabled={isTableLoading}
                          >
                            Deactivate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                      // Activate Button
                      <AlertDialog open={showActivateDialog === user.id} onOpenChange={(open) => setShowActivateDialog(open ? user.id : null)}>
                        <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                            disabled={isTableLoading}
                    >
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Activate User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to activate {user.firstName} {user.lastName}? They will be able to log in to the system again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isTableLoading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleActivateUser(user.id, user.employeeId || '', user.clientId || '')}
                              disabled={isTableLoading}
                            >
                              Activate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  )}
                  
                  {(() => {
                    const refInfo = employeeReferences[user.id];
                    const isLinked = refInfo?.hasReferences || false;
                    const message = refInfo?.message || '';

                    if (isLinked) {
                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  disabled={true}
                                  aria-disabled="true"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  className="text-red-400 hover:text-red-400 hover:bg-transparent cursor-not-allowed opacity-60"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="left" 
                              align="center" 
                              sideOffset={8} 
                              className="max-w-xs whitespace-normal text-left"
                            >
                              <p className="text-xs leading-snug text-left">
                                {message}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }

                    return (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          disabled={isTableLoading}
                        >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete this user? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel disabled={isTableLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => onDeleteUser(user.id)}
                            disabled={isTableLoading}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex space-x-1">
                  {/* Show only view button if user doesn't have admin access */}
                  {canEditUsers && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEditClick(user)}
                        disabled={!user.isActive || !hasAdminAccess || isTableLoading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {/* Pagination Controls */}
    {totalItems > 0 && (
      <div className="flex items-center justify-center space-x-6 lg:space-x-8 py-4">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                const isCurrentPage = pageNumber === currentPage;
                
                // Show first page, last page, current page, and pages around current page
                const shouldShow = 
                  pageNumber === 1 || 
                  pageNumber === totalPages || 
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                
                if (!shouldShow) {
                  // Show ellipsis if there's a gap
                  if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                    return (
                      <span key={`ellipsis-${pageNumber}`} className="px-2 text-sm text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                }
                
                return (
                  <Button
                    key={pageNumber}
                    variant={isCurrentPage ? "default" : "outline"}
                    className="h-8 w-8 p-0"
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
