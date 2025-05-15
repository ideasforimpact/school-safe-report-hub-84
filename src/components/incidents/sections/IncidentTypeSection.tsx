
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
  errors?: Record<string, string>;
}

const IncidentTypeSection: React.FC<IncidentTypeSectionProps> = ({
  type,
  priority,
  onSelectChange,
  errors = {},
}) => {
  const { reportTypes, loading: loadingReportTypes } = useReportTypes();
  const { priorities, loading: loadingPriorities } = usePriorities();

  return (
    <>
      <div className="space-y-2 w-full">
        <label htmlFor="type" className="text-sm font-medium block text-left">
          Report Type
          {errors.type && <span className="text-red-500">*</span>}
        </label>
        <Select 
          value={type}
          onValueChange={(value) => onSelectChange('type', value)}
          disabled={loadingReportTypes}
        >
          <SelectTrigger className={`w-full ${errors.type ? "border-red-500" : ""}`}>
            <SelectValue placeholder={loadingReportTypes ? "Loading..." : "Select type"} />
          </SelectTrigger>
          <SelectContent>
            {reportTypes.map(reportType => (
              <SelectItem key={reportType.id} value={reportType.name}>{reportType.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-red-500 text-sm mt-1">{errors.type}</p>
        )}
      </div>

      <div className="space-y-2 w-full">
        <label htmlFor="priority" className="text-sm font-medium block text-left">
          Priority
          {errors.priority && <span className="text-red-500">*</span>}
        </label>
        <Select 
          value={priority}
          onValueChange={(value) => onSelectChange('priority', value)}
          disabled={loadingPriorities}
        >
          <SelectTrigger className={`w-full ${errors.priority ? "border-red-500" : ""}`}>
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
        {errors.priority && (
          <p className="text-red-500 text-sm mt-1">{errors.priority}</p>
        )}
      </div>
    </>
  );
};

export default IncidentTypeSection;
