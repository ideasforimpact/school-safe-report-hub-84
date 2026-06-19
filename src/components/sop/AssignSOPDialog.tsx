import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import SearchMultiSelect, { SearchMultiSelectOption } from '@/components/common/SearchMultiSelect';
import { useActiveGroups, useAssignSop } from '@/hooks/sop/useSopQueries';

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
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // ─── React Query hooks ──────────────────────────────────────────────────────
  const { data: groups = [], isFetching: loadingGroups } = useActiveGroups(
    clientId,
    open && !!clientId && !!employeeId,
  );
  const assignMutation = useAssignSop();
  const submitting = assignMutation.isPending;

  useEffect(() => {
    if (open) {
      setSelectedGroupIds(initialGroupIds?.filter(Boolean) || []);
      if (!clientId || !employeeId) {
        console.warn('AssignSOPDialog opened without client or employee id');
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSave = () => {
    if (!sopId || !clientId || !employeeId) {
      toast.error('Missing SOP, client or employee information');
      return;
    }

    if (selectedGroupIds.length === 0) {
      toast.error('Please select at least one group');
      return;
    }
    assignMutation.mutate(
      { sop_id: sopId, client_id: clientId, employee_id: employeeId, group_ids: selectedGroupIds },
      {
        onSuccess: (data) => {
          const assignedCount = data?.assigned_summary?.total_count ?? 0;
          onAssigned(assignedCount);
          onOpenChange(false);
        },
      }
    );
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


