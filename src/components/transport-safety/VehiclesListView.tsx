
import React from 'react';
import { Vehicle } from '@/types/transportSafety';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, FileCog, FileCheck, FileX, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import VehicleStatusBadge from './VehicleStatusBadge';
import VehicleTypeIcon from './VehicleTypeIcon';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/lib/utils';

interface VehiclesListViewProps {
  vehicles: Vehicle[];
}

const VehiclesListView: React.FC<VehiclesListViewProps> = ({ vehicles }) => {
  const { paginatedItems, currentPage, setCurrentPage, totalPages } = usePagination(vehicles, 10);

  const getDocumentStatus = (vehicle: Vehicle, docType: string) => {
    const document = vehicle.documents.find(doc => doc.type === docType);
    return document ? document.status : 'missing';
  };

  const getDocumentIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <FileCheck className="h-4 w-4 text-green-600" />;
      case 'expired':
        return <FileX className="h-4 w-4 text-red-600" />;
      case 'expiring_soon':
        return <ShieldAlert className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileX className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'expired':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'expiring_soon':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-left">Type</TableHead>
              <TableHead className="text-left">Vehicle Details</TableHead>
              <TableHead className="w-[160px] text-left">Registration</TableHead>
              <TableHead className="w-[100px] text-left">Status</TableHead>
              <TableHead className="w-[180px] text-left">Documents</TableHead>
              <TableHead className="w-[100px] text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((vehicle) => {
              const insuranceStatus = getDocumentStatus(vehicle, 'insurance');
              const fcStatus = getDocumentStatus(vehicle, 'fitness');
              const pollutionStatus = getDocumentStatus(vehicle, 'pollution');
              const challanStatus = getDocumentStatus(vehicle, 'registration');

              return (
                <TableRow 
                  key={vehicle.id}
                  className={cn(
                    "hover:bg-muted/50",
                    vehicle.documents.some(doc => doc.status === 'expired') ? "bg-red-50" : 
                    vehicle.documents.some(doc => doc.status === 'expiring_soon') ? "bg-yellow-50" : ""
                  )}
                >
                  <TableCell>
                    <div className="bg-gray-100 p-2 rounded-lg inline-flex">
                      <VehicleTypeIcon type={vehicle.type} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                    <div className="text-xs text-gray-500">Capacity: {vehicle.capacity}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-700">{vehicle.registrationNumber}</div>
                  </TableCell>
                  <TableCell>
                    <VehicleStatusBadge status={vehicle.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant="outline" className={cn("text-xs flex items-center gap-1 px-2 py-1", getDocumentStatusColor(insuranceStatus))}>
                        {getDocumentIcon(insuranceStatus)}
                        <span>Ins</span>
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs flex items-center gap-1 px-2 py-1", getDocumentStatusColor(fcStatus))}>
                        {getDocumentIcon(fcStatus)}
                        <span>FC</span>
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs flex items-center gap-1 px-2 py-1", getDocumentStatusColor(pollutionStatus))}>
                        {getDocumentIcon(pollutionStatus)}
                        <span>PUC</span>
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs flex items-center gap-1 px-2 py-1", getDocumentStatusColor(challanStatus))}>
                        {getDocumentIcon(challanStatus)}
                        <span>RC</span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/transport-safety/${vehicle.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default VehiclesListView;
