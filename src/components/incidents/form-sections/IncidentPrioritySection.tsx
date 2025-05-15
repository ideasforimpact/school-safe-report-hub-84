
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePriorities } from '@/hooks/usePriorities';

interface IncidentPrioritySectionProps {
  priority: string;
  onChange: (value: string) => void;
  errors: Record<string, string>;
}

export const IncidentPrioritySection: React.FC<IncidentPrioritySectionProps> = ({
  priority,
  onChange,
  errors,
}) => {
  const { priorities, loading } = usePriorities();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">
        Priority <span className="text-red-500">*</span>
      </label>
      <Select 
        value={priority}
        onValueChange={onChange}
        disabled={loading}
      >
        <SelectTrigger className={errors.priority ? "border-red-500" : ""}>
          <SelectValue placeholder={loading ? "Loading priorities..." : "Select priority"} />
        </SelectTrigger>
        <SelectContent>
          {priorities.map(priority => (
            <SelectItem 
              key={priority.id} 
              value={priority.name}
              className="flex items-center gap-2"
            >
              {priority.color && (
                <span 
                  className="w-3 h-3 rounded-full inline-block" 
                  style={{ backgroundColor: priority.color }}
                />
              )}
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
