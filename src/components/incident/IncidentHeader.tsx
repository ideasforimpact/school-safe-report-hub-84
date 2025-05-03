
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Incident, IncidentStatus } from '@/types/incident';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

interface IncidentHeaderProps {
  incident: Incident;
  statusUpdate: IncidentStatus;
  setStatusUpdate: (status: IncidentStatus) => void;
  onStatusChange: () => void;
  formatDate: (date: Date) => string;
  getStatusColor: (status: IncidentStatus) => string;
  onCloseButtonClick?: () => void; // Added this prop
}

const IncidentHeader: React.FC<IncidentHeaderProps> = ({
  incident,
  statusUpdate,
  setStatusUpdate,
  onStatusChange,
  formatDate,
  getStatusColor,
  onCloseButtonClick
}) => {
  const navigate = useNavigate();

  // Handler for status change in header
  const handleStatusChange = (value: string) => {
    setStatusUpdate(value as IncidentStatus);
    
    // If user selects Closed status and the incident isn't already closed,
    // open the closure form instead of directly updating the status
    if (value === 'Closed' && incident.status !== 'Closed' && onCloseButtonClick) {
      onCloseButtonClick();
      return;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div>
        <Button 
          variant="ghost" 
          className="mb-2 -ml-2" 
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Incidents
        </Button>
        
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>{incident.type}: {incident.category}</span>
          <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(incident.status)}`}>
            {incident.status}
          </span>
        </h1>
        
        <p className="text-gray-600 text-sm mt-1">
          Reported by {incident.reportedBy.name} on {formatDate(incident.createdAt)}
        </p>
      </div>
      
      <div className="flex gap-2">
        <Select 
          value={statusUpdate} 
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Update Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={onStatusChange}>
          Update Status
        </Button>
      </div>
    </div>
  );
};

export default IncidentHeader;
