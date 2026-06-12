import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import SOPHeader from '@/components/sop/SOPHeader';
import AssignSOPDialog from '@/components/sop/AssignSOPDialog';
import AddSOPDialog from '@/components/sop/AddSOPDialog';
import ViewSOPDialog from '@/components/sop/ViewSOPDialog';
import GroupDetailsDialog from '@/components/sop/GroupDetailsDialog';
import SignoffRequestDialog from '@/components/sop/SignoffRequestDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';
import { getEmployeeData, isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { useClient } from '@/contexts/ClientContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import TablePaginationBar from '@/components/common/TablePaginationBar';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Eye, UserPlus, Users, User, CheckCircle, Clock, Clock3, Trash2, X } from 'lucide-react';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import CompletedEmployeesDialog from './CompletedEmployeesDialog';
import Loader from '@/components/common/Loader';

interface SOP {
  id: string;
  title: string;
  category_id: string;
  category_name?: string;
  description: string | null;
  status: boolean;
  procedure_steps: string[];
  important_notes: string | null;
  client_id: string | null;
  employee_id: string | null;
  created_at: string;
  updated_at: string;
  assigned_sop?: number;
  assigned_group_count?: number;
  assigned_employee_count?: number;
  completed_count?: number;
  to_be_done_count?: number;
  creator_name?: string | null;
  assignments?: {
    group_id: string | null;
    group_name: string | null;
    group_type: string | null;
    group_status: boolean | null;
    employee_count?: number | null;
    employees?: Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      full_name: string;
    }> | null;
    created_by_id: string | null;
    created_by_name: string | null;
  }[];
  signoff_request_status?: string;
  sop_signoff_request_exist?: boolean;
  completed_date?: string | null;
  completed_employee_ids?: string[];
}

