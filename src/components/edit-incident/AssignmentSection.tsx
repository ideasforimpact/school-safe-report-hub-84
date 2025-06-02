
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: string;
  name: string;
}

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
      <Label htmlFor="owner" className="text-sm font-medium text-gray-700">
        Assign To
      </Label>
      <Select value={owner} onValueChange={(value) => onSelectChange('owner', value)}>
        <SelectTrigger className="h-11 bg-white border-gray-300">
          <SelectValue placeholder="Select assignee" />
        </SelectTrigger>
        <SelectContent className="bg-white z-50">
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AssignmentSection;
