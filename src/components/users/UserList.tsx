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
import { Edit, Trash2, UserX, UserCheck, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
interface UserListProps {
  users: EmployeeUser[];
  onEditClick: (user: EmployeeUser) => void;
  onDeleteUser: (id: string) => void;
  onDeactivateUser: (id: string) => void;
  onReactivateUser: (id: string) => void;
  hasAdminAccess?: boolean;
  onRefresh?: () => void;
}

const UserList = ({ 
  users, 
  onEditClick, 
  onDeleteUser, 
  onDeactivateUser, 
  onReactivateUser, 
  hasAdminAccess = false,
  onRefresh,
}: UserListProps) => {
  const { employeeData } = useAuth();
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState<string | null>(null);
  const [showActivateDialog, setShowActivateDialog] = useState<string | null>(null);
  const [employeeReferences, setEmployeeReferences] = useState<Record<string, IncidentReferenceCheck>>({});
  
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
          <TableHead>Type</TableHead>
          <TableHead>Joining Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[150px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedUsers.map((user) => (
          <TableRow key={user.id} className={!user.isActive ? "bg-muted/20" : ""}>
            <TableCell>{user.employeeId || '-'}</TableCell>
            <TableCell>{user.firstName} {user.lastName}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.department ? user.department.charAt(0).toUpperCase() + user.department.slice(1) : '-'}</TableCell>
            <TableCell>{user.employeeType ? user.employeeType.charAt(0).toUpperCase() + user.employeeType.slice(1) : '-'}</TableCell>
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEditClick(user)}
                      disabled={isTableLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEditClick(user)}
                      disabled={!user.isActive || !hasAdminAccess || isTableLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
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
