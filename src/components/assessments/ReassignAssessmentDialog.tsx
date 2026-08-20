
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAssessmentAccess } from '@/hooks/assessments/useAssessmentAccess';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { useAuth } from '@/contexts/auth';
import { assessmentNotificationService } from '@/services/notification/assessmentNotificationService';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  aadhar_verified_name: string | null;
}

const getEmployeeDisplayName = (employee: Pick<Employee, 'first_name' | 'last_name' | 'aadhar_verified_name'>) =>
  employee.aadhar_verified_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();

interface ReassignAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: number;
  currentAssigneeId: string | null;
  currentAssigneeName: string;
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
  currentAssigneeId,
  currentAssigneeName,
  assessment,
  onReassignSuccess
}) => {
  const { clientId } = useAssessmentAccess();
  const { employeeData } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const lastFetchRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

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

      setEmployees((data?.employees || []) as Employee[]);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setFetchingEmployees(false);
    }
  }, [clientId, open]);

  // Fetch employees when dialog opens
  useEffect(() => {
    if (open && clientId) {
      fetchEmployees();
    }
  }, [open, clientId, fetchEmployees]);

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

      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

      const { error } = await supabase.functions.invoke('reassign-assessment', {
        body: {
          assessment_id: assessmentId,
          client_id: clientId,
          assigned_to: selectedEmployeeId,
          assignee: selectedEmployee ? {
            id: selectedEmployee.id,
            first_name: selectedEmployee.first_name,
            last_name: selectedEmployee.last_name,
            email: selectedEmployee.email,
          } : undefined,
        },
      });

      if (error) {
        console.error('Error reassigning assessment:', error);
        toast.error('Failed to reassign assessment');
        return;
      }

      toast.success(`Assessment reassigned to ${selectedEmployee ? getEmployeeDisplayName(selectedEmployee) : ''}`);

      // Notify the newly-assigned employee (not if reassigning to yourself).
      // Immediate email processing is triggered internally by
      // queueAssessmentReassignedNotification — no manual invoke needed here.
      if (selectedEmployee && selectedEmployeeId !== employeeData?.id) {
        try {
          await assessmentNotificationService.queueAssessmentReassignedNotification(
            {
              id: assessment.id,
              title: assessment.name,
              target_completion_date: assessment.target_completion_date,
              assigned_to: selectedEmployeeId,
              created_by: assessment.created_by,
              client_id: assessment.client_id
            },
            selectedEmployee,
            employeeData
          );
        } catch (notificationError) {
          console.error('Error queueing assessment reassignment notification:', notificationError);
          // Don't fail the reassignment if notification fails
        }
      }

      onReassignSuccess();
      onOpenChange(false);
      setSelectedEmployeeId('');
      setEmployeeSearchTerm('');
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
    setEmployeeSearchTerm('');
  };

  const filteredEmployees = employees.filter((employee) => {
    const fullName = getEmployeeDisplayName(employee).toLowerCase();
    const email = (employee.email || '').toLowerCase();
    const normalizedSearch = employeeSearchTerm.trim().toLowerCase();

    if (!normalizedSearch) return true;

    return fullName.includes(normalizedSearch) || email.includes(normalizedSearch);
  });
  const shouldShowEmployeeDropdown = employeeSearchTerm.trim().length > 0;
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);

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

          <div className="relative">
            <Label htmlFor="employee-search" className="text-sm font-medium text-gray-700">
              Reassign To
            </Label>
            <Input
              id="employee-search"
              value={employeeSearchTerm}
              onChange={(event) => setEmployeeSearchTerm(event.target.value)}
              placeholder="Search employee by name or email"
              className="mt-1"
            />
            {selectedEmployee && (
              <div className="mt-2 rounded-md bg-purple-50 px-3 py-2 text-sm text-purple-700">
                Selected: {getEmployeeDisplayName(selectedEmployee)} ({selectedEmployee.email})
              </div>
            )}
            {shouldShowEmployeeDropdown && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-md border bg-white shadow-md">
                {fetchingEmployees ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Loading employees...</div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No employee found</div>
                ) : (
                  filteredEmployees.map((employee) => {
                    const isSelected = selectedEmployeeId === employee.id;
                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeId(employee.id);
                          setEmployeeSearchTerm('');
                        }}
                        className={`w-full border-b px-3 py-2 text-left text-sm last:border-b-0 ${
                          isSelected ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">{getEmployeeDisplayName(employee)}</div>
                        <div className="text-xs text-gray-500">{employee.email}</div>
                      </button>
                    );
                  })
                )}
              </div>
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
