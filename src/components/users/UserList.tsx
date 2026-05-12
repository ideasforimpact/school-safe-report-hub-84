import React, { useState, useMemo, useEffect } from 'react';
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
import { EmployeeUser } from '@/pages/UserManagement';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from "@/lib/Dateformat";
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface UserListProps {
  users: EmployeeUser[];
  onEditClick: (user: EmployeeUser) => void;
  onDeleteUser: (id: string) => void | Promise<void>;
  onDeactivateUser: (id: string) => void | Promise<void>;
  onReactivateUser: (id: string) => void | Promise<void>;
  hasAdminAccess?: boolean;
  onRefresh?: () => void | Promise<void>;
  currentPage?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  canEditUsers?: boolean;
}

type EmployeeDocumentInfo = {
  id: string;
  name: string;
  status: 'pending' | 'verified' | 'failed';
};

type UserListEmployee = EmployeeUser & {
  tags?: string[];
  designation?: string;
  documentSummaries?: EmployeeDocumentInfo[];
};

const UserList = ({
  users,
  onEditClick,
  onDeleteUser,
  onDeactivateUser,
  onReactivateUser,
  hasAdminAccess = false,
  onRefresh,
  currentPage: controlledCurrentPage,
  totalItems: controlledTotalItems,
  itemsPerPage: controlledItemsPerPage,
  onPageChange,
  canEditUsers = true,
}: UserListProps) => {
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState<string | null>(null);
  const [showActivateDialog, setShowActivateDialog] = useState<string | null>(null);

  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const isControlledPagination =
    controlledCurrentPage !== undefined &&
    controlledTotalItems !== undefined &&
    controlledItemsPerPage !== undefined;
  const currentPage = controlledCurrentPage ?? localCurrentPage;
  const itemsPerPage = controlledItemsPerPage ?? 10;
  const totalItems = controlledTotalItems ?? users.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const shouldHideWriteActions = !canEditUsers;

  console.log("UserList component - Users:", users);
  console.log("UserList component - hasAdminAccess:", hasAdminAccess);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // newest first
    });
  }, [users]);

  const displayedUsers = useMemo(() => {
    if (isControlledPagination) {
      return users;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedUsers.slice(startIndex, endIndex);
  }, [currentPage, isControlledPagination, itemsPerPage, sortedUsers, users]);

  useEffect(() => {
    if (!isControlledPagination) {
      setLocalCurrentPage(1);
    }
  }, [isControlledPagination, users.length]);

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);

    if (onPageChange) {
      onPageChange(nextPage);
      return;
    }

    setLocalCurrentPage(nextPage);
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
  const handleDeactivateUser = async (userId: string) => {
    try {
      setIsTableLoading(true);
      await onDeactivateUser(userId);
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
  const handleActivateUser = async (userId: string) => {
    try {
      setIsTableLoading(true);
      await onReactivateUser(userId);
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
        {displayedUsers.map((user) => (
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
                  const userDetails = user as UserListEmployee;
                  const tags =
                    Array.isArray(userDetails.tags) && userDetails.tags.length > 0
                      ? userDetails.tags
                      : (userDetails.designation || '')
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
                  >
                    <AlertCircle className="h-4 w-4" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-[260px] p-3" align="start">
                  <div className="text-xs font-semibold tracking-wide text-gray-500 pb-2 border-b">
                    DOCUMENTS
                  </div>
                  <div className="pt-2 space-y-2 max-h-56 overflow-auto">
                    {((user as UserListEmployee).documentSummaries || []).length === 0 ? (
                      <div className="text-sm text-gray-500">No uploaded documents</div>
                    ) : (
                      ((user as UserListEmployee).documentSummaries || []).map((doc) => (
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
                  {!shouldHideWriteActions && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditClick(user)}
                      disabled={isTableLoading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {!shouldHideWriteActions && (user.isActive ? (
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
                              onClick={() => handleDeactivateUser(user.id)}
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
                              onClick={() => handleActivateUser(user.id)}
                              disabled={isTableLoading}
                            >
                              Activate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  ))}
                  {!shouldHideWriteActions && (
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
                  )}
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
