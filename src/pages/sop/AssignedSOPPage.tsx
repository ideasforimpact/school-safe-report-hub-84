import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Search, Users, Eye, Clock3, FileText, ExternalLink } from 'lucide-react';
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
import { getEmployeeSOPStatistics } from '@/services/sop/sopStatisticsService';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { useCallback } from 'react';
import { formatDate } from '@/lib/Dateformat';

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

  // Fetch employee statistics
  const fetchEmployeeStatistics = useCallback(async () => {
    if (!resolvedClientId || !employeeData?.id) {
      setStatisticsLoading(false);
      return;
    }

    try {
      console.log('[AssignedSOPPage] Fetching employee statistics...', { resolvedClientId, employeeId: employeeData.id });
      setStatisticsLoading(true);
      const stats = await getEmployeeSOPStatistics(resolvedClientId, employeeData.id);
      console.log('[AssignedSOPPage] Employee statistics fetched:', stats);
      setEmployeeTotalSOPs(stats.totalSOPs);
      setEmployeeTotalSOPsSignedOff(stats.totalSOPsSignedOff);
      setEmployeeTotalSOPsToBeDone(stats.totalSOPsToBeDone);
    } catch (error) {
      console.error('[AssignedSOPPage] Error fetching employee SOP statistics:', error);
    } finally {
      setStatisticsLoading(false);
    }
  }, [resolvedClientId, employeeData?.id]);

  useEffect(() => {
    if (resolvedClientId && employeeData?.id) {
    fetchAssignedSOPs();
      fetchEmployeeStatistics();
      fetchCategories();
    }
  }, [resolvedClientId, employeeData?.id, fetchEmployeeStatistics]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('sop_categories' as any)
        .select('id, category_name')
        .order('category_name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories((data || []) as unknown as Array<{ id: string; category_name: string }>);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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
      if (statusFilter === 'completed') {
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

  const fetchAssignedSOPs = async () => {
    setLoading(true);
    try {
      const clientId = resolvedClientId;
      const employeeId = employeeData?.id || null;

      if (!clientId || !employeeId) {
        toast.error('Client ID or Employee ID not found');
        setLoading(false);
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
        const sopList = data.data || [];
        setAllSops(sopList);
        setSops(sopList);
      }
    } catch (error) {
      console.error('Error fetching assigned SOPs:', error);
      toast.error('Failed to load assigned SOPs');
    } finally {
      setLoading(false);
    }
  };

  // Truncate text helper
  const truncateText = (text: string, maxLength: number) => {
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

  // Real-time updates for employee statistics
  useRealTimeSubHook({
    channelName: 'assigned-sop-stats-assigned',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_assigned',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && !!employeeData?.id,
    onPayload: (payload) => {
      console.log('[AssignedSOPPage] Real-time update from sop_assigned table:', payload.eventType, payload);
      setTimeout(() => {
        fetchEmployeeStatistics();
      }, 100);
    },
  });

  useRealTimeSubHook({
    channelName: 'assigned-sop-stats-signoff',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_signoff_request',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && !!employeeData?.id,
    onPayload: (payload) => {
      console.log('[AssignedSOPPage] Real-time update from sop_signoff_request table:', payload.eventType, payload);
      setTimeout(() => {
        fetchEmployeeStatistics();
      }, 100);
    },
  });

  useRealTimeSubHook({
    channelName: 'assigned-sop-stats-group-employees',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'group_employees',
    enabled: !!resolvedClientId && !!employeeData?.id,
    onPayload: (payload) => {
      console.log('[AssignedSOPPage] Real-time update from group_employees table:', payload.eventType, payload);
      setTimeout(() => {
        fetchEmployeeStatistics();
      }, 100);
    },
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <div className="text-center py-12">
              <p className="text-gray-500">Loading assigned SOPs...</p>
            </div>
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
            fetchEmployeeStatistics();
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
