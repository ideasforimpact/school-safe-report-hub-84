
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActivePriorities } from '@/hooks/usePriorities';

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
  const { priorities, loading } = useActivePriorities();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">
        Priority
      </label>
      <Select 
        value={priority}
        onValueChange={onChange}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading priorities..." : "Select priority"} />
        </SelectTrigger>
        <SelectContent>
          {priorities.map(priority => (
            <SelectItem 
              key={priority.id} 
              value={priority.name}
            >
              {priority.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors.priority && (
        <p className="text-red-500 text-sm mt-1">{errors.priority}</p>
      )}
    </div>
  );
};

export default IncidentPrioritySection;
