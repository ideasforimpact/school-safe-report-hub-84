
import React from 'react';
import { UserRole, ModulePermissions } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserFormProps {
  formData: {
    name: string;
    email: string;
    password: string;
    designation?: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    password: string;
    designation?: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
  }>>;
  isEditMode?: boolean;
}

const UserForm = ({ formData, setFormData, isEditMode = false }: UserFormProps) => {
  const handleModulePermissionChange = (module: keyof ModulePermissions, value: boolean) => {
    setFormData({
      ...formData,
      modulePermissions: {
        ...formData.modulePermissions,
        [module]: value
      }
    });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label htmlFor={isEditMode ? "edit-name" : "name"}>Name</label>
        <Input
          id={isEditMode ? "edit-name" : "name"}
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Enter name"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={isEditMode ? "edit-email" : "email"}>Email</label>
        <Input
          id={isEditMode ? "edit-email" : "email"}
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Enter email"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={isEditMode ? "edit-designation" : "designation"}>Designation</label>
        <Input
          id={isEditMode ? "edit-designation" : "designation"}
          value={formData.designation || ''}
          onChange={(e) => setFormData({...formData, designation: e.target.value})}
          placeholder="Enter designation"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={isEditMode ? "edit-password" : "password"}>
          {isEditMode && <span className="text-sm text-gray-500">(leave empty to keep current)</span>}
          {!isEditMode && "Password"}
        </label>
        <Input
          id={isEditMode ? "edit-password" : "password"}
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          placeholder={isEditMode ? "Leave empty to keep current password" : "Enter password"}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={isEditMode ? "edit-role" : "role"}>Role</label>
        <Select 
          value={formData.role} 
          onValueChange={(value: UserRole) => setFormData({...formData, role: value})}
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
      
      <div className="space-y-2">
        <label className="font-medium">Module Permissions</label>
        <div className="grid grid-cols-1 gap-2 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={isEditMode ? "edit-incident-reporting" : "incident-reporting"}
              checked={formData.modulePermissions.incidentReporting}
              onCheckedChange={(checked) => 
                handleModulePermissionChange('incidentReporting', checked === true)
              }
            />
            <label 
              htmlFor={isEditMode ? "edit-incident-reporting" : "incident-reporting"}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Incident Reporting
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={isEditMode ? "edit-all-incidents" : "all-incidents"}
              checked={formData.modulePermissions.allIncidents}
              onCheckedChange={(checked) => 
                handleModulePermissionChange('allIncidents', checked === true)
              }
            />
            <label 
              htmlFor={isEditMode ? "edit-all-incidents" : "all-incidents"}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              All Incidents
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={isEditMode ? "edit-insights" : "insights"}
              checked={formData.modulePermissions.insights}
              onCheckedChange={(checked) => 
                handleModulePermissionChange('insights', checked === true)
              }
            />
            <label 
              htmlFor={isEditMode ? "edit-insights" : "insights"}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Insights
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id={isEditMode ? "edit-benchmarking" : "benchmarking"}
              checked={formData.modulePermissions.benchmarking}
              onCheckedChange={(checked) => 
                handleModulePermissionChange('benchmarking', checked === true)
              }
            />
            <label 
              htmlFor={isEditMode ? "edit-benchmarking" : "benchmarking"}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Benchmarking
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