const SOPPage = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSOP, setEditingSOP] = useState<SOP | null>(null);
  const [assigningSOP, setAssigningSOP] = useState<SOP | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewingSOP, setViewingSOP] = useState<SOP | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [groupDetailsDialogOpen, setGroupDetailsDialogOpen] = useState(false);
  const [selectedGroupsForDialog, setSelectedGroupsForDialog] = useState<any[]>([]);
  const [selectedSopTitleForDialog, setSelectedSopTitleForDialog] = useState<string>('');
  const [signoffDialogOpen, setSignoffDialogOpen] = useState(false);
  const [signoffSOP, setSignoffSOP] = useState<SOP | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sopToDelete, setSopToDelete] = useState<SOP | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sops, setSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{ id: string; category_name: string }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;
  const { state } = useEmployeeStore();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  const employeeData = getEmployeeData(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  const canManageSOPInCurrentContext = isSuperAdmin && !isReadOnlySwitchedContext;
  const { client } = useClient();
  const [completedEmployeesDialogOpen, setCompletedEmployeesDialogOpen] = useState(false);
  const [completedEmployees, setCompletedEmployees] = useState<any[]>([]);
  const [selectedSopForCompleted, setSelectedSopForCompleted] = useState<string>('');
  const [completedEmployeeIds, setCompletedEmployeeIds] = useState<string[]>([]);

  // Statistics derived from fetch-sop response — no separate edge function needed
  const [sopStats, setSopStats] = useState({ totalSOPs: 0, totalEmployeesInvolved: 0, totalSOPsSignedOff: 0, totalSOPsToBeDone: 0 });

  // Resolve clientId similarly to AddSOPDialog to avoid null client from context
  const resolvedClientId = employeeData?.clientId || employeeData?.client?.id || client?.id || null;

  // Guards to prevent concurrent / duplicate fetch-sop calls
  const fetchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timestamp of the last direct (user-action) fetch — real-time triggers are suppressed for 2s after
  const lastDirectFetchRef = useRef<number>(0);
  // Separate debounce ref for search/filter changes
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable ref so real-time callbacks always see the current page without stale closure
  const currentPageRef = useRef(1);

  const fetchSOPs = useCallback(async (page: number = 1) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    lastDirectFetchRef.current = Date.now();
    setLoading(true);
    try {
      const clientId = resolvedClientId;
      const employeeId = employeeData?.id || null;
      if (!clientId) { setSops([]); return; }

      const { data, error } = await supabase.functions.invoke('fetch-sop', {
        body: { client_id: clientId, employee_id: employeeId, is_super_admin: isSuperAdmin, page, limit: PAGE_SIZE },
      });

      if (error) { console.error('Error fetching SOPs:', error); toast.error('Failed to load SOPs'); return; }
      if (data?.error) { toast.error(data.error || 'Failed to load SOPs'); return; }

      if (data?.success) {
        const sopList: any[] = data.data || [];
        setSops(sopList);
        setTotalCount(data.pagination?.total ?? sopList.length);

        // Categories for filter dropdown (first page only, stable reference)
        if (page === 1) {
          const seen = new Set<string>();
          setCategories(sopList
            .filter((s: any) => s.category_id && s.category_name && !seen.has(s.category_id) && seen.add(s.category_id))
            .map((s: any) => ({ id: s.category_id, category_name: s.category_name }))
            .sort((a: any, b: any) => a.category_name.localeCompare(b.category_name)));
        }

        // Stats — totalSOPs from server count; others from current page (updated on data changes via real-time)
        setSopStats({
          totalSOPs: data.pagination?.total ?? sopList.length,
          totalEmployeesInvolved: sopList.reduce((sum: number, s: any) => sum + (s.assigned_employee_count || 0), 0),
          totalSOPsSignedOff: sopList.reduce((sum: number, s: any) => sum + (s.completed_count || 0), 0),
          totalSOPsToBeDone: sopList.reduce((sum: number, s: any) => sum + (s.to_be_done_count || 0), 0),
        });
      }
    } catch (error) {
      console.error('Error fetching SOPs:', error);
      toast.error('Failed to load SOPs');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [resolvedClientId, employeeData?.id, isSuperAdmin, PAGE_SIZE]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced wrapper — collapses rapid real-time triggers into one fetch.
  // Suppressed for 2s after a direct (user-action) fetch to avoid double-calling
  // when the same DB write triggers both the callback and a real-time event.
  const scheduleFetchSOPs = useCallback((page: number = 1) => {
    if (Date.now() - lastDirectFetchRef.current < 2000) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSOPs(page), 300);
  }, [fetchSOPs]);

  // Server-side filtered fetch — updates table + totalCount but not stats/categories
  const fetchFilteredSOPs = useCallback(async (search: string, status: string, categoryId: string, page: number = 1) => {
    const clientId = resolvedClientId;
    const employeeId = employeeData?.id || null;
    if (!clientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-sop', {
        body: {
          client_id: clientId,
          employee_id: employeeId,
          is_super_admin: isSuperAdmin,
          search: search.trim() || null,
          status: status !== 'all' ? status : null,
          category_id: categoryId !== 'all' ? categoryId : null,
          page,
          limit: PAGE_SIZE,
        },
      });
      if (error) { console.error('Error fetching filtered SOPs:', error); return; }
      if (data?.success) {
        setSops(data.data || []);
        setTotalCount(data.pagination?.total ?? (data.data || []).length);
      }
    } catch (error) {
      console.error('Error fetching filtered SOPs:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedClientId, employeeData?.id, isSuperAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep ref in sync so real-time callbacks always have the latest page
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  // Initial load / client-context change — reset to page 1
  useEffect(() => {
    setSops([]);
    setCurrentPage(1);
    currentPageRef.current = 1;
    setLoading(true);
    fetchSOPs(1);
  }, [fetchSOPs]); // fetchSOPs captures resolvedClientId, employeeData?.id, isSuperAdmin

  // Filter change — reset to page 1 and call server (debounce handled by DebouncedSearchInput)
  useEffect(() => {
    const hasFilters = searchTerm.trim() || statusFilter !== 'all' || categoryFilter !== 'all';
    setCurrentPage(1);
    if (!hasFilters) {
      fetchSOPs(1);
      return;
    }
    fetchFilteredSOPs(searchTerm, statusFilter, categoryFilter, 1);
  }, [searchTerm, statusFilter, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Page change — re-fetch keeping current filters
  useEffect(() => {
    const hasFilters = searchTerm.trim() || statusFilter !== 'all' || categoryFilter !== 'all';
    if (hasFilters) {
      fetchFilteredSOPs(searchTerm, statusFilter, categoryFilter, currentPage);
    } else {
      fetchSOPs(currentPage);
    }
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateSOP = () => {
    if (isReadOnlySwitchedContext) {
      toast.error('Read-only switched client context: create is not allowed');
      return;
    }
    setEditingSOP(null);
    setShowAddDialog(true);
  };

  const handleEditSOP = (sop: SOP) => {
    if (isReadOnlySwitchedContext) {
      toast.error('Read-only switched client context: update is not allowed');
      return;
    }
    setEditingSOP(sop);
    setShowAddDialog(true);
  };

  const handleSOPCreated = () => {
    // Refresh SOP list after create/update
    fetchSOPs();
    setEditingSOP(null);
  };

  const handleAssignClick = (sop: SOP) => {
    if (isReadOnlySwitchedContext) {
      toast.error('Read-only switched client context: assign is not allowed');
      return;
    }
    setAssigningSOP(sop);
    setAssignDialogOpen(true);
  };

  const handleAssignDialogChange = (open: boolean) => {
    if (!open) {
      setAssigningSOP(null);
    }
    setAssignDialogOpen(open);
  };

  const handleAssignedSummaryUpdate = (_assignedCount: number) => {
    // Always refetch from backend so list reflects latest sop_assigned state
    fetchSOPs();
  };

  const handleDeleteClick = (sop: SOP) => {
    if (isReadOnlySwitchedContext) {
      toast.error('Read-only switched client context: delete is not allowed');
      return;
    }
    setSopToDelete(sop);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sopToDelete || !resolvedClientId) {
      return;
    }

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-sop', {
        body: {
          sop_id: sopToDelete.id,
          client_id: resolvedClientId,
        },
      });

      if (error) {
        console.error('Error deleting SOP:', error);
        toast.error('Failed to delete SOP');
        return;
      }

      if (data && data.error) {
        toast.error(data.details || data.error || 'Failed to delete SOP');
        return;
      }

      toast.success('SOP deleted successfully');
      setDeleteDialogOpen(false);
      setSopToDelete(null);
      fetchSOPs();
    } catch (error) {
      console.error('Error deleting SOP:', error);
      toast.error('Failed to delete SOP');
    } finally {
      setDeleting(false);
    }
  };

  // Check if SOP is assigned to any groups
  const isSOPAssigned = (sop: SOP): boolean => {
    return (sop.assignments && sop.assignments.length > 0) || 
           (sop.assigned_group_count && sop.assigned_group_count > 0) || false;
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingSOP(null);
    }
    setShowAddDialog(open);
  };

  // Truncate text helper
  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Render text with tooltip if truncated
  const renderTextWithTooltip = (text: string | null | undefined, maxLength: number = 25) => {
    if (!text) return <span>-</span>;
    const isTruncated = text.length > maxLength;
    const displayText = isTruncated ? truncateText(text, maxLength) : text;

    if (isTruncated) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">{displayText}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs break-words">{text}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <span>{displayText}</span>;
  };

  // Format date in 12-hour format with AM/PM
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const hoursStr = hours.toString().padStart(2, '0');
      
      return `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Real-time updates: refetch SOPs whenever SOP or sop_assigned changes for this client
  useRealTimeSubHook({
    channelName: 'sop-realtime',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId,
    onPayload: () => scheduleFetchSOPs(currentPageRef.current),
  });

  useRealTimeSubHook({
    channelName: 'sop-assigned-realtime',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_assigned',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId,
    onPayload: () => scheduleFetchSOPs(currentPageRef.current),
  });

  // Active filter count
  const activeFilterCount = [
    searchTerm,
    statusFilter !== 'all' ? statusFilter : '',
    categoryFilter !== 'all' ? categoryFilter : ''
  ].filter(value => {
    if (!value) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }).length;

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  const handleViewCompletedEmployees = async (sop: SOP) => {
    if ((sop.completed_count || 0) < 1) {
      return; 
    }

    if (!resolvedClientId) return;

    try {
      const { data, error } = await supabase
        .from('sop_signoff_request' as any)
        .select(`
          employee_id,
          employees (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('sop_id', sop.id)
        .eq('client_id', resolvedClientId)
        .eq('is_completed', true);

      if (error) {
        toast.error('Failed to load completed employees');
        return;
      }

      const employees =
        data?.map((item: any) => ({
          id: item.employees?.id,
          full_name: `${item.employees?.first_name || ''} ${item.employees?.last_name || ''}`,
          email: item.employees?.email
        })) || [];
        
      setCompletedEmployees(employees);
      setSelectedSopForCompleted(sop.title);
      setCompletedEmployeesDialogOpen(true);
    } catch (err) {
      toast.error('Error loading employees');
    }
  };

  const handleViewSOP = (sop: SOP) => {
    setViewingSOP(sop);
    setCompletedEmployeeIds(sop.completed_employee_ids || []);
    setViewDialogOpen(true);
  };

  return (
    <Layout>
      <div className="w-full py-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100 mx-6 mb-8">
          <SOPHeader
            onCreateSOP={handleCreateSOP}
            canCreateSOP={!isReadOnlySwitchedContext}
            onRefreshStats={() => scheduleFetchSOPs(currentPageRef.current)}
            loading={loading}
            totalSOPs={sopStats.totalSOPs}
            totalEmployeesInvolved={sopStats.totalEmployeesInvolved}
            totalSOPsSignedOff={sopStats.totalSOPsSignedOff}
            totalSOPsToBeDone={sopStats.totalSOPsToBeDone}
          />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-6 p-6">
          {/* Filters Section */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            {/* Search Box */}
            <DebouncedSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name, description, category..."
              className="w-[250px]"
              triggerOnEnter
            />

            {/* Category Filter */}
            <div className="w-[180px]">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="h-10"
              >
                <X className="h-4 w-4" />
                Clear Filters ({activeFilterCount})
              </Button>
            )}
          </div>


          {loading ? (
            <Loader text="Loading SOPs..." />
          ) : sops.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No SOPs found</p>
            </div>
          ) : (
            <TooltipProvider>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category Name</TableHead>
                    {isSuperAdmin ? (
                      <>
                        <TableHead>Assigned Groups</TableHead>
                        <TableHead>Assigned Employees</TableHead>
                        <TableHead>Signed Off</TableHead>
                        <TableHead>To be Done</TableHead>
                      </>
                                ) : (
                                  <>
                                    <TableHead>Assigned Groups</TableHead>
                                    <TableHead>Completed At</TableHead>
                                    <TableHead>Status</TableHead>
                                  </>
                                )}
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sops.map((sop) => (
                    <TableRow key={sop.id}>
                      <TableCell className="font-medium">
                        {renderTextWithTooltip(sop.title, 25)}
                      </TableCell>
                      <TableCell>
                        {renderTextWithTooltip(sop.description, 25)}
                      </TableCell>
                      <TableCell>
                        {renderTextWithTooltip(sop.category_name, 25)}
                      </TableCell>
                      {isSuperAdmin ? (
                        <>
                      <TableCell>
                            {sop.assigned_group_count && sop.assigned_group_count > 0 ? (
                          <Badge 
                            variant="outline" 
                            className="bg-orange-50 border-orange-300 text-orange-700 flex items-center gap-1.5 w-fit"
                          >
                                <Users className="h-3 w-3" />
                            <span>Yes</span>
                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-orange-700 bg-orange-100 rounded-full">
                                  {sop.assigned_group_count}
                            </span>
                          </Badge>
                        ) : (
                          <Badge 
                            variant="outline" 
                            className="bg-red-50 border-red-300 text-red-700 flex items-center gap-1.5 w-fit"
                          >
                                <Users className="h-3 w-3" />
                            <span>No</span>
                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-red-700 bg-red-100 rounded-full">
                                  {sop.assigned_group_count || 0}
                            </span>
                          </Badge>
                        )}
                      </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={(sop.assigned_employee_count || 0) > 0 
                                ? 'bg-blue-50 border-blue-300 text-blue-700 flex items-center gap-1.5 w-fit'
                                : 'bg-gray-50 border-gray-300 text-gray-700 flex items-center gap-1.5 w-fit'}
                            >
                              <User className="h-3 w-3" />
                              <span>{(sop.assigned_employee_count || 0) > 0 ? 'Yes' : 'No'}</span>
                              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${
                                (sop.assigned_employee_count || 0) > 0
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {sop.assigned_employee_count || 0}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              onClick={() => handleViewCompletedEmployees(sop)}
                              className={`bg-green-50 border-green-300 text-green-700 flex items-center gap-1.5 w-fit
                                ${ (sop.completed_count || 0) >= 1
                                    ? 'cursor-pointer hover:bg-green-100' 
                                    : 'cursor-default opacity-70'
                                }`}
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Done</span>
                              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-green-500 rounded-full">
                                {sop.completed_count ?? 0}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className="bg-amber-50 border-amber-300 text-amber-700 flex items-center gap-1.5 w-fit"
                            >
                              <Clock className="h-3 w-3" />
                              <span>Pending</span>
                              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-amber-500 rounded-full">
                                {sop.to_be_done_count ?? 0}
                              </span>
                            </Badge>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            {sop.assignments && sop.assignments.length > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 border-blue-300 text-blue-700 flex items-center gap-1.5 w-fit cursor-pointer hover:bg-blue-100"
                                onClick={() => {
                                  setSelectedGroupsForDialog(sop.assignments || []);
                                  setSelectedSopTitleForDialog(sop.title);
                                  setGroupDetailsDialogOpen(true);
                                }}
                              >
                                <Users className="h-3 w-3" />
                                <span>{sop.assignments.length} group{sop.assignments.length === 1 ? '' : 's'}</span>
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {sop.completed_date ? (
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Clock3 className="h-3.5 w-3.5" />
                                <span>{formatDate(sop.completed_date)}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {sop.signoff_request_status === 'Completed' ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Signed off
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                In-progress
                              </Badge>
                            )}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canManageSOPInCurrentContext ? (
                            <>
                              {(() => {
                                const isAssigned = isSOPAssigned(sop);
                                return (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditSOP(sop)}
                                            disabled={isAssigned}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Edit className={`h-4 w-4 ${isAssigned ? 'text-gray-400' : 'text-purple-600'}`} />
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      {isAssigned && (
                                        <TooltipContent>
                                          <p>Cannot edit SOP that is assigned to groups</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteClick(sop)}
                                            disabled={isAssigned}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Trash2 className={`h-4 w-4 ${isAssigned ? 'text-gray-400' : 'text-red-600'}`} />
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      {isAssigned && (
                                        <TooltipContent>
                                          <p>Cannot delete SOP that is assigned to groups</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewSOP(sop)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        handleAssignClick(sop);
                                      }}
                                      className="h-8 w-8 p-0"
                                      title="Assign Person"
                                    >
                                      <UserPlus className="h-4 w-4 text-purple-600" />
                                    </Button>
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (isReadOnlySwitchedContext) {
                                  handleViewSOP(sop);
                                } else {
                                  setSignoffSOP(sop);
                                  setSignoffDialogOpen(true);
                                }
                              }}
                              className="h-8 w-8 p-0"
                              title={isReadOnlySwitchedContext ? 'View' : 'Sign off'}
                            >
                              <Eye className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <TablePaginationBar
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                itemLabel="SOPs"
                onPageChange={setCurrentPage}
              />
            </div>
            </TooltipProvider>
          )}
        </div>

        {/* Add/Edit SOP Dialog */}
        <AddSOPDialog
          open={showAddDialog && !isReadOnlySwitchedContext}
          onOpenChange={handleDialogClose}
          onSuccess={handleSOPCreated}
          editingSOP={editingSOP}
        />

        {/* Assign SOP Dialog */}
        <AssignSOPDialog
          open={assignDialogOpen && !isReadOnlySwitchedContext}
          onOpenChange={handleAssignDialogChange}
          sopId={assigningSOP?.id || null}
          clientId={resolvedClientId}
          employeeId={employeeData?.id || null}
          initialGroupIds={
            assigningSOP?.assignments
              ?.map((a) => a.group_id)
              .filter((id): id is string => Boolean(id)) || []
          }
          onAssigned={handleAssignedSummaryUpdate}
        />

        {/* View SOP Dialog */}
        <ViewSOPDialog
          open={viewDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setViewingSOP(null);
            }
            setViewDialogOpen(open);
          }}
          sop={viewingSOP}
          completedEmployeeIds={completedEmployeeIds}
        />

        {/* Group Details Dialog */}
        <GroupDetailsDialog
          open={groupDetailsDialogOpen}
          onOpenChange={setGroupDetailsDialogOpen}
          groups={selectedGroupsForDialog}
          sopTitle={selectedSopTitleForDialog}
          isSuperAdmin={isSuperAdmin}
        />

        {/* Signoff Request Dialog */}
        <SignoffRequestDialog
          open={signoffDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setSignoffSOP(null);
            }
            setSignoffDialogOpen(open);
          }}
          sop={signoffSOP}
          clientId={resolvedClientId}
          employeeId={employeeData?.id || null}
          sopSignoffRequestExist={signoffSOP?.sop_signoff_request_exist}
          onSuccess={() => {
            fetchSOPs();
          }}
        />
        <CompletedEmployeesDialog
          open={completedEmployeesDialogOpen}
          onOpenChange={setCompletedEmployeesDialogOpen}
          employees={completedEmployees}
          sopTitle={selectedSopForCompleted}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen && !isReadOnlySwitchedContext} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete SOP</AlertDialogTitle>
              <AlertDialogDescription className='break-all whitespace-normal'>
                Are you sure you want to delete "{sopToDelete?.title}"? <br />
                <span> This action cannot be undone.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm} 
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default SOPPage;

