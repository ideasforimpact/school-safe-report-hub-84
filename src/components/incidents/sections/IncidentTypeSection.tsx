
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertOctagon, AlertTriangle, SignalMedium, SignalLow } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface IncidentTypeSectionProps {
  type: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  onSelectChange: (name: string, value: string) => void;
  reportTypes?: { id: string; name: string; description: string | null }[];
  priorities?: { id: string; name: string; color: string | null }[];
  loading?: boolean;
}

const IncidentTypeSection: React.FC<IncidentTypeSectionProps> = ({
  type,
  priority,
  onSelectChange,
  reportTypes = [],
  priorities = [],
  loading = false
}) => {
  // Helper function to get priority icon
  const getPriorityIcon = (priorityName: string) => {
    switch (priorityName) {
      case 'Low':
        return <SignalLow className="h-4 w-4 text-green-600 mr-2" />;
      case 'Medium':
        return <SignalMedium className="h-4 w-4 text-yellow-600 mr-2" />;
      case 'High':
        return <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />;
      case 'Critical':
        return <AlertOctagon className="h-4 w-4 text-red-600 mr-2" />;
      default:
        return null;
    }
  };

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
          disabled={loading}
        >
          <SelectTrigger>
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select type" />
            )}
          </SelectTrigger>
          <SelectContent>
            {reportTypes.length === 0 ? (
              <SelectItem disabled value="">No report types available</SelectItem>
            ) : (
              reportTypes.map(reportType => (
                <SelectItem key={reportType.id} value={reportType.name}>
                  {reportType.name}
                </SelectItem>
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
          disabled={loading}
        >
          <SelectTrigger>
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select priority">
                {priority && (
                  <div className="flex items-center">
                    {getPriorityIcon(priority)}
                    <span>{priority}</span>
                  </div>
                )}
              </SelectValue>
            )}
          </SelectTrigger>
          <SelectContent>
            {priorities.length === 0 ? (
              <SelectItem disabled value="">No priorities available</SelectItem>
            ) : (
              priorities.map(priority => (
                <SelectItem key={priority.id} value={priority.name}>
                  <div className="flex items-center">
                    {getPriorityIcon(priority.name)}
                    {priority.name}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default IncidentTypeSection;
