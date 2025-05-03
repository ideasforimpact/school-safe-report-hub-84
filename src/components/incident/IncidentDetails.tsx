
import React from 'react';
import { Incident, IncidentStatus, ContributingFactor, Action } from '@/types/incident';
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
  isClosureFormOpen?: boolean;
  setIsClosureFormOpen?: (isOpen: boolean) => void;
  onClosureFormSubmit?: (data: {
    rootCause: string;
    contributingFactors: ContributingFactor[];
    actions: Action[];
  }) => void;
}

const IncidentDetails: React.FC<IncidentDetailsProps> = ({
  incident,
  formatDate,
  formatDateTime,
  getStatusColor,
  handleStatusChange,
  statusUpdate,
  setStatusUpdate,
  updateIncident,
  isClosureFormOpen = false,
  setIsClosureFormOpen,
  onClosureFormSubmit
}) => {
  // Use provided state or create local state if not provided
  const [localIsClosureFormOpen, setLocalIsClosureFormOpen] = React.useState(false);
  
  // Use either the props or local state
  const isFormOpen = isClosureFormOpen !== undefined ? isClosureFormOpen : localIsClosureFormOpen;
  const setFormOpen = setIsClosureFormOpen || setLocalIsClosureFormOpen;
  
  const handleCloseButtonClick = () => {
    setFormOpen(true);
  };
  
  const handleClosureFormSubmit = (data: {
    rootCause: string;
    contributingFactors: ContributingFactor[];
    actions: Action[];
  }) => {
    if (onClosureFormSubmit) {
      onClosureFormSubmit(data);
    } else {
      updateIncident(incident.id, {
        status: 'Closed',
        rootCause: data.rootCause,
        contributingFactors: data.contributingFactors,
        actions: data.actions
      });
      
      setFormOpen(false);
    }
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
        isOpen={isFormOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleClosureFormSubmit}
      />
    </Card>
  );
};

export default IncidentDetails;
