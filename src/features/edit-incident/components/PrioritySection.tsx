
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertOctagon,
  AlertTriangle,
  SignalMedium,
  SignalLow
} from 'lucide-react';
import { getPriorityIcon } from '@/utils/priorityIcons';

interface PrioritySectionProps {
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  onSelectChange: (name: string, value: string) => void;
}

const PrioritySection: React.FC<PrioritySectionProps> = ({
  priority,
  onSelectChange,
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="priority" className="text-sm font-medium">
        Priority <span className="text-red-500">*</span>
      </label>
      <Select 
        value={priority}
        onValueChange={(value) => onSelectChange('priority', value)}
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Select priority">
            {priority && (
              <div className="flex items-center">
                {getPriorityIcon(priority)()}
                <span className="ml-2">{priority}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Low">
            <div className="flex items-center">
              <SignalLow className="h-4 w-4 text-green-600 mr-2" />
              Low
            </div>
          </SelectItem>
          <SelectItem value="Medium">
            <div className="flex items-center">
              <SignalMedium className="h-4 w-4 text-yellow-600 mr-2" />
              Medium
            </div>
          </SelectItem>
          <SelectItem value="High">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
              High
            </div>
          </SelectItem>
          <SelectItem value="Critical">
            <div className="flex items-center">
              <AlertOctagon className="h-4 w-4 text-red-600 mr-2" />
              Critical
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PrioritySection;
