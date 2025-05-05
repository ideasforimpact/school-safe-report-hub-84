
import React from 'react';
import { Incident, IncidentStatus, ContributingFactor, Action } from '@/types/incident';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { BanIcon } from 'lucide-react';

import IncidentDetailsHeader from './details/IncidentDetailsHeader';
import IncidentMetadata from './details/IncidentMetadata';
import StatusUpdateSection from './details/StatusUpdateSection';
import IncidentDescription from './details/IncidentDescription';
import RootCauseDisplay from './details/RootCauseDisplay';
import ContributingFactorsDisplay from './details/ContributingFactorsDisplay';
import ActionsList from './ActionsList';
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
  // Use provided state or create local state
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
    <>
      <Card className="overflow-hidden">
        <IncidentDetailsHeader />
        
        <CardContent className="space-y-6 p-6">
          {/* Incident metadata section */}
          <IncidentMetadata
            incident={incident}
            formatDateTime={formatDateTime}
          />

          {/* Show voided message if applicable */}
          {incident.isVoided && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-md space-y-2">
              <div className="flex items-center gap-2 text-red-800">
                <BanIcon className="h-5 w-5" />
                <span className="font-medium">This incident has been voided</span>
              </div>
              {incident.voidReason && (
                <p className="text-sm text-red-700 mt-1">
                  <span className="font-medium">Reason:</span> {incident.voidReason}
                </p>
              )}
            </div>
          )}

          {/* Show reopened flag if applicable */}
          {incident.wasReopened && incident.status !== 'Closed' && (
            <div className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2 text-yellow-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flag-triangle-right">
                <path d="M7 22V2"/>
                <path d="M7 7h14l-7 5 7 5H7"/>
              </svg>
              <span className="text-sm font-medium">Reopened Ticket</span>
            </div>
          )}

          {/* Only show status update section if incident is not closed and not voided */}
          {incident.status !== 'Closed' && !incident.isVoided && (
            <StatusUpdateSection
              currentStatus={incident.status}
              statusUpdate={statusUpdate}
              setStatusUpdate={setStatusUpdate}
              onStatusChange={handleStatusChange}
              onCloseButtonClick={handleCloseButtonClick}
              getStatusColor={getStatusColor}
            />
          )}

          {/* Description section */}
          <IncidentDescription
            description={incident.description}
            image={incident.image}
          />
        </CardContent>
      </Card>
      
      {/* Show closure information only if the incident is closed */}
      {incident.status === 'Closed' && (
        <>
          {/* Root cause section */}
          <RootCauseDisplay rootCause={incident.rootCause} />
          
          {/* Contributing factors section */}
          <ContributingFactorsDisplay factors={incident.contributingFactors} />
          
          {/* Actions taken section */}
          {incident.actions && incident.actions.length > 0 && (
            <ActionsList 
              actions={incident.actions} 
              formatDate={formatDate}
            />
          )}
        </>
      )}
      
      {/* Incident Closure Form */}
      <IncidentClosureForm
        incident={incident}
        isOpen={isFormOpen && !incident.isVoided}
        onClose={() => setFormOpen(false)}
        onSubmit={handleClosureFormSubmit}
      />
    </>
  );
};

export default IncidentDetails;
