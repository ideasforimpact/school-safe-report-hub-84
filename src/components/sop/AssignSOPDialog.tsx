import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import SearchMultiSelect, { SearchMultiSelectOption } from '@/components/common/SearchMultiSelect';

interface GroupOption {
  id: string;
  name: string;
  group_type: string | null;
}

interface AssignSOPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sopId: string | null;
  clientId: string | null;
  employeeId: string | null;
  initialGroupIds?: string[] | null;
  onAssigned: (assignedCount: number) => void;
}

const AssignSOPDialog: React.FC<AssignSOPDialogProps> = ({
  open,
  onOpenChange,
  sopId,
  clientId,
  employeeId,
  initialGroupIds,
  onAssigned,
}) => {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedGroupIds(initialGroupIds?.filter(Boolean) || []);
      setSearch('');
      if (clientId && employeeId) {
        fetchGroups();
      } else {
        // If IDs are missing, keep list empty; Save will still be blocked
        console.warn('AssignSOPDialog opened without client or employee id');
      }
    }
  }, [open]);

  const fetchGroups = async () => {
    if (!clientId || !employeeId) return;
    try {
      setLoadingGroups(true);
      const { data, error } = await supabase.functions.invoke('fetch-active-groups', {
        body: { client_id: clientId },
      });
      if (error) throw error;
      setGroups((data?.data || []) as GroupOption[]);
    } catch (error: any) {
      console.error('Error fetching groups for SOP assignment:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSave = async () => {
    if (!sopId || !clientId || !employeeId) {
      toast.error('Missing SOP, client or employee information');
      return;
    }

    if (selectedGroupIds.length === 0) {
      toast.error('Please select at least one group');
      return;
    }

    try {
      setSubmitting(true);

      const { data, error } = await supabase.functions.invoke('assign-sop', {
        body: {
          sop_id: sopId,
          client_id: clientId,
          employee_id: employeeId,
          group_ids: selectedGroupIds,
        },
      });

      if (error) {
        console.error('Error assigning SOP:', error);
        const message =
          (error as any)?.message ||
          (error as any)?.error ||
          'Failed to assign SOP';
        toast.error(message);
        return;
      }

      if (data?.error) {
        const detail = data.details ? `: ${data.details}` : '';
        toast.error(`${data.error}${detail}` || 'Failed to assign SOP');
        return;
      }

      // Expecting data.assigned_summary with groups and employees and total_count
      const assignedCount = data?.assigned_summary?.total_count ?? 0;
      onAssigned(assignedCount);
      toast.success('SOP assigned successfully');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning SOP:', error);
      const message = error?.message || 'Failed to assign SOP';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const options: SearchMultiSelectOption[] = groups.map((g) => ({
    id: g.id,
    label: g.name,
    description: g.group_type,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px]"
        onOpenAutoFocus={(event) => {
          // Prevent auto-focus so the dropdown doesn't open until user clicks
          event.preventDefault();
        }}
        onInteractOutside={(event) => {
          // Disable closing when clicking outside the dialog
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Assign SOP to Groups</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>
              Select Groups <span className="text-red-500">*</span>
            </Label>
            <SearchMultiSelect
              options={options}
              selectedIds={selectedGroupIds}
              onChange={setSelectedGroupIds}
                placeholder="Search groups by name or type..."
              disabled={loadingGroups}
            />
                    </div>

          {selectedGroupIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">
                Selected Groups ({selectedGroupIds.length})
              </p>
              <ScrollArea className="max-h-32 rounded-md border p-2">
                <div className="flex flex-wrap gap-2">
                  {groups
                    .filter((group) => selectedGroupIds.includes(group.id))
                    .map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-800 break-all whitespace-normal"
                      >
                        <span>
                          {group.name}
                          {group.group_type && (
                            <span className="ml-1 text-[10px] text-blue-700">
                              ({group.group_type})
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.id)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <p className="text-xs text-gray-500">
            You can select multiple groups. At least one group is required to enable Save.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting || selectedGroupIds.length === 0}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignSOPDialog;


