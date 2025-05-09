
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface UserSelectionSectionProps {
  users: User[];
  selectedUsers: string[];
  onUserToggle: (userId: string) => void;
}

interface User {
  id: string;
  name: string;
}

const UserSelectionSection: React.FC<UserSelectionSectionProps> = ({
  users,
  selectedUsers,
  onUserToggle
}) => {
  return (
    <div className="pt-4 border-t border-gray-200">
      <div className="flex items-center mb-2">
        <Users className="h-5 w-5 text-gray-500 mr-2" />
        <Label className="text-lg font-medium">Select Users</Label>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        Choose the users who should complete this assessment.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md">
            <Checkbox 
              id={`user-${user.id}`}
              checked={selectedUsers.includes(user.id)}
              onCheckedChange={() => onUserToggle(user.id)}
            />
            <Label htmlFor={`user-${user.id}`}>{user.name}</Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSelectionSection;
