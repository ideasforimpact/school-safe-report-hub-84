
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ReportType {
  id: string;
  name: string;
  description: string | null;
}

interface Priority {
  id: string;
  name: string;
  color: string | null;
}

interface IncidentTypeSectionProps {
  type: string;
  priority: string;
  onSelectChange: (name: string, value: string) => void;
  reportTypes: ReportType[];
  priorities: Priority[];
  loading: boolean;
}

const IncidentTypeSection: React.FC<IncidentTypeSectionProps> = ({
  type,
  priority,
  onSelectChange,
  reportTypes,
  priorities,
  loading
}) => {
  console.log('=== INCIDENT TYPE SECTION DEBUG ===');
  console.log('Type value:', type);
  console.log('Priority value:', priority);
  console.log('Report types:', reportTypes);
  console.log('Priorities:', priorities);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium text-gray-700">
          Report Type <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={type}
          onValueChange={(value) => {
            console.log('Report type selected:', value);
            onSelectChange('typeId', value);
          }}
          disabled={loading}
        >
          <SelectTrigger className="h-11 bg-white border-gray-300">
            <SelectValue placeholder={loading ? "Loading..." : "Select type"} />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {reportTypes.map((reportType) => (
              <SelectItem key={reportType.id} value={reportType.id}>
                {reportType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
          Priority <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={priority}
          onValueChange={(value) => {
            console.log('Priority selected:', value);
            onSelectChange('priorityId', value);
          }}
          disabled={loading}
        >
          <SelectTrigger className="h-11 bg-white border-gray-300">
            <SelectValue placeholder={loading ? "Loading..." : "Select priority"} />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {priorities.map((priorityItem) => (
              <SelectItem key={priorityItem.id} value={priorityItem.id}>
                {priorityItem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default IncidentTypeSection;
