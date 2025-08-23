
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveReportTypes } from '@/hooks/useReportTypes';

interface IncidentTypeSectionProps {
  type: string;
  onChange: (value: string) => void;
}

const IncidentTypeSection: React.FC<IncidentTypeSectionProps> = ({
  type,
  onChange,
}) => {
  const { reportTypes, loading } = useActiveReportTypes();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">
        Report Type
      </label>
      <Select 
        value={type}
        onValueChange={onChange}
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
  );
};

export default IncidentTypeSection;
