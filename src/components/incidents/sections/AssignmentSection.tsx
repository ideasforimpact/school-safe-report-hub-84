
import React from 'react';
import { Employee } from '@/contexts/employee/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssignmentSectionProps {
  owner: string;
  users: Employee[];
  onSelectChange: (name: string, value: string) => void;
  isLoading?: boolean;
}

const AssignmentSection: React.FC<AssignmentSectionProps> = ({
  owner,
  users,
  onSelectChange,
  isLoading = false
}) => {
  return (
    <div className="space-y-2 text-left">
      <label htmlFor="owner" className="text-sm font-medium text-left block">
        Assigned to
      </label>
      <Select 
        value={owner}
        onValueChange={(value) => onSelectChange('owner', value)}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading staff..." : "Assign to staff member (optional)"} />
        </SelectTrigger>
        <SelectContent>
          {users.map(employee => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.firstName} {employee.lastName} ({employee.department})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AssignmentSection;
