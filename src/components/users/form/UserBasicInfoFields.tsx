
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeType, DepartmentType } from '@/contexts/auth/types';

interface UserBasicInfoFieldsProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
    [key: string]: any;
  }>>;
  isEditMode?: boolean;
}

const UserBasicInfoFields = ({ formData, setFormData, isEditMode = false }: UserBasicInfoFieldsProps) => {
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor={isEditMode ? "edit-firstName" : "firstName"}>First Name</label>
          <Input
            id={isEditMode ? "edit-firstName" : "firstName"}
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            placeholder="Enter first name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={isEditMode ? "edit-lastName" : "lastName"}>Last Name</label>
          <Input
            id={isEditMode ? "edit-lastName" : "lastName"}
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor={isEditMode ? "edit-employeeId" : "employeeId"}>Employee ID</label>
        <Input
          id={isEditMode ? "edit-employeeId" : "employeeId"}
          value={formData.employeeId || ''}
          onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
          placeholder="Enter employee ID"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={isEditMode ? "edit-email" : "email"}>Email ID</label>
        <Input
          id={isEditMode ? "edit-email" : "email"}
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Enter email"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={isEditMode ? "edit-employeeType" : "employeeType"}>Employee Type</label>
        <Select 
          value={formData.employeeType || ''} 
          onValueChange={(value: EmployeeType) => setFormData({...formData, employeeType: value})}
        >
          <SelectTrigger id={isEditMode ? "edit-employeeType" : "employeeType"}>
            <SelectValue placeholder="Select employee type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="permanent">Permanent</SelectItem>
            <SelectItem value="temporary">Temporary</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor={isEditMode ? "edit-department" : "department"}>Department</label>
        <Select 
          value={formData.department || ''} 
          onValueChange={(value: DepartmentType) => setFormData({...formData, department: value})}
        >
          <SelectTrigger id={isEditMode ? "edit-department" : "department"}>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="academics">Academics</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label>Date of Joining</label>
        <DatePicker 
          date={selectedDate}
          onChange={handleDateChange}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={isEditMode ? "edit-password" : "password"}>
          {isEditMode ? 
            <span className="text-sm text-gray-500">Password (leave empty to keep current)</span> : 
            "Password"}
        </label>
        <Input
          id={isEditMode ? "edit-password" : "password"}
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          placeholder={isEditMode ? "Leave empty to keep current password" : "Enter password"}
        />
      </div>
    </>
  );
};

export default UserBasicInfoFields;
