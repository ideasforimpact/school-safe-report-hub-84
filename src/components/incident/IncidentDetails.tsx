
import React from 'react';
import { Incident, IncidentStatus, ContributingFactor, Action } from '@/types/incident';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { BanIcon } from 'lucide-react';

import IncidentDetailsHeader from './details/IncidentDetailsHeader';
import IncidentMetadata from './details/IncidentMetadata';
import IncidentDescription from './details/IncidentDescription';
import RootCauseDisplay from './details/RootCauseDisplay';
import ContributingFactorsDisplay from './details/ContributingFactorsDisplay';
import ActionsList from './ActionsList';
import IncidentClosureForm from './IncidentClosureForm';
import PeopleInvolved from './PeopleInvolved';

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
    learningPoints: string;
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
    learningPoints: string;
    contributingFactors: ContributingFactor[];
    actions: Action[];
  }) => {
    if (onClosureFormSubmit) {
      onClosureFormSubmit(data);
    } else {
      updateIncident(incident.id, {
        status: 'Closed',
        rootCause: data.rootCause,
        learningPoints: data.learningPoints,
        contributingFactors: data.contributingFactors,
        actions: data.actions
      });
      
      setFormOpen(false);
    }
  };

  console.log(incident,"incidentData");
  
  
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

          {/* People Involved section */}
          {incident.peopleInvolved && incident.peopleInvolved.length > 0 && (
            <div className="pb-3">
              <PeopleInvolved people={incident.peopleInvolved} />
            </div>
          )}

          {/* Show closure information only if the incident is closed */}
          {incident.status === 'Closed' && (
            <div className="mt-6 space-y-6 border-t pt-6">
              {/* Root cause section */}
              {incident.rootCause && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Root Cause Analysis</h3>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="whitespace-pre-wrap text-sm">{incident.rootCause}</p>
                  </div>
                </div>
              )}

              {/* Learning Points section - only show if learning points exist */}
              {incident.learningPoints && incident.learningPoints.trim() && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Learning Points</h3>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="whitespace-pre-wrap text-sm">{incident.learningPoints}</p>
                  </div>
                </div>
              )}

              {/* Contributing factors section */}
              {incident.contributingFactors && incident.contributingFactors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Contributing Factors</h3>
                  <div className="space-y-2">
                    {incident.contributingFactors.map(factor => (
                      <div key={factor.id} className="border p-3 rounded-md bg-muted/30">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{factor.category}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            factor.weight === 'High' ? 'bg-red-100 text-red-800' :
                            factor.weight === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {factor.weight} Impact
                          </span>
                        </div>
                        <p className="text-sm mt-1 text-muted-foreground">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions taken section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Actions Taken</h3>
                {incident.actions && incident.actions.length > 0 ? (
                  <div className="space-y-3">
                    {incident.actions.map((action, index) => (
                      <div key={index} className="border-l-4 border-primary/20 pl-4 py-2">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">Action {index + 1}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(action.date)}
                          </span>
                        </div>
                        <p className="text-sm mb-1">{action.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Responsible: {action.responsiblePerson}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No actions recorded yet.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
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
