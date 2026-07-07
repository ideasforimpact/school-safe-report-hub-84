import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import TablePaginationBar from '@/components/common/TablePaginationBar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Users, Eye, Clock3, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData } from '@/store/employeeSelectors';
import { useClient } from '@/contexts/ClientContext';
import SignoffRequestDialog from '@/components/sop/SignoffRequestDialog';
import GroupDetailsDialog from '@/components/sop/GroupDetailsDialog';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { formatDate } from '@/lib/Dateformat';
import Loader from '@/components/common/Loader';
import { useAssignedSopList, sopKeys } from '@/hooks/sop/useSopQueries';

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
  assigned_group_count?: number;
  assigned_employee_count?: number;
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
}

const PAGE_SIZE = 10;

const AssignedSOPPage = () => {
  const navigate = useNavigate();
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  const { client } = useClient();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<Array<{ id: string; category_name: string }>>([]);

  const [signoffDialogOpen, setSignoffDialogOpen] = useState(false);
  const [signoffSOP, setSignoffSOP] = useState<SOP | null>(null);
  const [groupDetailsDialogOpen, setGroupDetailsDialogOpen] = useState(false);
  const [selectedGroupsForDialog, setSelectedGroupsForDialog] = useState<NonNullable<SOP['assignments']>>([]);
  const [selectedSopTitleForDialog, setSelectedSopTitleForDialog] = useState<string>('');

  const resolvedClientId = employeeData?.clientId || employeeData?.client?.id || client?.id || null;

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  // ─── React Query ─────────────────────────────────────────────────────────────
  const { data, isFetching: loading } = useAssignedSopList({
    clientId: resolvedClientId,
    employeeId: employeeData?.id || null,
    search: searchTerm,
    status: statusFilter,
    categoryId: categoryFilter,
    page: currentPage,
    limit: PAGE_SIZE,
  });

  const sops: SOP[] = data?.data || [];
  const totalCount = data?.pagination?.total ?? sops.length;
  const signedOffCount = sops.filter(s => s.signoff_request_status === 'Completed').length;
  const employeeTotalSOPs = totalCount;
  const employeeTotalSOPsSignedOff = signedOffCount;
  const employeeTotalSOPsToBeDone = Math.max(0, totalCount - signedOffCount);

  // Build category filter options from current page data
  useEffect(() => {
    if (!data?.data?.length) return;
    const seen = new Set<string>();
    setCategories(
      (data.data as SOP[])
        .filter((s) => s.category_id && s.category_name && !seen.has(s.category_id) && seen.add(s.category_id))
        .map((s) => ({ id: s.category_id, category_name: s.category_name as string }))
        .sort((a, b) => a.category_name.localeCompare(b.category_name))
    );
  }, [data]);

  const invalidateAssignedSops = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: sopKeys.assignedLists() });
  }, [queryClient]);

  // ─── Realtime ─────────────────────────────────────────────────────────────────
  useRealTimeSubHook({
    channelName: 'assigned-sop-realtime-assigned',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_assigned',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && !!employeeData?.id,
    onPayload: invalidateAssignedSops,
  });

  useRealTimeSubHook({
    channelName: 'assigned-sop-realtime-signoff',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_signoff_request',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && !!employeeData?.id,
    onPayload: invalidateAssignedSops,
  });

  useRealTimeSubHook({
    channelName: 'assigned-sop-realtime-group-employees',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'group_employees',
    enabled: !!resolvedClientId && !!employeeData?.id,
    onPayload: invalidateAssignedSops,
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const activeFilterCount = [
    searchTerm,
    statusFilter !== 'all' ? statusFilter : '',
    categoryFilter !== 'all' ? categoryFilter : '',
  ].filter((value) => typeof value === 'string' && value.trim() !== '').length;

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

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

  return (
    <Layout>
      <div className="w-full py-6">
        {/* Header Section */}
        <div className="mx-6 mb-8 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/sops')}
                className="flex items-center gap-2 mt-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <FileText className="h-6 w-6 text-primary" />
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold">Assigned SOP</h1>
                <p className="text-gray-500 text-sm">
                  View SOPs assigned to you
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Total SOPs</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      {loading ? '-' : employeeTotalSOPs}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total SOPs Signed off</p>
                    <p className="text-3xl font-semibold text-green-600">
                      {loading ? '-' : employeeTotalSOPsSignedOff}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To be Done</p>
                    <p className="text-3xl font-semibold text-orange-600">
                      {loading ? '-' : employeeTotalSOPsToBeDone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-6 p-6">
          {/* Filters Section */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <DebouncedSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name, description, category..."
              className="w-[250px]"
              triggerOnEnter
            />

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

            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="signed-off">Signed Off</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear Filters ({activeFilterCount})
              </Button>
            )}
          </div>

          {loading ? (
            <Loader text="Loading assigned SOPs..." />
          ) : sops.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No assigned SOPs found</p>
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
                      <TableHead>Assigned Groups</TableHead>
                      <TableHead>Completed At</TableHead>
                      <TableHead>Status</TableHead>
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
                            <Badge className="bg-green-100 text-green-800">Signed off</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800">In-progress</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSignoffSOP(sop);
                              setSignoffDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="View"
                          >
                            <Eye className="h-4 w-4 text-green-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

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

        <SignoffRequestDialog
          open={signoffDialogOpen}
          onOpenChange={(open) => {
            if (!open) setSignoffSOP(null);
            setSignoffDialogOpen(open);
          }}
          sop={signoffSOP}
          clientId={resolvedClientId}
          employeeId={employeeData?.id || null}
          sopSignoffRequestExist={signoffSOP?.sop_signoff_request_exist}
          onSuccess={invalidateAssignedSops}
        />

        <GroupDetailsDialog
          open={groupDetailsDialogOpen}
          onOpenChange={setGroupDetailsDialogOpen}
          groups={selectedGroupsForDialog}
          sopTitle={selectedSopTitleForDialog}
          isSuperAdmin={false}
        />
      </div>
    </Layout>
  );
};

export default AssignedSOPPage;
