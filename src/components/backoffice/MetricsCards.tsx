
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsCardsProps {
  totalClients: number;
  activeClients: number;
  totalIncidents: number;
  recentLogins: number;
}

const MetricsCards: React.FC<MetricsCardsProps> = ({ 
  totalClients, 
  activeClients, 
  totalIncidents, 
  recentLogins 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Total Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalClients}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {activeClients} active
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Total Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalIncidents}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across all clients
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Recent Logins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{recentLogins}</div>
          <p className="text-xs text-muted-foreground mt-1">
            In the last 24 hours
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
            <span className="font-medium">Operational</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All systems running normally
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsCards;
