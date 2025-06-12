
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReportTypes } from '@/hooks/useReportTypes';

interface TypeSectionProps {
  type: string;
  onSelectChange: (name: string, value: string) => void;
  getCategoriesForType?: (type: string) => any[];
}

const TypeSection: React.FC<TypeSectionProps> = ({
  type,
  onSelectChange,
  getCategoriesForType,
}) => {
  const { reportTypes, loading } = useReportTypes();
  
  return (
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
  );
};

export default TypeSection;
