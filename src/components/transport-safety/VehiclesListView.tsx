
import React, { useEffect } from 'react';
import { Vehicle } from '@/types/transportSafety';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, FileCog, FileCheck, FileX, ShieldAlert, FileWarning, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import VehicleStatusBadge from './VehicleStatusBadge';
import VehicleTypeIcon from './VehicleTypeIcon';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/lib/utils';

interface VehiclesListViewProps {
  vehicles: Vehicle[];
}

const VehiclesListView: React.FC<VehiclesListViewProps> = ({
  vehicles
}) => {
  const {
    paginatedItems,
    currentPage,
    setCurrentPage,
    totalPages
  } = usePagination(vehicles, 10);

  // Add effect to log vehicles info when component mounts or vehicles change
  useEffect(() => {
    console.log("Vehicles data:", vehicles);
    if (vehicles.length > 0) {
      const sampleVehicle = vehicles[0];
      console.log("Sample vehicle verification_log:", sampleVehicle.verification_log);
      
      // Check if we have proper verification log data
      if (sampleVehicle.verification_log && sampleVehicle.verification_log.last_response) {
        try {
          const response = sampleVehicle.verification_log.last_response;
          console.log("Verification last_response type:", typeof response);
          if (typeof response === 'string') {
            const parsedData = JSON.parse(response);
            console.log("Parsed verification data:", parsedData);
            console.log("FC expiry date (fit_up_to):", parsedData.fit_up_to);
            console.log("Insurance expiry date (insurance_upto):", parsedData.insurance_upto);
          }
        } catch (e) {
          console.error("Error parsing verification data:", e);
        }
      }
    }
  }, [vehicles]);

  const getDocumentStatus = (vehicle: Vehicle, docType: string) => {
    const document = vehicle.documents.find(doc => doc.type === docType);
    
    // If we have verification_log data, use it for more accurate status
    if (vehicle.verification_log && vehicle.verification_log.last_response) {
      const currentDate = new Date();
      console.log(`Checking ${docType} status for vehicle ${vehicle.registrationNumber}`);
      
      // Check fitness certificate (FC)
      if (docType === 'fitness' && vehicle.verification_log.last_response) {
        try {
          const data = vehicle.verification_log.last_response;
          console.log(`${docType} verification data:`, data);
          
          if (typeof data === 'string') {
            const parsedData = JSON.parse(data);
            console.log(`Parsed ${docType} data:`, parsedData);
            
            if (parsedData && parsedData.fit_up_to) {
              const fitUpToDate = new Date(parsedData.fit_up_to);
              console.log(`${docType} expiry date:`, fitUpToDate, "Current date:", currentDate);
              
              if (!isNaN(fitUpToDate.getTime())) {
                if (fitUpToDate < currentDate) {
                  console.log(`${docType} is EXPIRED`);
                  return 'expired';
                } else {
                  // Check if expiring in 30 days
                  const thirtyDaysFromNow = new Date();
                  thirtyDaysFromNow.setDate(currentDate.getDate() + 30);
                  const status = fitUpToDate < thirtyDaysFromNow ? 'expiring_soon' : 'valid';
                  console.log(`${docType} is ${status.toUpperCase()}`);
                  return status;
                }
              }
            }
          }
        } catch (e) {
          console.error(`Error parsing ${docType} data:`, e);
        }
      }
      
      // Check insurance
      if (docType === 'insurance' && vehicle.verification_log.last_response) {
        try {
          const data = vehicle.verification_log.last_response;
          console.log(`${docType} verification data:`, data);
          
          if (typeof data === 'string') {
            const parsedData = JSON.parse(data);
            console.log(`Parsed ${docType} data:`, parsedData);
            
            if (parsedData && parsedData.insurance_upto) {
              const insuranceUpToDate = new Date(parsedData.insurance_upto);
              console.log(`${docType} expiry date:`, insuranceUpToDate, "Current date:", currentDate);
              
              if (!isNaN(insuranceUpToDate.getTime())) {
                if (insuranceUpToDate < currentDate) {
                  console.log(`${docType} is EXPIRED`);
                  return 'expired';
                } else {
                  // Check if expiring in 30 days
                  const thirtyDaysFromNow = new Date();
                  thirtyDaysFromNow.setDate(currentDate.getDate() + 30);
                  const status = insuranceUpToDate < thirtyDaysFromNow ? 'expiring_soon' : 'valid';
                  console.log(`${docType} is ${status.toUpperCase()}`);
                  return status;
                }
              }
            }
          }
        } catch (e) {
          console.error(`Error parsing ${docType} data:`, e);
        }
      }
    }
    
    // Fallback to document status if verification_log doesn't have the data
    return document ? document.status : 'missing';
  };

  const hasChallan = (vehicle: Vehicle) => {
    // Check for any specific notes or properties that indicate a challan
    return vehicle.documents.some(doc => 
      doc.notes?.toLowerCase().includes('challan') || 
      doc.issuedBy?.toLowerCase().includes('police') ||
      doc.provider?.toLowerCase().includes('police')
    );
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

  return <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-left">Type</TableHead>
              <TableHead className="text-left">Vehicle Details</TableHead>
              <TableHead className="w-[160px] text-left">Registration</TableHead>
              <TableHead className="w-[100px] text-left">Status</TableHead>
              <TableHead className="w-[180px] text-left">Documents</TableHead>
              <TableHead className="w-[80px] text-left">Challan</TableHead>
              <TableHead className="w-[60px] text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map(vehicle => {
            const insuranceStatus = getDocumentStatus(vehicle, 'insurance');
            const fcStatus = getDocumentStatus(vehicle, 'fitness');
            const pollutionStatus = getDocumentStatus(vehicle, 'pollution');
            const challanStatus = getDocumentStatus(vehicle, 'registration');
            const vehicleHasChallan = hasChallan(vehicle);

            const hasExpired = insuranceStatus === 'expired' || fcStatus === 'expired' || 
                              pollutionStatus === 'expired' || challanStatus === 'expired';
            const hasExpiringSoon = !hasExpired && (insuranceStatus === 'expiring_soon' || 
                                  fcStatus === 'expiring_soon' || pollutionStatus === 'expiring_soon' || 
                                  challanStatus === 'expiring_soon');
            
            console.log(`Vehicle ${vehicle.registrationNumber} status summary:`, {
              insurance: insuranceStatus,
              fc: fcStatus,
              pollution: pollutionStatus,
              challan: challanStatus,
              hasExpired,
              hasExpiringSoon
            });
            
            const rowClassName = cn(
              "hover:bg-muted/50", 
              hasExpired ? "bg-red-50 border-l-4 border-l-red-500" : 
              hasExpiringSoon ? "bg-yellow-50 border-l-4 border-l-yellow-500" : 
              "border-l-4 border-l-green-500"
            );
            
            console.log(`Applied row class for ${vehicle.registrationNumber}:`, rowClassName);

            return <TableRow key={vehicle.id} className={rowClassName}>
                  <TableCell>
                    <div className="bg-gray-100 p-2 rounded-lg inline-flex">
                      <VehicleTypeIcon type={vehicle.type} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-left">
                      <div className="text-left">
                        <div className="font-medium text-left">{vehicle.make} {vehicle.model}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="text-sm font-medium text-gray-700 text-left">{vehicle.registrationNumber}</div>
                  </TableCell>
                  <TableCell className="text-left">
                    <VehicleStatusBadge status={vehicle.status} />
                  </TableCell>
                  <TableCell className="text-left">
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
                  <TableCell className="text-left">
                    {vehicleHasChallan ? (
                      <Badge variant="outline" className="bg-orange-100 border-orange-200 text-orange-800 text-xs flex items-center gap-1">
                        <Flag className="h-4 w-4 text-orange-600" />
                        <span>Yes</span>
                      </Badge>
                    ) : (
                      <span className="text-gray-500 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex justify-start">
                      <Button asChild variant="ghost" size="icon">
                        <Link to={`/transport-safety/${vehicle.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>;
          })}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </Button>
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>}
    </div>;
};

export default VehiclesListView;
