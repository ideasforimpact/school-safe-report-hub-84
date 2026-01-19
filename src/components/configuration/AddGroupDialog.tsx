import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useEmployeeDepartments } from '@/hooks/useEmployeeDepartments';

interface AddGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingGroup: any | null;
  clientId: string;
  employeeId: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const AddGroupDialog: React.FC<AddGroupDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingGroup,
  clientId,
  employeeId,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState<'Department' | 'Employee'>('Department');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { employeeDepartments, loading: departmentsLoading } = useEmployeeDepartments();

  useEffect(() => {
    if (isOpen) {
      if (editingGroup) {
        setName(editingGroup.name || '');
        setDescription(editingGroup.description || '');
        setGroupType(editingGroup.group_type || 'Department');
        // Load existing group employees for editing
        loadGroupEmployees(editingGroup.id);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingGroup]);

  useEffect(() => {
    if (groupType === 'Employee' && clientId && isOpen) {
      fetchEmployees();
    }
  }, [groupType, clientId, isOpen]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setGroupType('Department');
    setSelectedDepartment('');
    setSelectedEmployees([]);
  };

  const fetchEmployees = async () => {
    if (!clientId) return;

    try {
      setLoadingEmployees(true);
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email')
        .eq('client_id', clientId)
        .eq('status', true)
        .order('first_name');

      if (error) throw error;

      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadGroupEmployees = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_employees')
        .select('employee_id, role_id')
        .eq('group_id', groupId);

      if (error) throw error;

      if (data && data.length > 0) {
        if (editingGroup?.group_type === 'Department') {
          // For department groups, set the department from role_id
          const roleId = data[0]?.role_id;
          if (roleId) {
            setSelectedDepartment(roleId);
          }
        } else {
          // For employee groups, set selected employees
          const empIds = data.map((item) => item.employee_id).filter(Boolean);
          setSelectedEmployees(empIds);
        }
      }
    } catch (error: any) {
      console.error('Error loading group employees:', error);
    }
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const validateForm = () => {
    if (!name || name.length < 2 || name.length > 100) {
      toast.error('Name must be between 2 and 100 characters');
      return false;
    }

    if (description && (description.length < 2 || description.length > 1000)) {
      toast.error('Description must be between 2 and 1000 characters');
      return false;
    }

    if (groupType === 'Department' && !selectedDepartment) {
      toast.error('Please select a department');
      return false;
    }

    if (groupType === 'Employee' && selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload: any = {
        action: editingGroup ? 'update' : 'create',
        client_id: clientId,
        employee_id: employeeId,
        name: name.trim(),
        description: description.trim() || null,
        group_type: groupType,
      };

      if (editingGroup) {
        payload.group_id = editingGroup.id;
      }

      if (groupType === 'Department') {
        payload.department_id = selectedDepartment;
      } else {
        payload.employee_ids = selectedEmployees;
      }

      const { data, error } = await supabase.functions.invoke('create-group', {
        body: payload,
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(editingGroup ? 'Group updated successfully' : 'Group created successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error saving group:', error);
      toast.error(error?.message || 'Failed to save group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingGroup ? 'Edit Group' : 'Add Group'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              minLength={2}
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500">2-100 characters</p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description (optional)"
              minLength={2}
              maxLength={1000}
              rows={3}
            />
            <p className="text-xs text-gray-500">2-1000 characters (optional)</p>
          </div>

          {/* Group Type Radio */}
          <div className="space-y-2">
            <Label>
              Group Type <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={groupType} onValueChange={(value) => setGroupType(value as 'Department' | 'Employee')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Department" id="department" />
                <Label htmlFor="department" className="cursor-pointer">Department</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Employee" id="employee" />
                <Label htmlFor="employee" className="cursor-pointer">Employee</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Department Dropdown */}
          {groupType === 'Department' && (
            <div className="space-y-2">
              <Label htmlFor="department">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                disabled={departmentsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={departmentsLoading ? 'Loading...' : 'Select department'} />
                </SelectTrigger>
                <SelectContent>
                  {employeeDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Employee Multi-Select */}
          {groupType === 'Employee' && (
            <div className="space-y-2">
              <Label>
                Employees <span className="text-red-500">*</span>
              </Label>
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                {loadingEmployees ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Loading employees...</span>
                  </div>
                ) : employees.length === 0 ? (
                  <p className="text-sm text-gray-500">No employees available</p>
                ) : (
                  <div className="space-y-2">
                    {employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={() => handleEmployeeToggle(employee.id)}
                        />
                        <Label
                          htmlFor={`employee-${employee.id}`}
                          className="cursor-pointer flex-1"
                        >
                          {employee.first_name} {employee.last_name} ({employee.email})
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedEmployees.length > 0 && (
                <p className="text-xs text-gray-500">
                  {selectedEmployees.length} employee(s) selected
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingGroup ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddGroupDialog;

