
import React from 'react';
import { UserRole } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserRoleSelectorProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  isEditMode?: boolean;
}

const UserRoleSelector = ({ role, onRoleChange, isEditMode = false }: UserRoleSelectorProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor={isEditMode ? "edit-role" : "role"}>Role</label>
      <Select 
        value={role} 
        onValueChange={(value: UserRole) => onRoleChange(value)}
      >
        <SelectTrigger id={isEditMode ? "edit-role" : "role"}>
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="reporter">Reporter</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserRoleSelector;
