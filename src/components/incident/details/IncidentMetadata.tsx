
import React from 'react';
import { Incident } from '@/types/incident';

interface IncidentMetadataProps {
  incident: Incident;
  formatDateTime: (date: Date) => string;
}

const IncidentMetadata: React.FC<IncidentMetadataProps> = ({
  incident,
  formatDateTime
}) => {
  return (
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
    </div>
  );
};

export default IncidentMetadata;
