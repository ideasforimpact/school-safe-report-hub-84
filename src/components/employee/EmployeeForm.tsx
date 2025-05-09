
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Employee, EmployeeType, DepartmentType, EmploymentStatus } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';
import EmployeeModulePermissions from './EmployeeModulePermissions';

interface EmployeeFormProps {
  formData: Partial<Employee>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  isEditMode?: boolean;
}

const EmployeeForm = ({ formData, setFormData, isEditMode = false }: EmployeeFormProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    formData.joiningDate ? new Date(formData.joiningDate) : undefined
  );

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData({ ...formData, joiningDate: date.toISOString().split('T')[0] });
    } else {
      setFormData({ ...formData, joiningDate: undefined });
    }
  };
  
  const handleModulePermissionChange = (module: string, value: boolean) => {
    // This function now only needs to update the form state
    // Module permissions are managed separately through the employee_modules table
    setFormData({
      ...formData,
    });
  };

  return (
    <div className="space-y-4 py-4">
      {/* Basic Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="employeeId">Employee ID</label>
          <Input
            id="employeeId"
            value={formData.employeeId || ''}
            onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
            placeholder="Enter employee ID"
            disabled={isEditMode} // Employee ID should not be editable after creation
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="email">Email</label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="Enter email address"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="firstName">First Name</label>
          <Input
            id="firstName"
            value={formData.firstName || ''}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            placeholder="Enter first name"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="lastName">Last Name</label>
          <Input
            id="lastName"
            value={formData.lastName || ''}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            placeholder="Enter last name"
          />
        </div>
      </div>
        
      {/* Employment Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="employeeType">Employee Type</label>
          <Select 
            value={formData.employeeType || ''} 
            onValueChange={(value: EmployeeType) => setFormData({...formData, employeeType: value})}
          >
            <SelectTrigger id="employeeType">
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

        <div className="space-y-2">
          <label htmlFor="department">Department</label>
          <Select 
            value={formData.department || ''} 
            onValueChange={(value: DepartmentType) => setFormData({...formData, department: value})}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label>Date of Joining</label>
          <DatePicker 
            date={selectedDate}
            onChange={handleDateChange}
            className="w-full"
            placeholderText="Select date of joining"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status">Employment Status</label>
          <Select 
            value={formData.status || ''} 
            onValueChange={(value: EmploymentStatus) => setFormData({...formData, status: value})}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="resigned">Resigned</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Module Permissions Section */}
      <EmployeeModulePermissions 
        permissions={formData.modulePermissions} 
        onPermissionChange={handleModulePermissionChange}
        isEditMode={isEditMode}
      />
    </div>
  );
};

export default EmployeeForm;
