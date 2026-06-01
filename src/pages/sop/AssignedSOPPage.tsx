import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { ArrowLeft, Search, Users, Eye, Clock3, FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

const AssignedSOPPage = () => {
  const navigate = useNavigate();
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  const { client } = useClient();
  const [sops, setSops] = useState<SOP[]>([]);
  const [allSops, setAllSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{ id: string; category_name: string }>>([]);
  const [signoffDialogOpen, setSignoffDialogOpen] = useState(false);
  const [signoffSOP, setSignoffSOP] = useState<SOP | null>(null);
  const [groupDetailsDialogOpen, setGroupDetailsDialogOpen] = useState(false);
  const [selectedGroupsForDialog, setSelectedGroupsForDialog] = useState<any[]>([]);
  const [selectedSopTitleForDialog, setSelectedSopTitleForDialog] = useState<string>('');

  // Statistics state
  const [employeeTotalSOPs, setEmployeeTotalSOPs] = useState(0);
  const [employeeTotalSOPsSignedOff, setEmployeeTotalSOPsSignedOff] = useState(0);
  const [employeeTotalSOPsToBeDone, setEmployeeTotalSOPsToBeDone] = useState(0);
  const [statisticsLoading, setStatisticsLoading] = useState(true);

  // Resolve clientId from employeeData (same pattern as SOPPage)
  const resolvedClientId = employeeData?.clientId || employeeData?.client?.id || client?.id || null;

  // Guards to prevent concurrent / duplicate fetch-assigned-sop calls
  const fetchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDirectFetchRef = useRef<number>(0);

  useEffect(() => {
    if (resolvedClientId && employeeData?.id) {
      fetchAssignedSOPs();
    }
  }, [resolvedClientId, employeeData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter SOPs based on search, status, and category
  useEffect(() => {
    let filtered = [...allSops];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (sop) =>
          sop.title.toLowerCase().includes(searchLower) ||
          (sop.description && sop.description.toLowerCase().includes(searchLower)) ||
          (sop.category_name && sop.category_name.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'signed-off') {
        filtered = filtered.filter((sop) => sop.signoff_request_status === 'Completed');
      } else if (statusFilter === 'in-progress') {
        filtered = filtered.filter((sop) => sop.signoff_request_status !== 'Completed');
      }
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((sop) => sop.category_id === categoryFilter);
    }

    setSops(filtered);
  }, [searchTerm, statusFilter, categoryFilter, allSops]);

  const fetchAssignedSOPs = useCallback(async () => {
    if (fetchingRef.current) return; // drop concurrent call
    fetchingRef.current = true;
    lastDirectFetchRef.current = Date.now();
    setLoading(true);
    try {
      const clientId = resolvedClientId;
      const employeeId = employeeData?.id || null;

      if (!clientId || !employeeId) {
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      const { data, error } = await supabase.functions.invoke('fetch-assigned-sop', {
        body: {
          client_id: clientId,
          employee_id: employeeId,
        },
      });

      if (error) {
        console.error('Error fetching assigned SOPs:', error);
        toast.error('Failed to load assigned SOPs');
        return;
      }

      if (data && data.error) {
        toast.error(data.error || 'Failed to load assigned SOPs');
        return;
      }

      if (data && data.success) {
        const sopList: any[] = data.data || [];
        setAllSops(sopList);
        setSops(sopList);

        // Derive unique categories from fetched SOPs (for filter dropdown)
        const seen = new Set<string>();
        const derived = sopList
          .filter((s) => s.category_id && s.category_name && !seen.has(s.category_id) && seen.add(s.category_id))
          .map((s) => ({ id: s.category_id, category_name: s.category_name }))
          .sort((a, b) => a.category_name.localeCompare(b.category_name));
        setCategories(derived);

        // Compute statistics from the same data — no extra edge function call needed
        const total = sopList.length;
        const signedOff = sopList.filter((s) => s.signoff_request_status === 'Completed').length;
        setEmployeeTotalSOPs(total);
        setEmployeeTotalSOPsSignedOff(signedOff);
        setEmployeeTotalSOPsToBeDone(Math.max(0, total - signedOff));
        setStatisticsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching assigned SOPs:', error);
      toast.error('Failed to load assigned SOPs');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [resolvedClientId, employeeData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced wrapper — suppressed for 2s after a direct fetch to avoid double-calling
  // when the same DB write triggers both the success callback and a real-time event
  const scheduleFetchAssignedSOPs = useCallback(() => {
    if (Date.now() - lastDirectFetchRef.current < 2000) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchAssignedSOPs(), 300);
  }, [fetchAssignedSOPs]);

  // Truncate text helper
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const activeFilterCount = [
    searchTerm,
    statusFilter !== 'all' ? statusFilter : '',
    categoryFilter !== 'all' ? categoryFilter : '',
  ].filter((value) => {
    if (!value) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }).length;

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
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

  // Real-time updates: refresh assigned SOPs (stats recomputed from the same response)
  useRealTimeSubHook({
    channelName: 'assigned-sop-realtime-assigned',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_assigned',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && !!employeeData?.id,
    onPayload: () => scheduleFetchAssignedSOPs(),
  });

  useRealTimeSubHook({
    channelName: 'assigned-sop-realtime-signoff',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_signoff_request',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && !!employeeData?.id,
    onPayload: () => scheduleFetchAssignedSOPs(),
  });

  useRealTimeSubHook({
    channelName: 'assigned-sop-realtime-group-employees',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'group_employees',
    enabled: !!resolvedClientId && !!employeeData?.id,
    onPayload: () => scheduleFetchAssignedSOPs(),
  });

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

                {/* Metrics in one row with 3 columns */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Total SOPs */}
                  <div>
                    <p className="text-sm text-gray-500">Total SOPs</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      {statisticsLoading ? '-' : employeeTotalSOPs}
                    </p>
                  </div>

                  {/* Total SOPs Signed off */}
                  <div>
                    <p className="text-sm text-gray-500">Total SOPs Signed off</p>
                    <p className="text-3xl font-semibold text-green-600">
                      {statisticsLoading ? '-' : employeeTotalSOPsSignedOff}
                    </p>
                  </div>

                  {/* To be Done */}
                  <div>
                    <p className="text-sm text-gray-500">To be Done</p>
                    <p className="text-3xl font-semibold text-orange-600">
                      {statisticsLoading ? '-' : employeeTotalSOPsToBeDone}
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
            {/* Search Box */}
            <div className="relative w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, description, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

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

          {/* Results Count */}
          {!loading && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing {sops.length} of {allSops.length} SOPs
              </p>
            </div>
          )}

          {loading ? (
            <Loader text= "Loading assigned SOPs..." />
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
                          <Badge className="bg-green-100 text-green-800">
                            Signed off
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800">
                            In-progress
                          </Badge>
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
            </div>
            </TooltipProvider>
          )}
        </div>

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
            fetchAssignedSOPs();
          }}
        />

        {/* Group Details Dialog */}
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
