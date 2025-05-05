
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
import { ArrowLeft, Flag, BanIcon, Ticket } from 'lucide-react';

interface IncidentHeaderProps {
  incident: Incident;
  statusUpdate: IncidentStatus;
  setStatusUpdate: (status: IncidentStatus) => void;
  onStatusChange: () => void;
  formatDate: (date: Date) => string;
  getStatusColor: (status: IncidentStatus) => string;
  onCloseButtonClick?: () => void;
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
    <div className="space-y-4">
      <div className="w-full flex">
        <Button 
          variant="ghost" 
          className="-ml-4 flex items-center" 
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Incidents
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md flex items-center">
              <Ticket className="h-4 w-4 mr-1.5" />
              <span className="font-semibold">{incident.ticketId}</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>{incident.type}: {incident.category}</span>
            <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(incident.status)}`}>
              {incident.status}
            </span>
            {incident.wasReopened && incident.status !== 'Closed' && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 flex items-center">
                <Flag className="h-3 w-3 mr-1" />
                Reopened
              </span>
            )}
            {incident.isVoided && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 flex items-center">
                <BanIcon className="h-3 w-3 mr-1" />
                Voided
              </span>
            )}
          </h1>
          
          <p className="text-gray-600 text-sm mt-1">
            Reported by {incident.reportedBy.name} on {formatDate(incident.createdAt)}
          </p>
        </div>
        
        <div className="flex gap-2">
          {!incident.isVoided && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentHeader;
