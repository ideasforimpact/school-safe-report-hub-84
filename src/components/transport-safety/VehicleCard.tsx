
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, FileCog } from 'lucide-react';
import { Vehicle } from '@/types/transportSafety';
import { Link } from 'react-router-dom';
import VehicleStatusBadge from './VehicleStatusBadge';
import DocumentStatusSummary from './DocumentStatusSummary';
import VehicleTypeIcon from './VehicleTypeIcon';
import { cn } from '@/lib/utils';

interface VehicleCardProps {
  vehicle: Vehicle;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  const { id, registrationNumber, make, model, type, status, documents } = vehicle;

  const hasExpiredDocs = documents.some(doc => doc.status === 'expired');
  const hasExpiringDocs = !hasExpiredDocs && documents.some(doc => doc.status === 'expiring_soon');

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow",
      hasExpiredDocs ? "border-red-200" : hasExpiringDocs ? "border-yellow-200" : "border-gray-200"
    )}>
      <CardContent className="p-0">
        <div className="flex items-start p-4">
          <div className="flex-shrink-0 mr-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <VehicleTypeIcon type={type} />
            </div>
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium">{make} {model}</h3>
              <VehicleStatusBadge status={status} />
            </div>
            <p className="text-gray-700 font-medium mt-1">{registrationNumber}</p>
          </div>
        </div>
        
        <div className={cn(
          "px-4 py-2 border-t",
          hasExpiredDocs ? "bg-red-50" : hasExpiringDocs ? "bg-yellow-50" : "bg-gray-50"
        )}>
          <DocumentStatusSummary documents={documents} />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between p-2 bg-gray-50 border-t">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/transport-safety/${id}`}>
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="sm">
          <Link to={`/transport-safety/${id}/documents`}>
            <FileCog className="h-4 w-4 mr-1" />
            Manage Documents
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VehicleCard;
