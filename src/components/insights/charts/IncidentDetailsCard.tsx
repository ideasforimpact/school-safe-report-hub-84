
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Incident } from '@/types/incident';
import { formatDate } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeClass } from '@/utils/statusUtils';

interface IncidentDetailsCardProps {
  incidents: Incident[];
  title?: string;
  description?: string;
}

const IncidentDetailsCard: React.FC<IncidentDetailsCardProps> = ({ 
  incidents, 
  title = "Recent Incidents",
  description = "Details of the most recent incidents reported"
}) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {incidents.length > 0 ? (
              incidents.map(incident => (
                <div key={incident.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{incident.ticketId}</div>
                    <Badge className={getStatusBadgeClass(incident.status, incident.isVoided)}>
                      {incident.isVoided ? 'Voided' : incident.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-1">
                    {formatDate(incident.date)} - {incident.location}
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="outline" className="bg-blue-50">
                      {incident.type}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50">
                      {incident.category}
                    </Badge>
                    {incident.priority && (
                      <Badge variant={
                        incident.priority === 'Critical' ? 'destructive' : 
                        incident.priority === 'High' ? 'default' :
                        incident.priority === 'Medium' ? 'secondary' : 'outline'
                      }>
                        {incident.priority}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="mt-2 text-sm line-clamp-2">
                    {incident.description}
                  </p>
                  
                  {incident.peopleInvolved?.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      People involved: {incident.peopleInvolved.length}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No incidents found matching your criteria
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default IncidentDetailsCard;
