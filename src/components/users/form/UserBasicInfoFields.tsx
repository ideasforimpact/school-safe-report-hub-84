
import React from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserBasicInfoFieldsProps {
  formData: {
    name: string;
    email: string;
    password: string;
    designation?: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    password: string;
    designation?: string;
    [key: string]: any;
  }>>;
  isEditMode?: boolean;
}

const UserBasicInfoFields = ({ formData, setFormData, isEditMode = false }: UserBasicInfoFieldsProps) => {
  const { designations = [] } = useIncidents();

  return (
    <>
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
        <Select 
          value={formData.designation || ''} 
          onValueChange={(value) => setFormData({...formData, designation: value})}
        >
          <SelectTrigger id={isEditMode ? "edit-designation" : "designation"}>
            <SelectValue placeholder="Select designation" />
          </SelectTrigger>
          <SelectContent>
            {designations.length > 0 ? (
              designations.map((designation) => (
                <SelectItem key={designation.id} value={designation.name}>
                  {designation.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="">No designations available</SelectItem>
            )}
            {/* Option to enter custom designation if needed */}
            <SelectItem value="custom">Custom (enter below)</SelectItem>
          </SelectContent>
        </Select>
        {formData.designation === 'custom' && (
          <Input
            className="mt-2"
            placeholder="Enter custom designation"
            value={formData.designation === 'custom' ? '' : formData.designation || ''}
            onChange={(e) => setFormData({...formData, designation: e.target.value})}
          />
        )}
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
    </>
  );
};

export default UserBasicInfoFields;
