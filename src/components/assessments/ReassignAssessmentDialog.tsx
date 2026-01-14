
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAssessmentAccess } from '@/hooks/assessments/useAssessmentAccess';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ReassignAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: number;
  currentAssigneeId: string | null;
  currentAssigneeName: string;
  onReassignSuccess: () => void;
}

const ReassignAssessmentDialog: React.FC<ReassignAssessmentDialogProps> = ({
  open,
  onOpenChange,
  assessmentId,
  currentAssigneeId,
  currentAssigneeName,
  onReassignSuccess
}) => {
  const { clientId } = useAssessmentAccess();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);

  // Fetch employees when dialog opens
  useEffect(() => {
    if (open && clientId) {
      fetchEmployees();
    }
  }, [open, clientId]);

  const fetchEmployees = async () => {
    if (!clientId) return;

    try {
      setFetchingEmployees(true);
      const { data: employeesData, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email')
        .eq('client_id', clientId)
        .eq('status', true)
        .order('first_name');

      if (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employees');
        return;
      }

      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee to reassign to');
      return;
    }

    if (selectedEmployeeId === currentAssigneeId) {
      toast.error('Assessment is already assigned to this employee');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('assessments')
        .update({ 
          assigned_to: selectedEmployeeId,
          updated_at: new Date().toISOString()
        })
        .eq('assessment_id', assessmentId);

      if (error) {
        console.error('Error reassigning assessment:', error);
        toast.error('Failed to reassign assessment');
        return;
      }

      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
      toast.success(`Assessment reassigned to ${selectedEmployee?.first_name} ${selectedEmployee?.last_name}`);
      
      onReassignSuccess();
      onOpenChange(false);
      setSelectedEmployeeId('');
    } catch (error) {
      console.error('Error reassigning assessment:', error);
      toast.error('Failed to reassign assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedEmployeeId('');
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
          <DialogTitle>Reassign Assessment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Current Assignee
            </Label>
            <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm">
              {currentAssigneeName || 'Unassigned'}
            </div>
          </div>

          <div>
            <Label htmlFor="employee-select" className="text-sm font-medium text-gray-700">
              Reassign To
            </Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={fetchingEmployees ? "Loading employees..." : "Select an employee"} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} ({employee.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            onClick={handleReassign}
            disabled={loading || !selectedEmployeeId || fetchingEmployees}
          >
            {loading ? 'Reassigning...' : 'Reassign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReassignAssessmentDialog;
