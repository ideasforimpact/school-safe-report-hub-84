
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IncidentType } from '@/types/incident';

interface TypeStatusSectionProps {
  type: string;
  status: string;
  onSelectChange: (name: string, value: string) => void;
  getCategoriesForType?: (type: IncidentType) => string[];
}

const TypeStatusSection: React.FC<TypeStatusSectionProps> = ({
  type,
  status,
  onSelectChange,
  getCategoriesForType,
}) => {
  return (
    <div className="space-y-6">
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
        <label htmlFor="status" className="text-sm font-medium">
          Status <span className="text-red-500">*</span>
        </label>
        <Select 
          value={status}
          onValueChange={(value) => onSelectChange('status', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TypeStatusSection;
