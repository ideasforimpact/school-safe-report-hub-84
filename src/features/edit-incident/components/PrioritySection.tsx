
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PrioritySectionProps {
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  onSelectChange: (name: string, value: string) => void;
}

const PrioritySection: React.FC<PrioritySectionProps> = ({
  priority,
  onSelectChange,
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="priority" className="text-sm font-medium">
        Priority <span className="text-red-500">*</span>
      </label>
      <Select 
        value={priority}
        onValueChange={(value) => onSelectChange('priority', value)}
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Low">Low</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Critical">Critical</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PrioritySection;
