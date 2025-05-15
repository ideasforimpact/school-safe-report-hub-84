
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { IncidentPrioritySection } from './IncidentPrioritySection';

interface IncidentTypeSectionProps {
  type: string;
  priority: string;
  onSelectChange: (name: string, value: string) => void;
  errors: Record<string, string>;
}

const IncidentTypeSection: React.FC<IncidentTypeSectionProps> = ({
  type,
  priority,
  onSelectChange,
  errors,
}) => {
  const incidentTypes = [
    { id: 'Incident', name: 'Incident' },
    { id: 'Near Miss', name: 'Near Miss' },
    { id: 'Unsafe Condition', name: 'Unsafe Condition' }
  ];

  const handleTypeChange = (value: string) => {
    onSelectChange('type', value);
  };

  const handlePriorityChange = (value: string) => {
    onSelectChange('priority', value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium block">
          Incident Type <span className="text-red-500">*</span>
        </label>
        <Select 
          value={type}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className={errors.type ? "border-red-500" : ""}>
            <SelectValue placeholder="Select incident type" />
          </SelectTrigger>
          <SelectContent>
            {incidentTypes.map(incidentType => (
              <SelectItem 
                key={incidentType.id} 
                value={incidentType.id}
              >
                {incidentType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-red-500 text-sm mt-1">{errors.type}</p>
        )}
      </div>
      
      <IncidentPrioritySection 
        priority={priority} 
        onChange={handlePriorityChange}
        errors={errors}
      />
    </div>
  );
};

export default IncidentTypeSection;
