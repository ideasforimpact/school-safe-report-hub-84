
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
import { Eye, FileCog } from 'lucide-react';
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

  const getDocumentStatusIndicator = (vehicle: Vehicle) => {
    const hasExpiredDocs = vehicle.documents.some(doc => doc.status === 'expired');
    const hasExpiringDocs = !hasExpiredDocs && vehicle.documents.some(doc => doc.status === 'expiring_soon');
    
    if (hasExpiredDocs) {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Expired documents</Badge>;
    } else if (hasExpiringDocs) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Expiring soon</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Valid documents</Badge>;
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
              <TableHead className="w-[140px] text-left">Status</TableHead>
              <TableHead className="text-left">Documents</TableHead>
              <TableHead className="w-[180px] text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((vehicle) => (
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
                  {getDocumentStatusIndicator(vehicle)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-start gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/transport-safety/${vehicle.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/transport-safety/${vehicle.id}/documents`}>
                        <FileCog className="h-4 w-4 mr-1" />
                        Docs
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
