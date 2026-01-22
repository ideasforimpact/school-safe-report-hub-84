import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import SOPHeader from '@/components/sop/SOPHeader';
import AssignSOPDialog from '@/components/sop/AssignSOPDialog';
import AddSOPDialog from '@/components/sop/AddSOPDialog';
import ViewSOPDialog from '@/components/sop/ViewSOPDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Eye, UserPlus, Search, Users, User } from 'lucide-react';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';

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
  creator_name?: string | null;
  assignments?: {
    group_id: string | null;
    group_name: string | null;
    group_type: string | null;
    group_status: boolean | null;
    employee_count?: number | null;
    created_by_id: string | null;
    created_by_name: string | null;
  }[];
}

const SOPPage = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSOP, setEditingSOP] = useState<SOP | null>(null);
  const [assigningSOP, setAssigningSOP] = useState<SOP | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewingSOP, setViewingSOP] = useState<SOP | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [sops, setSops] = useState<SOP[]>([]);
  const [allSops, setAllSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  const { client } = useClient();

  // Resolve clientId similarly to AddSOPDialog to avoid null client from context
  const resolvedClientId = employeeData?.clientId || employeeData?.client?.id || client?.id || null;

  useEffect(() => {
    fetchSOPs();
  }, []);

  // Filter SOPs based on search and status
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
      const statusValue = statusFilter === 'active';
      filtered = filtered.filter((sop) => sop.status === statusValue);
    }

    setSops(filtered);
  }, [searchTerm, statusFilter, allSops]);

  const fetchSOPs = async () => {
    setLoading(true);
    try {
      const clientId = client?.id || null;
      const employeeId = employeeData?.id || null;

      const { data, error } = await supabase.functions.invoke('fetch-sop', {
        body: {
          client_id: clientId,
          employee_id: employeeId,
          is_super_admin: isSuperAdmin,
        },
      });

      if (error) {
        console.error('Error fetching SOPs:', error);
        toast.error('Failed to load SOPs');
        return;
      }

      if (data && data.error) {
        toast.error(data.error || 'Failed to load SOPs');
        return;
      }

      if (data && data.success) {
        const sopList = data.data || [];
        setAllSops(sopList);
        setSops(sopList);
      }
    } catch (error) {
      console.error('Error fetching SOPs:', error);
      toast.error('Failed to load SOPs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSOP = () => {
    setEditingSOP(null);
    setShowAddDialog(true);
  };

  const handleEditSOP = (sop: SOP) => {
    setEditingSOP(sop);
    setShowAddDialog(true);
  };

  const handleSOPCreated = () => {
    // Refresh SOP list after create/update
    fetchSOPs();
    setEditingSOP(null);
  };

  const handleAssignClick = (sop: SOP) => {
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

  // Real-time updates: refetch SOPs whenever SOP or sop_assigned changes for this client
  useRealTimeSubHook({
    channelName: 'sop-realtime',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId,
    onPayload: () => {
      fetchSOPs();
    },
  });

  useRealTimeSubHook({
    channelName: 'sop-assigned-realtime',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_assigned',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId,
    onPayload: () => {
      fetchSOPs();
    },
  });

  return (
    <Layout>
      <div className="w-full py-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100 mx-6 mb-8">
          <SOPHeader onCreateSOP={handleCreateSOP} />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-6 p-6">
          {/* Filters Section */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, description, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
              <p className="text-gray-500">Loading SOPs...</p>
            </div>
          ) : sops.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No SOPs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Assigned Groups</TableHead>
                    <TableHead>Assigned Employees</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>To be Done</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sops.map((sop) => (
                    <TableRow key={sop.id}>
                      <TableCell className="font-medium">
                        {truncateText(sop.title, 15)}
                      </TableCell>
                      <TableCell>
                        {sop.description || '-'}
                      </TableCell>
                      <TableCell>
                        {sop.category_name ? truncateText(sop.category_name, 15) : '-'}
                      </TableCell>
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
                        <span className="text-sm text-gray-600">-</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">-</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSOP(sop)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-purple-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewingSOP(sop);
                              setViewDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="View"
                          >
                            <Eye className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement assign person functionality
                              handleAssignClick(sop);
                            }}
                            className="h-8 w-8 p-0"
                            title="Assign Person"
                          >
                            <UserPlus className="h-4 w-4 text-purple-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Add/Edit SOP Dialog */}
        <AddSOPDialog
          open={showAddDialog}
          onOpenChange={handleDialogClose}
          onSuccess={handleSOPCreated}
          editingSOP={editingSOP}
        />

        {/* Assign SOP Dialog */}
        <AssignSOPDialog
          open={assignDialogOpen}
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
        />
      </div>
    </Layout>
  );
};

export default SOPPage;

