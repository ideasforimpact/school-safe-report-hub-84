import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, X } from 'lucide-react';
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
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGroups((data || []) as Group[]);
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
    setEditingGroup(group);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (group: Group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete || !clientId || !employeeId) return;

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
                    <Badge
                      variant={group.group_type === 'Department' ? 'default' : 'secondary'}
                    >
                      {group.group_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={group.status ? 'default' : 'secondary'}>
                      {group.status ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditGroup(group)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(group)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
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

