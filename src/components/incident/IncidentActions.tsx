
import React from 'react';
import { Incident, Action } from '@/types/incident';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import AddActionForm from './AddActionForm';

interface IncidentActionsProps {
  incident: Incident;
  handleActionSubmit: (action: Action) => void;
}

const IncidentActions: React.FC<IncidentActionsProps> = ({
  incident,
  handleActionSubmit
}) => {
  return (
    <div className="space-y-6">
      {/* Form to add new actions */}
      <AddActionForm onSubmit={handleActionSubmit} />
    </div>
  );
};

export default IncidentActions;
