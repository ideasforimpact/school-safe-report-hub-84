
import React from 'react';
import { Incident, IncidentStatus } from '@/types/incident';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IncidentDetailsProps {
  incident: Incident;
  formatDate: (date: Date) => string;
  formatDateTime: (date: Date) => string;
  getStatusColor: (status: IncidentStatus) => string;
  handleStatusChange: () => void;
  statusUpdate: IncidentStatus | string;
  setStatusUpdate: (status: IncidentStatus) => void;
}

const IncidentDetails: React.FC<IncidentDetailsProps> = ({
  incident,
  formatDate,
  formatDateTime,
  getStatusColor,
  handleStatusChange,
  statusUpdate,
  setStatusUpdate
}) => {
  const statusOptions: IncidentStatus[] = ['Open', 'In Progress', 'Closed'];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Details</CardTitle>
        <CardDescription>
          View and update incident information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-sm">Type</h3>
            <p>{incident.type}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm">Category</h3>
            <p>{incident.category} - {incident.subcategory}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm">Date Reported</h3>
            <p>{formatDateTime(incident.date)}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm">Location</h3>
            <p>{incident.location}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm">Reported By</h3>
            <p>{incident.reportedBy.name}</p>
          </div>
          <div>
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
              <Button 
                onClick={handleStatusChange}
                variant="outline" 
                size="sm"
                disabled={statusUpdate === incident.status}
              >
                Update
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-medium text-sm">Description</h3>
          <p className="mt-1 whitespace-pre-wrap">{incident.description}</p>
        </div>

        {incident.rootCause && (
          <div className="mt-4">
            <h3 className="font-medium text-sm">Root Cause</h3>
            <p className="mt-1 whitespace-pre-wrap">{incident.rootCause}</p>
          </div>
        )}

        {incident.image && (
          <div className="mt-4">
            <h3 className="font-medium text-sm">Image</h3>
            <img 
              src={incident.image} 
              alt="Incident" 
              className="mt-2 rounded-md border max-w-md" 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IncidentDetails;
