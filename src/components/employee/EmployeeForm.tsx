
import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Employee } from '@/contexts/employee/types';
import EmployeeModulePermissions from './EmployeeModulePermissions';
import { ModulePermissions } from '@/contexts/auth/types';

interface EmployeeFormProps {
  formData: Partial<Employee>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  isEditMode?: boolean;
}

const EmployeeForm = ({ formData, setFormData, isEditMode = false }: EmployeeFormProps) => {
  const handleModulePermissionChange = (module: string, value: boolean) => {
    // Make a copy of the current modulePermissions or create an empty object if it doesn't exist
    const currentModulePermissions = formData.modulePermissions || {};
    
    // Update the module permission in our copy
    setFormData(prev => ({
      ...prev,
      modulePermissions: {
        ...currentModulePermissions,
        [module]: value
      } as ModulePermissions
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="form-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Employee ID</FormLabel>
            <FormControl>
              <Input
                placeholder="E.g. EMP001"
                value={formData.employeeId || ''}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                disabled={isEditMode}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="employee@example.com"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input
                placeholder="John"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Doe"
                value={formData.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel>Department</FormLabel>
            <Select
              value={formData.department || ''}
              onValueChange={(value) => handleSelectChange('department', value)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="admin">Administration</SelectItem>
                <SelectItem value="teaching">Teaching</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel>Employee Type</FormLabel>
            <Select
              value={formData.employeeType || ''}
              onValueChange={(value) => handleSelectChange('employeeType', value)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="part_time">Part-time</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel>Joining Date</FormLabel>
            <FormControl>
              <Input
                type="date"
                value={formData.joiningDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('joiningDate', e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select
              value={formData.status || 'active'}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </div>
      </div>

      {/* Module Permissions Section */}
      <div className="mt-6">
        <EmployeeModulePermissions 
          permissions={formData.modulePermissions as ModulePermissions} 
          onPermissionChange={handleModulePermissionChange}
          isEditMode={isEditMode}
        />
      </div>
    </div>
  );
};

export default EmployeeForm;
