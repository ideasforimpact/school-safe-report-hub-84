
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReportTypes } from '@/hooks/useReportTypes';
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
  const { reportTypes, loading: loadingReportTypes } = useReportTypes();
  const { priorities, loading: loadingPriorities } = usePriorities();

  return (
    <>
      <div className="space-y-2 w-full">
        <label htmlFor="type" className="text-sm font-medium block text-left">
          Report Type
        </label>
        <Select 
          value={type}
          onValueChange={(value) => onSelectChange('type', value)}
          disabled={loadingReportTypes}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loadingReportTypes ? "Loading..." : "Select type"} />
          </SelectTrigger>
          <SelectContent>
            {reportTypes.map(reportType => (
              <SelectItem key={reportType.id} value={reportType.name}>{reportType.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 w-full">
        <label htmlFor="priority" className="text-sm font-medium block text-left">
          Priority
        </label>
        <Select 
          value={priority}
          onValueChange={(value) => onSelectChange('priority', value)}
          disabled={loadingPriorities}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loadingPriorities ? "Loading priorities..." : "Select priority"} />
          </SelectTrigger>
          <SelectContent>
            {priorities.map(priority => (
              <SelectItem key={priority.id} value={priority.name}>
                {priority.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default IncidentTypeSection;
