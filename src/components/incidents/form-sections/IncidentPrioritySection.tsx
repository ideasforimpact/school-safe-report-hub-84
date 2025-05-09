
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IncidentPrioritySectionProps {
  priority: string;
  onChange: (value: string) => void;
  errors: Record<string, string>;
}

const IncidentPrioritySection: React.FC<IncidentPrioritySectionProps> = ({
  priority,
  onChange,
  errors,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">
        Priority
      </label>
      <Select 
        value={priority}
        onValueChange={onChange}
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
      {errors.priority && (
        <p className="text-red-500 text-sm mt-1">{errors.priority}</p>
      )}
    </div>
  );
};

export default IncidentPrioritySection;
