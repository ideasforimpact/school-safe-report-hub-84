
import React from 'react';
import { Incident, Action } from '@/types/incident';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import ActionsList from './ActionsList';

interface IncidentActionsProps {
  incident: Incident;
  handleActionSubmit: (action: Action) => void;
}

const IncidentActions: React.FC<IncidentActionsProps> = ({
  incident,
  handleActionSubmit
}) => {
  // Use the formatDate function from the parent component
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <ActionsList 
        actions={incident.actions || []} 
        formatDate={formatDate} 
      />
    </div>
  );
};

export default IncidentActions;
