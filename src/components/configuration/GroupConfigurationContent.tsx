import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, X, Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AddGroupDialog from './AddGroupDialog';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Group {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  status: boolean;
  client_id: string;
  employee_id: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  is_assigned_to_sop?: boolean;
}

const GroupConfigurationContent = () => {
  const { employeeData, user } = useAuth();
  const clientId = employeeData?.clientId || user?.clientId;
  const employeeId = employeeData?.id || user?.id;

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  useEffect(() => {
    if (clientId) {
      fetchGroups();
    }
  }, [clientId]);

  const fetchGroups = async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups' as any)
        .select('*, group_employees:group_employees(count)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get all group IDs to check SOP assignments
      const groupIds = (data || []).map((g: any) => g.id);

      // Check which groups are assigned to any SOP
      let assignedGroupIds = new Set<string>();
      if (groupIds.length > 0) {
        const { data: sopAssignedData, error: sopAssignedError } = await supabase
          .from('sop_assigned')
          .select('group_id')
          .in('group_id', groupIds)
          .not('group_id', 'is', null);

        if (sopAssignedError) {
          console.error('Error checking SOP assignments:', sopAssignedError);
        } else if (sopAssignedData) {
          assignedGroupIds = new Set(
            sopAssignedData
              .map((item: any) => item.group_id)
              .filter((id: string | null) => id !== null)
          );
        }
      }

      const mapped = (data || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        group_type: g.group_type,
        status: g.status,
        client_id: g.client_id,
        employee_id: g.employee_id,
        created_at: g.created_at,
        updated_at: g.updated_at,
        member_count: Array.isArray(g.group_employees) && g.group_employees.length > 0
          ? g.group_employees[0].count
          : 0,
        is_assigned_to_sop: assignedGroupIds.has(g.id),
      })) as Group[];

      setGroups(mapped);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = useMemo(() => {
    let filtered = [...groups];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (group) =>
          group.name.toLowerCase().includes(search) ||
          (group.description && group.description.toLowerCase().includes(search))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const statusValue = statusFilter === 'active';
      filtered = filtered.filter((group) => group.status === statusValue);
    }

    return filtered;
  }, [groups, searchTerm, statusFilter]);

  const handleAddGroup = () => {
    setEditingGroup(null);
    setIsAddDialogOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    // Safety check: prevent editing if group is assigned to any SOP
    if (group.is_assigned_to_sop) {
      toast.error('Cannot edit group that is assigned to any SOP');
      return;
    }
    setEditingGroup(group);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (group: Group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete || !clientId || !employeeId) return;

    // Safety check: prevent deletion if group is assigned to any SOP
    if (groupToDelete.is_assigned_to_sop) {
      toast.error('Cannot delete group that is assigned to any SOP');
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('create-group', {
        body: {
          action: 'delete',
          group_id: groupToDelete.id,
          client_id: clientId,
          employee_id: employeeId,
        },
      });

      if (error) throw error;

      toast.success('Group deleted successfully');
      fetchGroups();
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(error?.message || 'Failed to delete group');
    }
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingGroup(null);
  };

  const handleDialogSuccess = () => {
    fetchGroups();
    handleDialogClose();
  };

  const truncateText = (text: string | null, maxLength: number = 20) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search groups..."
            className="w-full"
          />
        </div>
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(searchTerm || statusFilter !== 'all') && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        </div>
        <Button onClick={handleAddGroup} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Group
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Group Type</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No groups found
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div
                      className="cursor-help"
                      title={group.name}
                    >
                      {truncateText(group.name, 20)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="cursor-help"
                      title={group.description || ''}
                    >
                      {truncateText(group.description, 20)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                      {group.group_type === 'Department' ? 'Department' : 'Employee'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {group.member_count && group.member_count > 0 ? (
                      <Badge
                        variant="outline"
                        className="bg-orange-50 border-orange-300 text-orange-700 flex items-center gap-1.5 w-fit"
                      >
                        <Users className="h-3 w-3" />
                        <span>Yes</span>
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-orange-500 rounded-full">
                          {group.member_count}
                        </span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-red-50 border-red-300 text-red-700 flex items-center gap-1.5 w-fit"
                      >
                        <Users className="h-3 w-3" />
                        <span>No</span>
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {group.member_count || 0}
                        </span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                        group.status
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {group.status ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditGroup(group)}
                                disabled={group.is_assigned_to_sop}
                              >
                                <Edit className={`h-4 w-4 ${group.is_assigned_to_sop ? 'text-gray-400' : 'text-purple-600'}`} />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {group.is_assigned_to_sop && (
                            <TooltipContent>
                              <p>Cannot edit group that is assigned to any SOP</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(group)}
                                disabled={group.is_assigned_to_sop}
                              >
                                <Trash2 className={`h-4 w-4 ${group.is_assigned_to_sop ? 'text-gray-400' : 'text-red-500'}`} />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {group.is_assigned_to_sop && (
                            <TooltipContent>
                              <p>Cannot delete group that is assigned to any SOP</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <AddGroupDialog
        isOpen={isAddDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        editingGroup={editingGroup}
        clientId={clientId || ''}
        employeeId={employeeId || ''}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the group "{groupToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupConfigurationContent;

