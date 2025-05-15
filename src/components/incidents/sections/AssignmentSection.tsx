
import React from 'react';
import { Employee } from '@/contexts/employee/types';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AssignmentSectionProps {
  owner: string;
  users: Employee[];
  onSelectChange: (name: string, value: string) => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

const AssignmentSection: React.FC<AssignmentSectionProps> = ({
  owner,
  users,
  onSelectChange,
  isLoading = false,
  errors = {}
}) => {
  const handleOwnerChange = (value: string) => {
    onSelectChange('owner', value);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Assignment</h3>
      <div className="space-y-2">
        <label htmlFor="owner" className="text-sm font-medium block">
          Assign To
        </label>
        <Select 
          value={owner} 
          onValueChange={handleOwnerChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading staff...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select staff member" />
            )}
          </SelectTrigger>
          <SelectContent>
            {users.map(user => (
              <SelectItem 
                key={user.id} 
                value={user.id}
              >
                {`${user.firstName} ${user.lastName}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AssignmentSection;
