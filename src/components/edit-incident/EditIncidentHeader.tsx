
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { Incident } from '@/types/incident';

interface EditIncidentHeaderProps {
  incident: Incident;
  onBackClick: () => void;
}

const EditIncidentHeader: React.FC<EditIncidentHeaderProps> = ({
  incident,
  onBackClick
}) => {
  return (
    <div className="space-y-4">
      <div className="w-full flex">
        <Button 
          variant="ghost" 
          className="-ml-4 flex items-center" 
          onClick={onBackClick}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Incidents
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-left flex items-center gap-2">
            <Edit className="h-8 w-8" />
            Edit Incident
          </h1>
          <p className="text-gray-600 mt-1">
            Ticket ID: <span className="font-medium">{incident.ticketId}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {incident.type} - {incident.category}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditIncidentHeader;
