
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const { reportTypes, loading } = useReportTypes();

  return (
    <>
      <div className="space-y-2 w-full">
        <label htmlFor="type" className="text-sm font-medium block text-left">
          Report Type
        </label>
        <Select 
          value={type}
          onValueChange={(value) => onSelectChange('type', value)}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loading ? "Loading..." : "Select type"} />
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
    </>
  );
};

export default IncidentTypeSection;
