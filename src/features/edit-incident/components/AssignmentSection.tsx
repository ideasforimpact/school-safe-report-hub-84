
import React from 'react';
import { User } from '@/types/incident';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssignmentSectionProps {
  owner: string;
  users: User[];
  onSelectChange: (name: string, value: string) => void;
}

const AssignmentSection: React.FC<AssignmentSectionProps> = ({
  owner,
  users,
  onSelectChange,
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="owner" className="text-sm font-medium">
        Assigned to
      </label>
      <Select 
        value={owner}
        onValueChange={(value) => onSelectChange('owner', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Assign to staff member (optional)" />
        </SelectTrigger>
        <SelectContent>
          {users.map(user => (
            <SelectItem key={user.id} value={user.id}>{user.name} ({user.role})</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AssignmentSection;
