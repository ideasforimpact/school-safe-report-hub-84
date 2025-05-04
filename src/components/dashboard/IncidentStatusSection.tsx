
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import IncidentStatusChart from '@/components/charts/IncidentStatusChart';

interface IncidentStatusSectionProps {
  title?: string;
}

const IncidentStatusSection: React.FC<IncidentStatusSectionProps> = ({ 
  title = "Incident Status" 
}) => {
  return (
    <Card className="border-none shadow-card h-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <IncidentStatusChart />
      </CardContent>
    </Card>
  );
};

export default IncidentStatusSection;
