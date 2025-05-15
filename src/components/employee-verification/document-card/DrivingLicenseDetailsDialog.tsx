
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface DrivingLicenseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licenseDetails: any;
  documentId?: string;
}

const DrivingLicenseDetailsDialog: React.FC<DrivingLicenseDetailsDialogProps> = ({
  open,
  onOpenChange,
  licenseDetails,
  documentId
}) => {
  // Extract relevant information from the driving license response
  const data = licenseDetails?.data || {};
  const isSuccessful = licenseDetails?.success && licenseDetails?.status_code === 200;
  
  // For debugging
  console.log('DrivingLicenseDetailsDialog - licenseDetails:', licenseDetails);
  console.log('DrivingLicenseDetailsDialog - data:', data);
  console.log('DrivingLicenseDetailsDialog - isSuccessful:', isSuccessful);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Driving License Details</span>
            {isSuccessful && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Verified
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Details retrieved from government database for driving license {data?.license_number || 'verification'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] rounded-md border">
          {isSuccessful || Object.keys(data).length > 0 ? (
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Field</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(data).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                      <TableCell>{String(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-lg text-red-500">Verification failed or no data available</p>
              <p className="text-gray-600 mt-2">
                {licenseDetails?.message || "No verification details available"}
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DrivingLicenseDetailsDialog;
