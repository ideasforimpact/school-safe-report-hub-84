
import React, { useState } from 'react';
import { Action } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import IncidentActions from './IncidentActions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ActionsList from './ActionsList';

interface ActionsManagerProps {
  incidentId: string;
  actions: Action[];
  handleActionSubmit: (action: Action) => void;
  // This component is now only meant to be used during incident closure
  closureMode?: boolean;
}

const ActionsManager: React.FC<ActionsManagerProps> = ({
  incidentId,
  actions,
  handleActionSubmit,
  closureMode = false // Default to false, only true during closure
}) => {
  // Do not render this component unless we're in closure mode
  if (!closureMode) {
    return (
      <Alert>
        <AlertDescription>
          Actions can only be added when closing an incident.
        </AlertDescription>
      </Alert>
    );
  }

  // State to toggle the action form visibility
  const [isAddingAction, setIsAddingAction] = useState(false);

  // Format dates for consistent display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Actions Taken</h2>
        <Button 
          onClick={() => setIsAddingAction(!isAddingAction)} 
          variant={isAddingAction ? "outline" : "default"}
          size="sm"
        >
          {isAddingAction ? "Cancel" : (
            <>
              <PlusCircle className="mr-1" />
              Add Action
            </>
          )}
        </Button>
      </div>

      {/* Show action form when isAddingAction is true */}
      {isAddingAction && (
        <IncidentActions 
          incident={{ id: incidentId, actions: actions } as any} 
          handleActionSubmit={(action) => {
            handleActionSubmit(action);
            setIsAddingAction(false); // Close form after submission
          }} 
        />
      )}

      {/* Display message if no actions */}
      {!isAddingAction && (!actions || actions.length === 0) && (
        <Alert>
          <AlertDescription>
            No actions have been recorded for this incident yet. Click "Add Action" to record steps taken to address this incident.
          </AlertDescription>
        </Alert>
      )}

      {/* Show existing actions when not adding a new one */}
      {!isAddingAction && actions && actions.length > 0 && (
        <ActionsList actions={actions} formatDate={formatDate} />
      )}
    </div>
  );
};

export default ActionsManager;
