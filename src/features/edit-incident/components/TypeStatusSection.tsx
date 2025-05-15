
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReportTypes } from '@/hooks/useReportTypes';

interface TypeStatusSectionProps {
  type: string;
  status: string;
  onSelectChange: (name: string, value: string) => void;
  getCategoriesForType?: (type: string) => any[];
}

const TypeStatusSection: React.FC<TypeStatusSectionProps> = ({
  type,
  status,
  onSelectChange,
  getCategoriesForType,
}) => {
  const { reportTypes, loading } = useReportTypes();
  
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
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading..." : "Select type"} />
          </SelectTrigger>
          <SelectContent>
            {reportTypes.map(reportType => (
              <SelectItem key={reportType.id} value={reportType.name}>{reportType.name}</SelectItem>
            ))}
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
