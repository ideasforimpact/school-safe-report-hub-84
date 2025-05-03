
import React, { useState } from 'react';
import { Incident, IncidentStatus, ContributingFactor } from '@/types/incident';
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
import IncidentClosureForm from './IncidentClosureForm';

interface IncidentDetailsProps {
  incident: Incident;
  formatDate: (date: Date) => string;
  formatDateTime: (date: Date) => string;
  getStatusColor: (status: IncidentStatus) => string;
  handleStatusChange: () => void;
  statusUpdate: IncidentStatus | string;
  setStatusUpdate: (status: IncidentStatus) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
}

const IncidentDetails: React.FC<IncidentDetailsProps> = ({
  incident,
  formatDate,
  formatDateTime,
  getStatusColor,
  handleStatusChange,
  statusUpdate,
  setStatusUpdate,
  updateIncident
}) => {
  const statusOptions: IncidentStatus[] = ['Open', 'In Progress', 'Closed'];
  const [isClosureFormOpen, setIsClosureFormOpen] = useState(false);
  
  const handleCloseButtonClick = () => {
    setIsClosureFormOpen(true);
  };
  
  const handleClosureFormSubmit = (data: {
    rootCause: string;
    contributingFactors: ContributingFactor[];
  }) => {
    updateIncident(incident.id, {
      status: 'Closed',
      rootCause: data.rootCause,
      contributingFactors: data.contributingFactors
    });
    
    setIsClosureFormOpen(false);
  };
  
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
              
              {statusUpdate === 'Closed' && incident.status !== 'Closed' ? (
                <Button 
                  onClick={handleCloseButtonClick}
                  variant="outline" 
                  size="sm"
                >
                  Close Incident
                </Button>
              ) : (
                <Button 
                  onClick={handleStatusChange}
                  variant="outline" 
                  size="sm"
                  disabled={statusUpdate === incident.status}
                >
                  Update
                </Button>
              )}
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
        
        {incident.contributingFactors && incident.contributingFactors.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-sm">Contributing Factors</h3>
            <div className="mt-2 space-y-2">
              {incident.contributingFactors.map(factor => (
                <div key={factor.id} className="border p-3 rounded-md bg-gray-50">
                  <div className="flex justify-between">
                    <span className="font-medium">{factor.category}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      factor.weight === 'High' ? 'bg-red-100 text-red-800' :
                      factor.weight === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {factor.weight} Impact
                    </span>
                  </div>
                  <p className="text-sm mt-1">{factor.description}</p>
                </div>
              ))}
            </div>
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
      
      {/* Incident Closure Form */}
      <IncidentClosureForm
        incident={incident}
        isOpen={isClosureFormOpen}
        onClose={() => setIsClosureFormOpen(false)}
        onSubmit={handleClosureFormSubmit}
      />
    </Card>
  );
};

export default IncidentDetails;
