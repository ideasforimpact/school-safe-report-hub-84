
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import IncidentStatusChart from '@/components/charts/IncidentStatusChart';

const IncidentStatusSection: React.FC = () => {
  return (
    <Card className="border-none shadow-card h-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-medium">Incident Status</CardTitle>
      </CardHeader>
      <CardContent>
        <IncidentStatusChart />
      </CardContent>
    </Card>
  );
};

export default IncidentStatusSection;
