
import React from 'react';
import { Incident, IncidentStatus } from '@/types/incident';
import {
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

interface IncidentDetailsHeaderProps {
  title?: string;
  description?: string;
}

const IncidentDetailsHeader: React.FC<IncidentDetailsHeaderProps> = ({
  title = "Incident Details",
  description = "View and update incident information"
}) => {
  return (
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>
        {description}
      </CardDescription>
    </CardHeader>
  );
};

export default IncidentDetailsHeader;
