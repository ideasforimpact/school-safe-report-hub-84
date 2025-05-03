
import React from 'react';
import { Incident } from '@/types/incident';
import { AlertOctagon, Clock, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import PeopleInvolved from './PeopleInvolved';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface IncidentDetailsCardProps {
  incident: Incident;
  formatDate: (date: Date) => string;
}

const IncidentDetailsCard: React.FC<IncidentDetailsCardProps> = ({
  incident,
  formatDate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">Description</h3>
          <p className="mt-1">{incident.description}</p>

          {/* Display incident image if available */}
          {incident.image && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Image Documentation</h3>
              <img 
                src={incident.image} 
                alt="Incident documentation" 
                className="max-w-full h-auto rounded-md border" 
              />
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-2">
            <AlertOctagon className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <p className="font-medium">Type & Category</p>
              <p className="text-gray-600">{incident.type} / {incident.category}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Clock className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <p className="font-medium">Date & Time of Occurrence</p>
              <p className="text-gray-600">{formatDate(incident.date)}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <MapPin className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-gray-600">{incident.location}</p>
            </div>
          </div>
        </div>

        <Separator />
        
        <PeopleInvolved people={incident.peopleInvolved} />
      </CardContent>
    </Card>
  );
};

export default IncidentDetailsCard;
