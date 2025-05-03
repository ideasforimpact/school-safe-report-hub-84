
import React, { useState } from 'react';
import { Incident, IncidentStatus, ContributingFactor } from '@/types/incident';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

import IncidentDetailsHeader from './details/IncidentDetailsHeader';
import IncidentMetadata from './details/IncidentMetadata';
import StatusUpdateSection from './details/StatusUpdateSection';
import IncidentDescription from './details/IncidentDescription';
import RootCauseDisplay from './details/RootCauseDisplay';
import ContributingFactorsDisplay from './details/ContributingFactorsDisplay';
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
      <IncidentDetailsHeader />
      
      <CardContent className="space-y-4">
        {/* Incident metadata section */}
        <IncidentMetadata
          incident={incident}
          formatDateTime={formatDateTime}
        />

        {/* Status update section */}
        <StatusUpdateSection
          currentStatus={incident.status}
          statusUpdate={statusUpdate}
          setStatusUpdate={setStatusUpdate}
          onStatusChange={handleStatusChange}
          onCloseButtonClick={handleCloseButtonClick}
          getStatusColor={getStatusColor}
        />

        {/* Description section */}
        <IncidentDescription
          description={incident.description}
          image={incident.image}
        />

        {/* Root cause section (if available) */}
        <RootCauseDisplay rootCause={incident.rootCause} />
        
        {/* Contributing factors section (if available) */}
        <ContributingFactorsDisplay factors={incident.contributingFactors} />
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
