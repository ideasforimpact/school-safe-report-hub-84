
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

export const IncidentPrioritySection: React.FC<IncidentPrioritySectionProps> = ({
  priority,
  onChange,
  errors,
}) => {
  const priorities = [
    { id: 'Low', name: 'Low' },
    { id: 'Medium', name: 'Medium' },
    { id: 'High', name: 'High' },
    { id: 'Critical', name: 'Critical' }
  ];

  return (
    <div className="space-y-2">
      <label htmlFor="priority" className="text-sm font-medium block">
        Priority <span className="text-red-500">*</span>
      </label>
      <Select 
        value={priority}
        onValueChange={onChange}
      >
        <SelectTrigger className={errors.priority ? "border-red-500" : ""}>
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          {priorities.map(priority => (
            <SelectItem 
              key={priority.id} 
              value={priority.id}
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
