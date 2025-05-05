
import React from 'react';
import { Incident } from '@/types/incident';
import { 
  AlertOctagon, 
  AlertTriangle, 
  SignalMedium, 
  SignalLow 
} from 'lucide-react';

interface IncidentMetadataProps {
  incident: Incident;
  formatDateTime: (date: Date) => string;
}

const IncidentMetadata: React.FC<IncidentMetadataProps> = ({
  incident,
  formatDateTime
}) => {
  // Helper function to get the priority icon, consistent with IncidentsTable
  const getPriorityIcon = (priority: string | undefined) => {
    switch(priority) {
      case 'Critical':
        return <AlertOctagon className="h-4 w-4 text-red-600" aria-label="Critical Priority" />;
      case 'High':
        return <AlertTriangle className="h-4 w-4 text-orange-500" aria-label="High Priority" />;
      case 'Medium':
        return <SignalMedium className="h-4 w-4 text-yellow-600" aria-label="Medium Priority" />;
      case 'Low':
        return <SignalLow className="h-4 w-4 text-green-600" aria-label="Low Priority" />;
      default:
        return <SignalMedium className="h-4 w-4 text-yellow-600" aria-label="Medium Priority" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      <div className="space-y-1 text-left">
        <h3 className="font-medium text-sm text-gray-500">Type</h3>
        <p className="font-medium">{incident.type}</p>
      </div>
      <div className="space-y-1 text-left">
        <h3 className="font-medium text-sm text-gray-500">Category</h3>
        <p className="font-medium">{incident.category} - {incident.subcategory}</p>
      </div>
      <div className="space-y-1 text-left">
        <h3 className="font-medium text-sm text-gray-500">Date Reported</h3>
        <p className="font-medium">{formatDateTime(incident.date)}</p>
      </div>
      <div className="space-y-1 text-left">
        <h3 className="font-medium text-sm text-gray-500">Location</h3>
        <p className="font-medium">{incident.location}</p>
      </div>
      <div className="space-y-1 text-left">
        <h3 className="font-medium text-sm text-gray-500">Priority</h3>
        <p className="font-medium flex items-center">
          {getPriorityIcon(incident.priority)}
          <span className="ml-2">{incident.priority || 'Medium'}</span>
        </p>
      </div>
      <div className="space-y-1 text-left">
        <h3 className="font-medium text-sm text-gray-500">Reported By</h3>
        <p className="font-medium">{incident.reportedBy.name}</p>
      </div>
    </div>
  );
};

export default IncidentMetadata;
