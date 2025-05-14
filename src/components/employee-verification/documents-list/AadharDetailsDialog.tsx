
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface AadharAddress {
  country?: string;
  state?: string;
  dist?: string;
  po?: string;
  loc?: string;
  vtc?: string;
  subdist?: string;
  street?: string;
  house?: string;
  landmark?: string;
  zip?: string;
}

interface AadharResponse {
  data?: {
    full_name?: string;
    aadhaar_number?: string;
    dob?: string;
    gender?: string;
    address?: AadharAddress;
    care_of?: string;
    profile_image?: string;
    has_image?: boolean;
    mobile_verified?: boolean;
  };
  success?: boolean;
  message?: string;
  message_code?: string;
}

interface AadharDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aadharDetails: {
    timestamp?: string;
    action?: string;
    response?: AadharResponse;
  } | null;
}

const AadharDetailsDialog: React.FC<AadharDetailsDialogProps> = ({
  open,
  onOpenChange,
  aadharDetails,
}) => {
  if (!aadharDetails?.response?.data) {
    return null;
  }

  const { data } = aadharDetails.response;
  const address = data.address || {};
  const formattedAddress = [
    address.house,
    address.street,
    address.landmark,
    address.loc,
    address.vtc,
    address.subdist,
    address.dist,
    address.state,
    address.zip,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

  const verificationDate = aadharDetails.timestamp ? 
    format(new Date(aadharDetails.timestamp), 'PPP p') : 
    'Unknown';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aadhaar Verification Details</DialogTitle>
          <DialogDescription>
            Verified through government Aadhaar database on {verificationDate}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-1">
            {data.profile_image && (
              <div className="flex justify-center mb-4">
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <img 
                    src={data.profile_image} 
                    alt="Aadhaar Profile" 
                    className="w-32 h-32 object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900">Full Name</h4>
                <p className="text-base">{data.full_name || 'N/A'}</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900">Aadhaar Number</h4>
                <p className="text-base">{data.aadhaar_number || 'N/A'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900">Date of Birth</h4>
                  <p className="text-base">{data.dob || 'N/A'}</p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900">Gender</h4>
                  <p className="text-base">{data.gender || 'N/A'}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900">Care of</h4>
                <p className="text-base">{data.care_of || 'N/A'}</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900">Address</h4>
                <p className="text-base">{formattedAddress || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900">Mobile Verified</h4>
                  <p className="text-base">{data.mobile_verified ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700">Verification Method</h4>
              <p className="text-sm text-gray-600">Government Aadhaar API Verification</p>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AadharDetailsDialog;
