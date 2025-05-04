
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface OpenIncidentsCardProps {
  openIncidents: number;
  totalIncidents: number;
}

const OpenIncidentsCard: React.FC<OpenIncidentsCardProps> = ({ openIncidents, totalIncidents }) => {
  return (
    <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-medium">Open Incidents</CardTitle>
          <div className="bg-red-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
          </div>
        </div>
        <CardDescription>Awaiting action</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl md:text-3xl font-semibold text-primary-700">{openIncidents}</p>
        <div className="h-2 w-full bg-gray-100 rounded-full mt-2 mb-1">
          <div 
            className="h-2 bg-primary-500 rounded-full" 
            style={{width: `${Math.min(100, (openIncidents / Math.max(totalIncidents, 1)) * 100)}%`}}
          ></div>
        </div>
        <p className="text-xs text-gray-500">
          {Math.round((openIncidents / Math.max(totalIncidents, 1)) * 100)}% of total incidents
        </p>
      </CardContent>
    </Card>
  );
};

export default OpenIncidentsCard;
