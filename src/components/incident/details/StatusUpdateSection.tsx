
import React from 'react';
import { IncidentStatus } from '@/types/incident';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatusUpdateSectionProps {
  currentStatus: IncidentStatus;
  statusUpdate: IncidentStatus | string;
  setStatusUpdate: (status: IncidentStatus) => void;
  onStatusChange: () => void;
  onCloseButtonClick: () => void;
  getStatusColor: (status: IncidentStatus) => string;
}

const StatusUpdateSection: React.FC<StatusUpdateSectionProps> = ({
  currentStatus,
  statusUpdate,
  setStatusUpdate,
  onStatusChange,
  onCloseButtonClick,
  getStatusColor
}) => {
  const statusOptions: IncidentStatus[] = ['Open', 'In Progress', 'Closed'];
  
  return (
    <div className="text-left">
      <h3 className="font-medium text-sm">Status</h3>
      <div className="flex items-center space-x-2">
        <Select 
          value={statusUpdate as string}
          onValueChange={(value) => setStatusUpdate(value as IncidentStatus)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
                  {status}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {statusUpdate === 'Closed' && currentStatus !== 'Closed' ? (
          <Button 
            onClick={onCloseButtonClick}
            variant="outline" 
            size="sm"
          >
            Close Incident
          </Button>
        ) : (
          <Button 
            onClick={onStatusChange}
            variant="outline" 
            size="sm"
            disabled={statusUpdate === currentStatus}
          >
            Update
          </Button>
        )}
      </div>
    </div>
  );
};

export default StatusUpdateSection;
