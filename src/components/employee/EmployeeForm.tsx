import React from 'react';
import { Employee, ModuleAccessItem } from '@/contexts/employee/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import EmployeeModulePermissions from './EmployeeModulePermissions';

interface EmployeeFormProps {
  formData: Partial<Employee>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  isEditMode?: boolean;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  formData,
  setFormData,
  isEditMode = false
}) => {
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Updated to accept an array of ModuleAccessItem objects
  const handleModulePermissionChange = (selectedModules: ModuleAccessItem[]) => {
    // If modulePermissions exists, update it based on the selected modules
    if (formData.modulePermissions) {
      const updatedPermissions: {[key: string]: boolean} = { ...formData.modulePermissions };
      
      // First, reset all permissions to false
      Object.keys(updatedPermissions).forEach(key => {
        updatedPermissions[key] = false;
      });
      
      // Then set the selected permissions to true
      selectedModules.forEach(module => {
        if (module.key && Object.keys(updatedPermissions).includes(module.key)) {
          updatedPermissions[module.key] = true;
        }
      });
      
      setFormData(prev => ({
        ...prev,
        // Convert to proper ModuleAccessItem[] for moduleAccessPayload
        moduleAccessPayload: selectedModules,
        // Keep modulePermissions as an object
        modulePermissions: updatedPermissions
      }));
    } else {
      // If modulePermissions doesn't exist, just store the moduleAccessPayload
      setFormData(prev => ({
        ...prev,
        moduleAccessPayload: selectedModules
      }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <Input
            name="firstName"
            value={formData.firstName || ''}
            onChange={handleInputChange}
            placeholder="Enter first name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <Input
            name="lastName"
            value={formData.lastName || ''}
            onChange={handleInputChange}
            placeholder="Enter last name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            placeholder="Enter email address"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee ID
          </label>
          <Input
            name="employeeId"
            value={formData.employeeId || ''}
            onChange={handleInputChange}
            placeholder="Enter employee ID"
            required
            disabled={isEditMode}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <Select
            value={formData.department || ''}
            onValueChange={(value) => handleSelectChange('department', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administration</SelectItem>
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee Type
          </label>
          <Select
            value={formData.employeeType || ''}
            onValueChange={(value) => handleSelectChange('employeeType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employee type" />
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Joining Date
          </label>
          <Input
            type="date"
            name="joiningDate"
            value={formData.joiningDate || ''}
            onChange={handleInputChange}
            required
          />
        </div>
        
        {isEditMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={formData.status || 'active'}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <h3 className="text-md font-medium mb-3">Module Access</h3>
        {formData.modulePermissions && (
          <EmployeeModulePermissions
            modulePermissions={formData.modulePermissions}
            onModulePermissionChange={handleModulePermissionChange}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeForm;
