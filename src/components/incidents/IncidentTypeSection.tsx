
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePriorities } from '@/hooks/usePriorities';

interface IncidentTypeSectionProps {
  type: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  onSelectChange: (name: string, value: string) => void;
}

const IncidentTypeSection: React.FC<IncidentTypeSectionProps> = ({
  type,
  priority,
  onSelectChange,
}) => {
  const { priorities, loading } = usePriorities();

  return (
    <>
      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          Report Type <span className="text-red-500">*</span>
        </label>
        <Select 
          value={type}
          onValueChange={(value) => onSelectChange('type', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Incident">Incident</SelectItem>
            <SelectItem value="Near Miss">Near Miss</SelectItem>
            <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="priority" className="text-sm font-medium">
          Priority <span className="text-red-500">*</span>
        </label>
        <Select 
          value={priority}
          onValueChange={(value) => onSelectChange('priority', value)}
          required
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading priorities..." : "Select priority"} />
          </SelectTrigger>
          <SelectContent>
            {loading ? (
              <SelectItem value="" disabled>Loading...</SelectItem>
            ) : (
              priorities.map(priority => (
                <SelectItem key={priority.id} value={priority.name}>{priority.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default IncidentTypeSection;
