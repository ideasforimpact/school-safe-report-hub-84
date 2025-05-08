
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DocumentStatusBadge from '@/components/transport-safety/DocumentStatusBadge';
import { Vehicle } from '@/types/transportSafety';

interface VehicleDocumentsCardProps {
  vehicle: Vehicle;
}

const VehicleDocumentsCard: React.FC<VehicleDocumentsCardProps> = ({ vehicle }) => {
  const { id: vehicleId, documents } = vehicle;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-left">Document Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map(document => (
            <div key={document.id} className="flex justify-between items-center">
              <div className="text-left">
                <div className="font-medium text-left">
                  {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
                </div>
                <div className="text-sm text-gray-500 text-left">
                  Expires: {new Date(document.expiryDate).toLocaleDateString()}
                </div>
              </div>
              <DocumentStatusBadge status={document.status} />
            </div>
          ))}
          
          <Button asChild className="w-full mt-2">
            <Link to={`/transport-safety/${vehicleId}/documents`}>
              <FileText className="h-4 w-4 mr-2" />
              Manage Documents
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleDocumentsCard;
