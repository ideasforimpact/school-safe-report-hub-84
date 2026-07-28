
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAssessmentAccess } from '@/hooks/assessments/useAssessmentAccess';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import AssigneeMultiSelect from './create/AssigneeMultiSelect';
import { AssigneeEmployee } from '@/types/assessment';

interface ReassignAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: number;
  currentAssigneeIds: string[];
  assessment: {
    id: string;
    name: string;
    created_by: string;
    client_id: string;
    target_completion_date: string;
  };
  onReassignSuccess: () => void;
}

const ReassignAssessmentDialog: React.FC<ReassignAssessmentDialogProps> = ({
  open,
  onOpenChange,
  assessmentId,
  currentAssigneeIds,
  assessment,
  onReassignSuccess
}) => {
  const { clientId } = useAssessmentAccess();
  const [employees, setEmployees] = useState<AssigneeEmployee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(currentAssigneeIds);
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const lastFetchRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  useEffect(() => {
    if (open) {
      setSelectedEmployeeIds(currentAssigneeIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assessmentId]);

  const fetchEmployees = useCallback(async () => {
    if (!clientId) return;
    const now = Date.now();
    const key = `${open}:${clientId}`;
    if (lastFetchRef.current.key === key && now - lastFetchRef.current.time < 2000) return;
    lastFetchRef.current = { key, time: now };

    try {
      setFetchingEmployees(true);
      const { data, error } = await supabase.functions.invoke('list-assessments', {
        body: { client_id: clientId },
        headers: { path: 'employees' },
      });

      if (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employees');
        return;
      }

      setEmployees((data?.employees || []) as AssigneeEmployee[]);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setFetchingEmployees(false);
    }
  }, [clientId, open]);

  useEffect(() => {
    if (open && clientId) {
      fetchEmployees();
    }
  }, [open, clientId, fetchEmployees]);

  const handleSave = async () => {
    if (selectedEmployeeIds.length === 0) {
      toast.error('Please assign at least one employee');
      return;
    }

    try {
      setLoading(true);

      const assignees = selectedEmployeeIds
        .map(id => employees.find(emp => emp.id === id))
        .filter((emp): emp is AssigneeEmployee => !!emp)
        .map(emp => ({
          id: emp.id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          email: emp.email,
        }));

      const { error } = await supabase.functions.invoke('reassign-assessment', {
        body: {
          assessment_id: assessmentId,
          client_id: clientId,
          assigned_to: selectedEmployeeIds,
          assignees,
        },
      });

      if (error) {
        console.error('Error updating assignees:', error);
        toast.error('Failed to update assignees');
        return;
      }

      toast.success('Assignees updated successfully');

      onReassignSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating assignees:', error);
      toast.error('Failed to update assignees');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedEmployeeIds(currentAssigneeIds);
  };

  const handleEmployeeUpdate = useCallback(async () => {
    await fetchEmployees();
  }, [fetchEmployees]);

  useRealTimeSubHook({
    channelName: `employees-${clientId}`,
    events: "*",
    table: "employees",
    enabled: !!clientId,
    onPayload: handleEmployeeUpdate,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Assignees</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1 block">
              Assign To
            </Label>
            {fetchingEmployees ? (
              <p className="text-sm text-gray-500">Loading employees...</p>
            ) : (
              <AssigneeMultiSelect
                employees={employees}
                selectedIds={selectedEmployeeIds}
                onChange={setSelectedEmployeeIds}
              />
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || fetchingEmployees || selectedEmployeeIds.length === 0}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReassignAssessmentDialog;
