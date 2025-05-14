
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VerificationDocument } from '@/types/employeeVerification';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface AadharDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aadharDetails: any;
}

const AadharDetailsDialog: React.FC<AadharDetailsDialogProps> = ({
  open,
  onOpenChange,
  aadharDetails
}) => {
  if (!aadharDetails) {
    return null;
  }

  // Function to format data for display
  const formatData = () => {
    if (!aadharDetails) return {};
    
    try {
      if (aadharDetails.action === 'aadhar_verification_success') {
        const data = aadharDetails.response?.data || {};
        return {
          fullName: data.full_name,
          dob: data.dob,
          gender: data.gender,
          address: data.address?.full,
          parentName: data.parent_name,
          mobileHash: data.mobile_hash,
          emailHash: data.email_hash,
          photoLink: data.photo_link,
          maskedAadhaar: data.masked_aadhaar,
          careOf: data.care_of,
          country: data.country,
          district: data.district,
          house: data.house,
          landmark: data.landmark,
          pincode: data.pincode,
          postOffice: data.po,
          state: data.state,
          street: data.street,
          subDistrict: data.sub_district,
          vtc: data.vtc
        };
      }
      else if (aadharDetails.action === 'pan_verification_success') {
        const data = aadharDetails.response?.data || {};
        return {
          fullName: data.full_name || data.name,
          dob: data.dob,
          gender: data.gender,
          address: data.address?.full,
          category: data.category,
          panStatus: data.status,
          lastUpdated: data.last_updated,
          maskedAadhaar: data.masked_aadhaar,
          aadhaarLinked: data.aadhaar_linked,
          fullNameSplit: data.full_name_split,
        };
      }
      else {
        // For any other logs
        return aadharDetails.response || {};
      }
    } catch (error) {
      console.error("Error formatting verification data:", error);
      return {};
    }
  };
  
  const data = formatData();
  const isAadhar = aadharDetails.action === 'aadhar_verification_success';
  const isPan = aadharDetails.action === 'pan_verification_success';
  const docType = isAadhar ? 'Aadhar' : isPan ? 'PAN Card' : 'Document';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{docType} Verification Details</DialogTitle>
          <DialogDescription>
            Verified on {aadharDetails?.timestamp ? format(new Date(aadharDetails.timestamp), 'PP pp') : 'Unknown date'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] md:h-[450px] rounded-md border p-4 my-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">{isAadhar ? 'Aadhar' : isPan ? 'PAN' : 'Document'} Information</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.fullName && (
                  <div className="text-sm">
                    <span className="text-gray-500">Full Name:</span> {data.fullName}
                  </div>
                )}
                
                {data.dob && (
                  <div className="text-sm">
                    <span className="text-gray-500">Date of Birth:</span> {data.dob}
                  </div>
                )}
                
                {data.gender && (
                  <div className="text-sm">
                    <span className="text-gray-500">Gender:</span> {data.gender}
                  </div>
                )}
                
                {data.maskedAadhaar && (
                  <div className="text-sm">
                    <span className="text-gray-500">Masked Aadhaar:</span> {data.maskedAadhaar}
                  </div>
                )}

                {isPan && data.category && (
                  <div className="text-sm">
                    <span className="text-gray-500">Category:</span> {data.category}
                  </div>
                )}
                
                {isPan && data.panStatus && (
                  <div className="text-sm">
                    <span className="text-gray-500">PAN Status:</span> {data.panStatus}
                  </div>
                )}
                
                {isPan && data.lastUpdated && (
                  <div className="text-sm">
                    <span className="text-gray-500">Last Updated:</span> {data.lastUpdated}
                  </div>
                )}
                
                {isPan && data.aadhaarLinked !== undefined && (
                  <div className="text-sm">
                    <span className="text-gray-500">Aadhaar Linked:</span> {data.aadhaarLinked ? 'Yes' : 'No'}
                  </div>
                )}
              </div>
            </div>
            
            {isAadhar && data.address && (
              <div>
                <h3 className="text-lg font-medium">Address Details</h3>
                <Separator className="my-2" />
                <p className="text-sm whitespace-pre-line">{data.address}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {data.house && (
                    <div className="text-sm">
                      <span className="text-gray-500">House:</span> {data.house}
                    </div>
                  )}
                  
                  {data.street && (
                    <div className="text-sm">
                      <span className="text-gray-500">Street:</span> {data.street}
                    </div>
                  )}
                  
                  {data.landmark && (
                    <div className="text-sm">
                      <span className="text-gray-500">Landmark:</span> {data.landmark}
                    </div>
                  )}
                  
                  {data.district && (
                    <div className="text-sm">
                      <span className="text-gray-500">District:</span> {data.district}
                    </div>
                  )}
                  
                  {data.subDistrict && (
                    <div className="text-sm">
                      <span className="text-gray-500">Sub-District:</span> {data.subDistrict}
                    </div>
                  )}
                  
                  {data.vtc && (
                    <div className="text-sm">
                      <span className="text-gray-500">VTC:</span> {data.vtc}
                    </div>
                  )}
                  
                  {data.postOffice && (
                    <div className="text-sm">
                      <span className="text-gray-500">Post Office:</span> {data.postOffice}
                    </div>
                  )}
                  
                  {data.state && (
                    <div className="text-sm">
                      <span className="text-gray-500">State:</span> {data.state}
                    </div>
                  )}
                  
                  {data.pincode && (
                    <div className="text-sm">
                      <span className="text-gray-500">Pincode:</span> {data.pincode}
                    </div>
                  )}
                  
                  {data.country && (
                    <div className="text-sm">
                      <span className="text-gray-500">Country:</span> {data.country}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {isAadhar && data.careOf && (
              <div>
                <h3 className="text-lg font-medium">Additional Information</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Care Of:</span> {data.careOf}
                  </div>
                  
                  {data.parentName && (
                    <div className="text-sm">
                      <span className="text-gray-500">Parent Name:</span> {data.parentName}
                    </div>
                  )}
                  
                  {data.mobileHash && (
                    <div className="text-sm">
                      <span className="text-gray-500">Mobile Hash:</span> {data.mobileHash}
                    </div>
                  )}
                  
                  {data.emailHash && (
                    <div className="text-sm">
                      <span className="text-gray-500">Email Hash:</span> {data.emailHash}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {isPan && Array.isArray(data.fullNameSplit) && data.fullNameSplit.length > 0 && (
              <div>
                <h3 className="text-lg font-medium">Name Details</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 gap-2">
                  {data.fullNameSplit.map((namePart, index) => (
                    namePart && <div key={index} className="text-sm">
                      <span className="text-gray-500">
                        {index === 0 ? 'First Name:' : 
                         index === data.fullNameSplit.length - 1 ? 'Last Name:' : 'Middle Name:'}
                      </span> {namePart}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AadharDetailsDialog;
