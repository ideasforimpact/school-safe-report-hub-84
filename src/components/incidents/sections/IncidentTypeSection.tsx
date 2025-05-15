
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IncidentTypeSectionProps {
  type: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  onSelectChange: (name: string, value: string) => void;
}

const IncidentTypeSection: React.FC<IncidentTypeSectionProps> = ({
  type,
  priority,
  onSelectChange
}) => {
  return (
    <div className="space-y-4 text-left">
      <div>
        <label htmlFor="type" className="text-sm font-medium block">
          Report Type <span className="text-red-500">*</span>
        </label>
        <Select 
          value={type} 
          onValueChange={(value) => onSelectChange('type', value)}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Incident">Incident</SelectItem>
            <SelectItem value="Near Miss">Near Miss</SelectItem>
            <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="priority" className="text-sm font-medium block">
          Priority <span className="text-red-500">*</span>
        </label>
        <Select 
          value={priority} 
          onValueChange={(value) => onSelectChange('priority', value as 'Low' | 'Medium' | 'High' | 'Critical')}
          required
        >
          <SelectTrigger className="w-full">
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
    </div>
  );
};

export default IncidentTypeSection;
