
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePriorities } from '@/hooks/usePriorities';
import { useReportTypes } from '@/hooks/useReportTypes';

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
  // RLS handles client filtering automatically - no manual client checks needed
  const { priorities, loading: prioritiesLoading } = usePriorities();
  const { reportTypes, loading: reportTypesLoading } = useReportTypes();

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
          disabled={reportTypesLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={reportTypesLoading ? "Loading report types..." : "Select type"} />
          </SelectTrigger>
          <SelectContent>
            {reportTypesLoading ? (
              <SelectItem value="" disabled>Loading...</SelectItem>
            ) : (
              reportTypes.map(reportType => (
                <SelectItem key={reportType.id} value={reportType.name}>{reportType.name}</SelectItem>
              ))
            )}
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
          disabled={prioritiesLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={prioritiesLoading ? "Loading priorities..." : "Select priority"} />
          </SelectTrigger>
          <SelectContent>
            {prioritiesLoading ? (
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
