
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
  onChange: (value: string) => void;
}

const IncidentTypeSection: React.FC<IncidentTypeSectionProps> = ({
  type,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">
        Report Type
      </label>
      <Select 
        value={type}
        onValueChange={onChange}
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
  );
};

export default IncidentTypeSection;
