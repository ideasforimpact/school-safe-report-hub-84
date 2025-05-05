
import React from 'react';
import { Incident } from '@/types/incident';
import { getPriorityIcon } from '@/utils/priorityIcons';

interface IncidentMetadataProps {
  incident: Incident;
  formatDateTime: (date: Date) => string;
}

const IncidentMetadata: React.FC<IncidentMetadataProps> = ({
  incident,
  formatDateTime
}) => {
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
          {React.createElement(getPriorityIcon(incident.priority)())}
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
