import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client' ;
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { useEmployeeDepartments } from '@/hooks/useEmployeeDepartments';
import SearchMultiSelect, { SearchMultiSelectOption } from '@/components/common/SearchMultiSelect';

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
        console.log('[AddGroupDialog] Edit popup opened – editingGroup:', {
          id: editingGroup.id,
          name: editingGroup.name,
          description: editingGroup.description,
          group_type: editingGroup.group_type,
          raw: editingGroup,
        });
        setName(editingGroup.name || '');
        setDescription(editingGroup.description || '');
        setGroupType(editingGroup.group_type || 'Department');
        // Use department_id from group when available (so edit shows selected department)
        const deptId = (editingGroup as { department_id?: string | null }).department_id;
        setSelectedDepartment(deptId ?? '');
        // Load existing group employees for editing (fallback for department from role_id if no department_id on group yet)
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
        .not('email', 'is', null) 
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
          .from('group_employees' as any)
          .select(`
            employee_id,
            role_id,
            employee:employees!group_employees_employee_id_fkey!inner (
              status
            )
          `)
          .eq('group_id', groupId)
          .eq('employee.status', true);
      if (error) throw error;

      if (editingGroup?.group_type === 'Department') {
        console.log('[AddGroupDialog] Group employees (department group):', {
          group_id: editingGroup?.id,
          group_employees_count: data?.length ?? 0,
          group_employees_raw: data ?? [],
          department_id_from_group: (editingGroup as { department_id?: string | null }).department_id ?? null,
        });
      }

      if (data && data.length > 0) {
        if (editingGroup?.group_type === 'Department') {
          // Fallback: set department from role_id when group has no department_id yet (e.g. before migration)
          const rowWithDept = (data as any[]).find((r) => r.role_id);
          const roleId = rowWithDept?.role_id ?? (data[0] as any)?.role_id;
          const hasDeptOnGroup = !!(editingGroup as { department_id?: string | null }).department_id;
          if (roleId && !hasDeptOnGroup) {
            setSelectedDepartment(roleId);
          }
        } else {
          // For employee groups, set selected employees
          const empIds = data
            .map((item: any) => item.employee_id)
            .filter(Boolean);
          console.log('[AddGroupDialog] Group employees (employee group):', {
            group_id: editingGroup?.id,
            group_employees_raw: data,
            selected_employee_ids: empIds,
          });
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

  const employeeOptions: SearchMultiSelectOption[] = employees.map((emp) => ({
    id: emp.id,
    label: `${emp.first_name} ${emp.last_name}`,
    description: emp.email,
  }));

  // Helper function to capitalize first character
  const capitalizeFirstChar = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Helper function to check for special characters (allows alphanumeric, spaces, and basic punctuation)
  const hasSpecialCharacters = (text: string): boolean => {
    // Allow: letters, numbers, spaces, hyphens, underscores, periods, commas, apostrophes, parentheses
    // Disallow: other special characters like @, #, $, %, ^, &, *, etc.
    const allowedPattern = /^[a-zA-Z0-9\s\-_.,'()]+$/;
    return !allowedPattern.test(text);
  };

  const validateForm = () => {
    if (!name || name.length < 2 || name.length > 100) {
      toast.error('Name must be between 2 and 100 characters');
      return false;
    }

    // Check for special characters in name
    if (hasSpecialCharacters(name)) {
      toast.error('Name cannot contain special characters. Only letters, numbers, spaces, and basic punctuation (.,-_\'()) are allowed.');
      return false;
    }

    if (description && (description.length < 2 || description.length > 1000)) {
      toast.error('Description must be between 2 and 1000 characters');
      return false;
    }

    // Check for special characters in description
    if (description && hasSpecialCharacters(description)) {
      toast.error('Description cannot contain special characters. Only letters, numbers, spaces, and basic punctuation (.,-_\'()) are allowed.');
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
        name: trimmedName,
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
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(event) => {
          // Disable closing when clicking outside the dialog
          event.preventDefault();
        }}
      >
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
             onChange={(e) => {
                let value = e.target.value;
                value = value.replace(/^\s+/, '');
                if (value === '' || /^[a-zA-Z0-9\s\-_.,'()]*$/.test(value)) {
                  setName(value);
                }
              }}
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
            <TextareaWithVoice
              id="description"
              value={description}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only alphanumeric, spaces, and basic punctuation
                if (value === '' || /^[a-zA-Z0-9\s\-_.,'()]*$/.test(value)) {
                  setDescription(value);
                }
              }}
              placeholder="Enter group description (optional)"
              minLength={2}
              maxLength={1000}
              rows={3}
            />
            <p className="text-xs text-gray-500">2-1000 characters (optional)</p>
          </div>

          {/* Group Type Radio - horizontal layout */}
          <div className="space-y-2">
            <Label>
              Group Type <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={groupType}
              onValueChange={(value) => setGroupType(value as 'Department' | 'Employee')}
              className="flex flex-row items-center gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Department" id="department" />
                <Label htmlFor="department" className="cursor-pointer">
                  Department
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Employee" id="employee" />
                <Label htmlFor="employee" className="cursor-pointer">
                  Employee
                </Label>
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
                      {capitalizeFirstChar(dept.department_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Employee Search + Multi-Select (Add/Edit) */}
          {groupType === 'Employee' && (
            <div className="space-y-2">
              <Label>
                Employees <span className="text-red-500">*</span>
              </Label>

              <SearchMultiSelect
                options={employeeOptions}
                selectedIds={selectedEmployees}
                onChange={setSelectedEmployees}
                placeholder={
                  loadingEmployees ? 'Loading employees...' : 'Search by name or email...'
                }
                  disabled={loadingEmployees}
              />

              {/* Selected employees summary */}
              {selectedEmployees.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Selected Employees ({selectedEmployees.length})
                  </p>
                  <ScrollArea className="h-32 rounded-md border">
                    <div className="p-2">
                    <div className="flex flex-wrap gap-2">
                      {employees
                        .filter((emp) => selectedEmployees.includes(emp.id))
                        .map((emp) => (
                          <div
                            key={emp.id}
                            className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-800"
                          >
                            <span>
                              {emp.first_name} {emp.last_name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleEmployeeToggle(emp.id)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
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

