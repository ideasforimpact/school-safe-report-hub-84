
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Employee } from '@/contexts/employee/types';
import ModuleAccess from '@/components/users/form/ModuleAccess';
import { ModuleAccessItem } from '@/types/moduleAccess';

interface EmployeeFormProps {
  formData: Partial<Employee>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  isEditMode?: boolean;
  isLoading?: boolean;
}

const EmployeeForm = ({ 
  formData, 
  setFormData, 
  isEditMode = false,
  isLoading = false
}: EmployeeFormProps) => {
  // Handle module access changes
  const handleModuleAccessChange = (moduleAccessItems: ModuleAccessItem[]) => {
    setFormData({
      ...formData,
      moduleAccessPayload: moduleAccessItems
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName || ''}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName || ''}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input
            id="employeeId"
            value={formData.employeeId || ''}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            disabled={isEditMode}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="joiningDate">Joining Date</Label>
          <Input
            id="joiningDate"
            type="date"
            value={formData.joiningDate ? new Date(formData.joiningDate).toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeType">Employee Type</Label>
          <Select
            value={formData.employeeType || ''}
            onValueChange={(value) => setFormData({ ...formData, employeeType: value })}
          >
            <SelectTrigger id="employeeType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="permanent">Permanent</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="consultant">Consultant</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select
            value={formData.department || ''}
            onValueChange={(value) => setFormData({ ...formData, department: value })}
          >
            <SelectTrigger id="department">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="teaching">Teaching</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="management">Management</SelectItem>
              <SelectItem value="it">IT</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Module Access Section */}
      <div className="space-y-2">
        <Label>Module Access</Label>
        <ModuleAccess
          selectedModules={formData.moduleAccessPayload || []}
          onModuleChange={handleModuleAccessChange}
          employeeId={formData.id}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default EmployeeForm;
