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
import { Edit, Trash2, UserX, UserCheck, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, FileText, Download, X } from 'lucide-react';
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  fetchEmployeeProfileDocuments,
  fetchEmployeeVerificationDocuments,
  getProfileDocumentSignedUrl,
  ProfileDocumentRow,
  resolveVerificationDocumentUrl,
  VerificationDocumentRow,
} from '@/services/employee/employeeProfileDocumentService';

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
  const [cpdDialogUser, setCpdDialogUser] = useState<EmployeeUser | null>(null);
  const [documentDialogUser, setDocumentDialogUser] = useState<EmployeeUser | null>(null);
  const [profileDocsForDialog, setProfileDocsForDialog] = useState<ProfileDocumentRow[]>([]);
  const [profileDocsLoading, setProfileDocsLoading] = useState(false);
  const [verificationDocsForDialog, setVerificationDocsForDialog] = useState<VerificationDocumentRow[]>([]);
  const [verificationDocsLoading, setVerificationDocsLoading] = useState(false);

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

  useEffect(() => {
    if (!documentDialogUser?.id) {
      setProfileDocsForDialog([]);
      setVerificationDocsForDialog([]);
      return;
    }

    let cancelled = false;

    const loadDocuments = async () => {
      setProfileDocsLoading(true);
      setVerificationDocsLoading(true);
      try {
        const [profileRows, verificationRows] = await Promise.all([
          fetchEmployeeProfileDocuments(
            documentDialogUser.id,
            documentDialogUser.clientId || employeeData?.clientId
          ),
          fetchEmployeeVerificationDocuments(documentDialogUser.id),
        ]);
        if (cancelled) return;
        setProfileDocsForDialog(profileRows);
        setVerificationDocsForDialog(verificationRows);
      } catch (error) {
        if (cancelled) return;
        console.error('UserList: document fetch failed:', error);
        setProfileDocsForDialog([]);
        setVerificationDocsForDialog([]);
      } finally {
        if (!cancelled) {
          setProfileDocsLoading(false);
          setVerificationDocsLoading(false);
        }
      }
    };

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [documentDialogUser?.id]);

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

  const valueOrNotSet = (value?: string) => {
    if (!value || !String(value).trim()) return 'Not Set';
    return value;
  };

  const openProfileStoredFile = async (bucket: string, storagePath: string) => {
    const signedUrl = await getProfileDocumentSignedUrl(bucket, storagePath);
    if (!signedUrl) {
      toast.error('Unable to open document');
      return;
    }
    window.open(signedUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadProfileStoredFile = async (bucket: string, storagePath: string, fileName: string) => {
    const signedUrl = await getProfileDocumentSignedUrl(bucket, storagePath);
    if (!signedUrl) {
      toast.error('Unable to download document');
      return;
    }
    try {
      const res = await fetch(signedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      a.rel = 'noopener noreferrer';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const openVerificationStoredFile = async (documentUrl: string) => {
    const url = await resolveVerificationDocumentUrl(documentUrl);
    if (!url) {
      toast.error('Unable to open document');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadVerificationFile = async (documentUrl: string, fileName: string) => {
    const url = await resolveVerificationDocumentUrl(documentUrl);
    if (!url) {
      toast.error('Unable to download document');
      return;
    }
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName || 'download';
      a.rel = 'noopener noreferrer';
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
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
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 disabled:text-gray-300"
                aria-label={`View documents for ${user.firstName} ${user.lastName}`}
                onClick={() =>{ 
                  console.log("Selected User:", user);
                  setDocumentDialogUser(user);
              }}
                
              >
                <AlertCircle className="h-4 w-4" />
              </button>
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

      <Dialog open={!!documentDialogUser} onOpenChange={(open) => !open && setDocumentDialogUser(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {documentDialogUser && (
            <div className="space-y-5 px-6 pb-6">
              <div className="sticky top-0 z-50 bg-white pb-4 border-b -mx-6 px-6 pt-4">
                <div className="h-14 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold shrink-0">
                      {(documentDialogUser.firstName?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="">
                      <h1 className="text-xl font-semibold leading-tight truncate">
                        {valueOrNotSet(`${documentDialogUser.firstName || ''} ${documentDialogUser.lastName || ''}`.trim())}
                      </h1>
                      <p className="text-sm text-slate-500 truncate">{valueOrNotSet(documentDialogUser.employeeId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={
                        documentDialogUser.isActive
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }
                    >
                      {documentDialogUser.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <button
                      type="button"
                      className="inline-flex items-center justify-end text-slate-500 hover:text-slate-700 h-6 w-6"
                      onClick={() => setDocumentDialogUser(null)}
                      aria-label="Close details dialog"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-slate-200" aria-hidden />
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 whitespace-nowrap px-1">
                    Basic Information
                  </h3>
                  <div className="h-px flex-1 bg-slate-200" aria-hidden />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-slate-500 mb-1">First Name</p>
                  <p className="font-medium">{valueOrNotSet(documentDialogUser.firstName)}</p>
                  </div>
                  <div><p className="text-xs text-slate-500 mb-1">Last Name</p>
                  <p className="font-medium">{valueOrNotSet(documentDialogUser.lastName)}</p>
                  </div>
                  <div><p className="text-xs text-slate-500 mb-1">Email</p>
                  <p className="font-medium">{valueOrNotSet(documentDialogUser.email)}</p>
                  </div>
                  <div><p className="text-xs text-slate-500 mb-1">Phone</p>
                  <p className="font-medium">{valueOrNotSet((documentDialogUser as any).phone)}</p>
                  </div>
                  <div><p className="text-xs text-slate-500 mb-1">Tags</p>
                  <p className="font-medium">{valueOrNotSet((documentDialogUser as any).designation)}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-slate-200" aria-hidden />
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 whitespace-nowrap px-1">
                    Professional Details
                  </h3>
                  <div className="h-px flex-1 bg-slate-200" aria-hidden />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  
                  <div><p className="text-xs text-slate-500 mb-1">Designation</p>
                  <p className="font-medium">{valueOrNotSet((documentDialogUser as any).designation)}</p>
                  </div>
                  <div><p className="text-xs text-slate-500 mb-1">Department</p>
                  <p className="font-medium">{valueOrNotSet(documentDialogUser.department)}</p>
                  </div>
                  <div><p className="text-xs text-slate-500 mb-1">Employee Type</p>
                  <p className="font-medium">{valueOrNotSet(documentDialogUser.employeeType)}</p>
                  </div>
                  <div><p className="text-xs text-slate-500 mb-1">Joining Date</p>
                  <p className="font-medium mb-4">{documentDialogUser.joiningDate ? formatDate(documentDialogUser.joiningDate) : 'Not Set'}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-slate-200" aria-hidden />
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 whitespace-nowrap px-1">
                    Documents & Compliance
                  </h3>
                  <div className="h-px flex-1 bg-slate-200" aria-hidden />
                </div>
                <div className="space-y-4">
                  {profileDocsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      Loading documents…
                    </div>
                  ) : profileDocsForDialog.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2">No uploaded documents</div>
                  ) : (
                    profileDocsForDialog.map((row) => {
                      const canOpen = Boolean(row.bucket && row.storagePath);
                      return (
                        <div key={row.id} className="space-y-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            {row.label}
                          </p>
                          <div className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-blue-400">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <FileText className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-blue-600" />
                              <span className="text-sm text-slate-800 truncate">{row.fileName}</span>
                            </div>
                            {canOpen && (
                              <div className="flex items-center gap-3 shrink-0 text-sm">
                                <button
                                  type="button"
                                  className="text-blue-400 hover:underline font-medium"
                                  onClick={() => {
                                    if (row.bucket && row.storagePath) {
                                      openProfileStoredFile(row.bucket, row.storagePath);
                                    }
                                  }}
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 text-gray-600 hover:underline font-medium"
                                  onClick={() => {
                                    if (row.bucket && row.storagePath) {
                                      downloadProfileStoredFile(
                                        row.bucket,
                                        row.storagePath,
                                        row.fileName || 'document'
                                      );
                                    }
                                  }}
                                >
                                  Download
                                  <Download className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-slate-200" aria-hidden />
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 whitespace-nowrap px-1">
                    Employee Verification Documents
                  </h3>
                  <div className="h-px flex-1 bg-slate-200" aria-hidden />
                </div>

                <div className="space-y-4 max-h-[min(45vh,360px)] overflow-y-auto pr-1">
                  {verificationDocsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      Loading verification documents…
                    </div>
                  ) : verificationDocsForDialog.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2">No uploaded verification documents</div>
                  ) : (
                    verificationDocsForDialog.map((row) => (
                      <div key={row.id} className="flex items-center justify-between rounded-lg mb-2 border border-slate-200 bg-white px-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="text-sm text-slate-800 truncate ">{row.typeLabel}</span>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold border ${
                            row.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {row.status === 'verified' ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserList;
